import test from 'node:test';
import assert from 'node:assert/strict';
import {thumbnailSamples} from '../src/thumbnails.mjs';

test('valid AIDC examples are shown before fallback inputs', () => {
  const samples = thumbnailSamples({id:'code128', kind:'linear', example:'ABC-123'});
  assert.equal(samples[0], 'ABC-123');
  assert.ok(samples.includes('123456'));
});
test('specialized formats never get made-up example previews', () => {
  assert.deepEqual(thumbnailSamples({id:'swissqrcode', kind:'matrix', example:'Swiss payment fields separated by newlines'}), []);
  assert.deepEqual(thumbnailSamples({id:'raw', kind:'linear', example:'BWIPP raw patterns (advanced)'}), []);
});
test('matrix formats get compact, unique fallback examples', () => {
  const samples = thumbnailSamples({kind:'matrix',example:'HELLO'});
  assert.equal(samples[0], 'HELLO');
  assert.equal(new Set(samples).size, samples.length);
  assert.ok(samples.includes('123'));
});
