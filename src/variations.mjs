
/** Standards-defined sizes and dimensions for the A404DC Variation control. */
import {RMQR_VERSIONS} from './symbology-options.mjs?v=1.6.0';
const numbered=(a,b,label=n=>String(n))=>Array.from({length:b-a+1},(_,i)=>({value:String(a+i),label:label(a+i)}));
const strings=values=>values.map(value=>({value,label:value}));
const qr=numbered(1,40,n=>`Version ${n} · ${17+4*n}×${17+4*n}`);
const dmSquare=[10,12,14,16,18,20,22,24,26,32,36,40,44,48,52,64,72,80,88,96,104,120,132,144].map(x=>`${x}x${x}`);
const dmRectangle=['8x18','8x32','12x26','12x36','16x36','16x48'];
const dmre=['8x18','8x32','8x48','8x64','8x80','8x96','8x120','8x144','12x26','12x36','12x64','12x88','16x36','16x48','16x64','20x36','20x44','20x64','22x48','24x48','24x64','26x40','26x48','26x64'];
const microPdfRows={1:[11,14,17,20,24,28],2:[8,11,14,17,20,23,26],3:[6,8,10,12,15,20,26,32,38,44],4:[4,6,8,10,12,15,20,26,32,38,44]};
const microPdf=Object.entries(microPdfRows).flatMap(([columns,rows])=>rows.map(row=>({value:`${row}x${columns}`,label:`${columns} columns × ${row} rows`})));
const spec=(title,option,options,hint)=>Object.freeze({title,option,options:Object.freeze(options),hint});
const specs={
 rectangularmicroqrcode:spec('rMQR size','version',strings(RMQR_VERSIONS),'32 sizes · height × width in modules; Auto Select finds a fitting size.'),
 qrcode:spec('QR version','version',qr,'Versions 1–40 · a chosen version must fit the content.'),
 microqrcode:spec('Micro QR version','version',strings(['M1','M2','M3','M4']),'M1 permits numbers only; M2 supports numeric/alphanumeric; larger versions hold more data.'),
 datamatrix:spec('Data Matrix size','version',strings(dmSquare),'Square ECC 200 · rows × columns.'),
 datamatrixrectangular:spec('Rectangular Data Matrix size','version',strings(dmRectangle),'Standard rectangular ECC 200 · rows × columns.'),
 datamatrixrectangularextension:spec('DMRE size','version',strings(dmre),'Extended rectangular ECC 200 sizes · rows × columns.'),
 azteccode:spec('Aztec layers','layers',numbered(1,32,n=>`${n} layer${n===1?'':'s'}`),'Full Aztec Code · 1–32 layers.'),
 azteccodecompact:spec('Compact Aztec layers','layers',numbered(1,4,n=>`${n} layer${n===1?'':'s'}`),'Compact Aztec · 1–4 layers.'),
 pdf417:spec('PDF417 columns','columns',numbered(1,30,n=>`${n} column${n===1?'':'s'}`),'1–30 data columns; rows are calculated automatically.'),
 pdf417compact:spec('Compact PDF417 columns','columns',numbered(1,30,n=>`${n} column${n===1?'':'s'}`),'1–30 data columns; rows are calculated automatically.'),
 micropdf417:spec('MicroPDF417 size','version',microPdf,'34 permitted configurations · columns × rows.'),
 codeone:spec('Code One version','version',strings(['A','B','C','D','E','F','G','H','T','T-16','T-32','T-48','S','S-10','S-20','S-30']),'Standard A–H, compact T, and numeric-only S variants.'),
 hanxin:spec('Han Xin version','version',numbered(1,84,n=>`Version ${n} · ${21+2*n}×${21+2*n}`),'Versions 1–84 · matrix dimensions.'),
};
for(const id of ['gs1qrcode','gs1dlqrcode','hibcqrcode'])specs[id]=spec('QR version','version',qr,'Versions 1–40 of this QR family.');
for(const id of ['gs1datamatrix','gs1dldatamatrix','hibcdatamatrix'])specs[id]=spec('Data Matrix size','version',strings(dmSquare),'Square ECC 200 sizes.');
for(const id of ['gs1datamatrixrectangular','hibcdatamatrixrectangular'])specs[id]=spec('Rectangular Data Matrix size','version',strings(dmRectangle),'Rectangular ECC 200 sizes.');
specs.hibcazteccode=spec('Aztec layers','layers',numbered(1,32,n=>`${n} layer${n===1?'':'s'}`),'Aztec Code · 1–32 layers.');
specs.hibcpdf417=spec('PDF417 columns','columns',numbered(1,30,n=>`${n} column${n===1?'':'s'}`),'PDF417 · 1–30 data columns.');
specs.hibcmicropdf417=spec('MicroPDF417 size','version',microPdf,'34 MicroPDF417 configurations.');
export const VARIATION_SPECS=Object.freeze(specs);
export const VARIATION_IDS=Object.freeze(Object.keys(specs));
export function variationSpec(id){return VARIATION_SPECS[id]||null;}
export function variationOptions(id,choice='auto'){
 const current=variationSpec(id);
 if(!current||choice==null||choice==='auto')return {};
 const found=current.options.find(item=>item.value===String(choice));
 if(!found)throw new Error(`Invalid variation for ${id}: ${choice}`);
 return {[current.option]:found.value};
}
export function qrVersion(choice='auto'){const options=variationOptions('qrcode',choice);return options.version?Number(options.version):0;}
