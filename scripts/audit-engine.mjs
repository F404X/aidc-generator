/** Audit all A404DC catalog IDs against the actual pinned bwip-js encoder. */
import {writeFile,appendFile} from 'node:fs/promises';
import bwipjs from 'bwip-js';
import {FORMATS} from '../src/catalog.mjs';
import {prepareBarcodePayload} from '../src/validation.mjs';
import {encodeRmqr,REQUIRED_OPTIONS} from '../src/symbology-options.mjs';
const results=[];
for(const format of FORMATS){
 const sample=format.example;
 if(!sample || /^(Structured |Swiss payment fields|GS1 coupon data|BWIPP raw patterns)/i.test(sample)){
   results.push({id:format.id,status:'NEEDS_FIXTURE',sample,detail:'A standards-compliant structured test record is needed'});
   continue;
 }
 try{
  const text=prepareBarcodePayload(format,sample);
  const options={bcid:format.id,text,scale:2,height:14,...(REQUIRED_OPTIONS[format.id]||{})};
  const svg=format.id==='rectangularmicroqrcode' ? encodeRmqr(o=>bwipjs.toSVG(o),options) : bwipjs.toSVG(options);
  if(!svg.includes('<svg')||svg.length<100)throw Error('Empty or invalid SVG returned');
  results.push({id:format.id,status:'PASS',sample,svgBytes:svg.length});
 }catch(error){results.push({id:format.id,status:'FAIL',sample,detail:String(error?.message||error)});}
}
const summary=Object.fromEntries(['PASS','FAIL','NEEDS_FIXTURE'].map(s=>[s,results.filter(x=>x.status===s).length]));
await writeFile('catalog-audit-report.json',JSON.stringify({version:'1.3.0',engine:'bwip-js@4.11.4',total:results.length,summary,results},null,2));
for(const r of results)console.log(r.status.padEnd(13),r.id.padEnd(35),r.detail||'');
console.log('TOTAL',results.length,JSON.stringify(summary));
if(process.env.GITHUB_STEP_SUMMARY){
 const rows=['## A404DC — full 110-format encoder audit','','| Format | Result | Reason |','|---|---|---|',...results.map(r=>'| '+r.id+' | '+r.status+' | '+String(r.detail||'').replaceAll('|','/').slice(0,160)+' |'),''];
 await appendFile(process.env.GITHUB_STEP_SUMMARY,rows.join('\n'));
}
if(summary.FAIL)process.exitCode=1;
