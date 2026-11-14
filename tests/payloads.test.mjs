import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWifi, buildContact, buildEmail, buildPix, crc16Ccitt, normalizeAscii } from '../src/payloads.mjs';
import { FORMATS, lookupFormat, searchFormats } from '../src/catalog.mjs';
import { normalizeHex, contrastRatio, safeFilename } from '../src/utils.mjs';

test('catalog lists over 100 unique, searchable formats', () => {
  assert.ok(FORMATS.length >= 100);
  assert.equal(new Set(FORMATS.map(f=>f.id)).size, FORMATS.length);
  assert.equal(lookupFormat('code128').name, 'Code 128');
  assert.equal(searchFormats('codigo inexistente').length, 0);
  assert.ok(searchFormats('data matrix').some(f => f.id === 'datamatrix'));
  assert.ok(searchFormats('', 'gs1').every(f => f.category === 'gs1'));
});

test('Wi-Fi escapes reserved separators and validates fields', () => {
  assert.equal(buildWifi({ssid:'My;WiFi', password:'abc:123', encryption:'WPA'}), 'WIFI:T:WPA;S:My\\;WiFi;P:abc\\:123;H:false;;');
  assert.equal(buildWifi({ssid:'Guest', encryption:'nopass', hidden:true}), 'WIFI:T:nopass;S:Guest;P:;H:true;;');
  assert.throws(()=>buildWifi({ssid:'',password:'pass'}), /SSID/);
});

test('vCard and mailto are escaped and well formed', () => {
  const contact = buildContact({name:'Maria; Silva',email:'maria@example.org'});
  assert.match(contact, /^BEGIN:VCARD\r\nVERSION:3.0/);
  assert.match(contact, /FN:Maria\\; Silva/);
  assert.match(contact, /END:VCARD$/);
  assert.equal(buildEmail({to:'foo@example.com', subject:'Olá mundo'}), 'mailto:foo@example.com?subject=Ol%C3%A1+mundo');
  assert.throws(()=>buildEmail({to:'notanemail'}), /valid/);
});

test('Pix EMV field structure and CRC validate', () => {
  const pix = buildPix({key:'teste@example.com',name:'José Loja',city:'Goiânia',amount:'15,50'});
  assert.ok(pix.startsWith('00020101021126'));
  assert.ok(pix.includes('BR'));
  assert.ok(pix.includes('JOSE LOJA'));
  assert.ok(pix.includes('GOIANIA'));
  assert.ok(pix.includes('540515.50'));
  assert.equal(crc16Ccitt(pix.slice(0, -4)),pix.slice(-4));
  assert.throws(()=>buildPix({key:'a',name:'A',city:'B',amount:'-1'}), /positive/);
  assert.equal(normalizeAscii('São José'), 'Sao Jose');
});

test('utilities validate colors and file names', () => {
  assert.equal(normalizeHex('#abcdef'), '#ABCDEF');
  assert.equal(normalizeHex('abcdef'), '#ABCDEF');
  assert.equal(normalizeHex('xyz'), null);
  assert.ok(contrastRatio('#000000','#FFFFFF') > 20);
  assert.ok(contrastRatio('#FFFFFF','#FFFFFF') < 1.01);
  assert.equal(safeFilename('Olá / Bem vindo'), 'Ola-Bem-vindo');
});


test('EAN and UPC check digits are validated and completed safely', async () => {
  const { prepareBarcodePayload, mod10CheckDigit } = await import('../src/validation.mjs');
  assert.equal(mod10CheckDigit('789123456789'), '5');
  assert.equal(prepareBarcodePayload(lookupFormat('ean13'), '789123456789'),'7891234567895');
  assert.equal(prepareBarcodePayload(lookupFormat('ean13'), '7891234567895'),'7891234567895');
  assert.throws(() => prepareBarcodePayload(lookupFormat('ean13'),'7891234567890'), /check digit/);
  assert.throws(() => prepareBarcodePayload(lookupFormat('ean13'),'not numeric'), /digits only/);
  assert.throws(() => prepareBarcodePayload(lookupFormat('code39'),'abc'), /uppercase/);
  assert.throws(() => prepareBarcodePayload(lookupFormat('aztecrune'),'256'), /0 to 255/);
  assert.throws(() => prepareBarcodePayload(lookupFormat('interleaved2of5'),'123'), /even number/);
});

test('all formats provide English hints and non-empty IDs', () => {
  for (const f of FORMATS) {
    assert.ok(f.hint.length>15, f.id);
    assert.ok(f.id && f.name);
    assert.ok(!/\b(código|número|exige|não|formato)\b/i.test(f.hint), f.id);
  }
});
