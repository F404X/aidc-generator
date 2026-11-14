import test from 'node:test';
import assert from 'node:assert/strict';
import { rgbaColor } from '../src/renderer.mjs';

test('foreground and background RGBA colors support independent alpha', () => {
  assert.equal(rgbaColor('#F5DA54', 100), 'rgba(245, 218, 84, 1)');
  assert.equal(rgbaColor('#19170E', 0), 'rgba(25, 23, 14, 0)');
  assert.equal(rgbaColor('#FFFFFF', 35), 'rgba(255, 255, 255, 0.35)');
  assert.equal(rgbaColor('#FFFFFF', 130), 'rgba(255, 255, 255, 1)');
});
