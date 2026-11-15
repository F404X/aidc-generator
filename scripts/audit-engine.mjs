/** Encode the *same examples* used by the lazy catalog thumbnails with the real bwip-js engine. */
import {writeFile,appendFile,readFile} from 'node:fs/promises';
import bwipjs from 'bwip-js';
import {FORMATS} from '../src/catalog.mjs';
import {thumbnailSamples} from '../src/thumbnails.mjs';
import {prepareBarcodePayload} from '../src/validation.mjs';
import {REQUIRED_OPTIONS} from '../src/symbology-options.mjs';

const results=[];
for(const format of FORMATS){
  const candidates=thumbnailSamples(format);
  let success=null, lastError='';
  for(const sample of candidates){
    try{
      const options={
        bcid:format.id,
        text:prepareBarcodePayload(format,sample),
        scale:1,
        includetext:false,
        paddingwidth:2,
        paddingheight:2,
        barcolor:'151515',
        ...(format.kind==='linear'?{height:10}:{}),
        ...(REQUIRED_OPTIONS[format.id]||{}),
      };
      if(['datamatrix','gs1datamatrix','hibcdatamatrix'].includes(format.id)){
        options.format='square';
      }
      if(format.id==='rectangularmicroqrcode')options.version='R11x59';
      const svg=bwipjs.toSVG(options);
      if(!svg.includes('<svg')||svg.length<80)throw Error('Empty encoder result');
      success={status:'PASS',sample,svgBytes:svg.length};
      break;
    }catch(error){lastError=String(error?.message||error);}
  }
  results.push({id:format.id,...(success||{status:'FAIL',candidates:candidates.length,detail:lastError})});
}
const summary=Object.fromEntries(['PASS','FAIL'].map(status=>[status,results.filter(r=>r.status===status).length]));
const {version}=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
const report={version,engine:'bwip-js@4.11.4',total:FORMATS.length,summary,results};
await writeFile('catalog-audit-report.json',JSON.stringify(report,null,2));
for(const result of results)console.log(result.status.padEnd(5),result.id.padEnd(35),result.status==='PASS'?JSON.stringify(result.sample).slice(0,90):result.detail);
console.log('TOTAL',FORMATS.length,JSON.stringify(summary));
if(process.env.GITHUB_STEP_SUMMARY){
 const rows=['## A404DC — real thumbnail fixtures','','**'+summary.PASS+' / '+FORMATS.length+' formats generated a valid sample.**','','| Symbology | Result | Example or error |','|---|---|---|',
  ...results.map(r=>'| '+r.id+' | '+r.status+' | '+String(r.sample||r.detail||'').replace(/[\r\n|]/g,' ').slice(0,140)+' |'),''];
 await appendFile(process.env.GITHUB_STEP_SUMMARY,rows.join('\n'));
}
if(summary.FAIL)process.exitCode=1;
