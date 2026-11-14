
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inferBwipVariation,withDetectedVariation,extractDetectedVariation} from '../src/auto-variation.mjs';
import {variationSpec} from '../src/variations.mjs';

test('infer from actual encoder geometry and update the displayed variation',()=>{
 const spec=variationSpec('datamatrix');
 const base={text:'DATA',bcid:'datamatrix'};
 const encode=options=>{
   const dim=Number(String(options.version||'16x16').split('x')[0]);
   if(dim<14)throw Error('Data exceeds capacity');
   return `<svg viewBox="0 0 ${dim} ${dim}" xmlns="http://www.w3.org/2000/svg"></svg>`;
 };
 const automatic=encode(base);
 const detected=inferBwipVariation(automatic,base,spec,encode);
 assert.equal(detected,'16x16');
 const svg=withDetectedVariation(automatic,detected);
 assert.equal(extractDetectedVariation(svg),'16x16');
});
test('unknown versions remain explicitly unknown',()=>{
 const spec=variationSpec('microqrcode');
 const auto='<svg viewBox="0 0 913 917"></svg>';
 const detected=inferBwipVariation(auto,{text:'HELLO'},spec,()=>' <svg viewBox="0 0 25 25"></svg>');
 assert.equal(detected,null);
 assert.equal(extractDetectedVariation(auto),null);
 assert.equal(withDetectedVariation(auto,null),auto);
});
test('version tag cannot inject markup',()=>{
 const sample='<svg viewBox="0 0 20 20"></svg>';
 assert.equal(withDetectedVariation(sample,'\" onclick=\"alert(1)'),sample);
 assert.equal(extractDetectedVariation(withDetectedVariation(sample,'R11x59')),'R11x59');
});
