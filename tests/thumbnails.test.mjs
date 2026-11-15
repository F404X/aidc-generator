import test from 'node:test';
import assert from 'node:assert/strict';
import {thumbnailSamples} from '../src/thumbnails.mjs';
import {lookupFormat,FORMATS} from '../src/catalog.mjs';

test('each catalog symbology has sample candidates',()=>{
  assert.equal(FORMATS.length,110);
  for(const format of FORMATS){
    const samples=thumbnailSamples(format);
    assert.ok(samples.length>0,format.id);
    assert.equal(new Set(samples).size,samples.length,format.id);
  }
});
test('structured formats have dedicated fixtures rather than placeholders',()=>{
  for(const id of ['swissqrcode','maxicode','mailmark','auspost','gs1northamericancoupon','raw']){
    const examples=thumbnailSamples(lookupFormat(id));
    assert.ok(examples.length>=2,id);
    assert.doesNotMatch(examples[0],/^(Structured |Swiss payment|GS1 coupon data|BWIPP raw patterns)/i,id);
  }
});

test('formerly failing formats show their standards-compliant audit examples',()=>{
  const ids=[
    'd3aqr','ean14','isbn','ismn','mands','sscc18',
    'databaromnicomposite','databartruncatedcomposite',
    'databarstackedcomposite','databarstackedomnicomposite',
    'databarlimitedcomposite','gs1northamericancoupon','mailmark',
  ];
  for(const id of ids){
    const format=lookupFormat(id);
    const examples=thumbnailSamples(format);
    assert.equal(examples[0],format.example,id);
    assert.ok(format.example.length>6,id);
  }
});
