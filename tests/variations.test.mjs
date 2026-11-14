
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RMQR_VERSIONS} from '../src/symbology-options.mjs';
import {VARIATION_IDS,variationSpec,variationOptions,qrVersion} from '../src/variations.mjs';

test('all 32 official rMQR sizes are offered in Variation',()=>{
 const options=variationSpec('rectangularmicroqrcode').options;
 assert.equal(options.length,32);
 assert.deepEqual(options.map(item=>item.value),RMQR_VERSIONS);
 for(const size of RMQR_VERSIONS)assert.deepEqual(variationOptions('rectangularmicroqrcode',size),{version:size});
});
test('QR, Micro QR and Data Matrix variations preserve their expected sizes',()=>{
 assert.equal(variationSpec('qrcode').options.length,40);
 assert.equal(variationSpec('microqrcode').options.length,4);
 assert.equal(variationSpec('datamatrix').options.length,24);
 assert.equal(variationSpec('datamatrixrectangular').options.length,6);
 assert.equal(variationSpec('datamatrixrectangularextension').options.length,24);
 assert.equal(qrVersion('auto'),0);
 assert.equal(qrVersion('10'),10);
 assert.deepEqual(variationOptions('gs1datamatrix','24x24'),{version:'24x24'});
});
test('Aztec, PDF417, Code One and Han Xin offer valid structured choices',()=>{
 assert.equal(variationSpec('azteccode').options.length,32);
 assert.equal(variationSpec('azteccodecompact').options.length,4);
 assert.equal(variationSpec('pdf417').options.length,30);
 assert.equal(variationSpec('micropdf417').options.length,34);
 assert.equal(variationSpec('hanxin').options.length,84);
 assert.deepEqual(variationOptions('azteccode','3'),{layers:'3'});
 assert.deepEqual(variationOptions('micropdf417','15x4'),{version:'15x4'});
 assert.deepEqual(variationOptions('pdf417','3'),{columns:'3'});
 assert.deepEqual(variationOptions('codeone','T-16'),{version:'T-16'});
});
test('auto is safe for every variation and other codes remain unaffected',()=>{
 assert.ok(VARIATION_IDS.length>=20);
 for(const id of VARIATION_IDS){
  const s=variationSpec(id);
  assert.ok(s.options.length>0,id);
  assert.deepEqual(variationOptions(id,'auto'),{},id);
  assert.equal(Object.keys(variationOptions(id,s.options[0].value)).length,1,id);
  assert.throws(()=>variationOptions(id,'nonexistent'),/Invalid variation/,id);
 }
 assert.equal(variationSpec('code128'),null);
 assert.deepEqual(variationOptions('code128','auto'),{});
});
