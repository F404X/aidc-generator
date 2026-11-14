import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMATS} from '../src/catalog.mjs';
import {encodeRmqr,RMQR_VERSIONS,REQUIRED_OPTIONS} from '../src/symbology-options.mjs';
import {prepareBarcodePayload} from '../src/validation.mjs';

test('catalog covers 110 unique IDs with usage hints',()=>{
 assert.equal(FORMATS.length,110);
 assert.equal(new Set(FORMATS.map(f=>f.id)).size,FORMATS.length);
 for(const f of FORMATS){assert.ok(f.hint.length>15,f.id);assert.equal(typeof f.example,'string',f.id);}
});
test('rMQR uses all 32 distinct official sizes in increasing symbol area',()=>{
 assert.equal(RMQR_VERSIONS.length,32);
 assert.equal(new Set(RMQR_VERSIONS).size,32);
 const area=v=>{const [,h,w]=/^R(\d+)x(\d+)$/.exec(v);return Number(h)*Number(w)};
 assert.deepEqual(RMQR_VERSIONS.map(area),RMQR_VERSIONS.map(area).toSorted((a,b)=>a-b));
 assert.equal(REQUIRED_OPTIONS.rectangularmicroqrcode.eclevel,'M');
});
test('rMQR supplies mandatory version and M level and retries too-small sizes',()=>{
 const calls=[];
 const svg=encodeRmqr(o=>{calls.push(o);if(calls.length<3)throw Error('Data exceeds capacity');return '<svg/>';},{bcid:'rectangularmicroqrcode',text:'HELLO-2026'});
 assert.equal(svg,'<svg/>');assert.equal(calls.length,3);
 assert.deepEqual(calls.map(o=>o.version),RMQR_VERSIONS.slice(0,3));
 assert.ok(calls.every(o=>o.eclevel==='M'));
});
test('rMQR propagates unknown encoder errors instead of silently trying all sizes',()=>{
 assert.throws(()=>encodeRmqr(()=>{throw Error('Unknown encoder')},{bcid:'rectangularmicroqrcode'}),/Unknown encoder/);
});
test('all catalog examples pass through payload preparation without missing engine-option errors',()=>{
 for(const f of FORMATS){
  try{prepareBarcodePayload(f,f.example||'A');}
  catch(e){assert.doesNotMatch(String(e.message),/version must be provided|missing encoder option/i,f.id);}
 }
});
