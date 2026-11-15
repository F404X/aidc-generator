/** Pure QR payload builders. They never make network requests. */
const safe = value => String(value ?? '').trim();
const escapeWifi = value => safe(value).replace(/([\\;,:"'])/g, '\\$1');
const escapeVCard = value => safe(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
export const normalizeAscii = value => safe(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');

export function buildWifi({ ssid = '', password = '', encryption = 'WPA', hidden = false }) {
  if (!safe(ssid)) throw new Error('Enter a Wi-Fi network name (SSID).');
  const type = encryption === 'nopass' ? 'nopass' : encryption === 'WEP' ? 'WEP' : 'WPA';
  const pass = type === 'nopass' ? '' : escapeWifi(password);
  if (type !== 'nopass' && !pass) throw new Error('Enter the Wi-Fi password.');
  return `WIFI:T:${type};S:${escapeWifi(ssid)};P:${pass};H:${hidden ? 'true' : 'false'};;`;
}

export function buildContact({ name = '', phone = '', email = '', organization = '', website = '' }) {
  if (!safe(name)) throw new Error('Enter a contact name.');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(name)}`];
  if (safe(phone)) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`);
  if (safe(email)) lines.push(`EMAIL:${escapeVCard(email)}`);
  if (safe(organization)) lines.push(`ORG:${escapeVCard(organization)}`);
  if (safe(website)) lines.push(`URL:${escapeVCard(website)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function buildEmail({ to = '', subject = '', body = '' }) {
  const recipient = safe(to);
  if (!recipient) throw new Error('Enter the recipient email address.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) throw new Error('Enter a valid email address.');
  const params = new URLSearchParams();
  if (safe(subject)) params.set('subject', safe(subject));
  if (safe(body)) params.set('body', safe(body));
  return `mailto:${recipient}${params.size ? '?' + params.toString() : ''}`;
}

export function crc16Ccitt(value) {
  let crc = 0xffff;
  for (const char of value) {
    crc ^= char.charCodeAt(0) << 8;
    for (let i = 0; i < 8; i++) crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).padStart(4, '0').toUpperCase();
}

function emvField(id, contents) {
  if (contents.length > 99) throw new Error(`Field ${id} exceeds the allowed length.`);
  return `${id}${String(contents.length).padStart(2, '0')}${contents}`;
}

/**
 * Brazilian Pix static QR payload (BR Code EMV / CRC-16-CCITT).
 * This creates a static payload, not a bank-verified dynamic charge.
 * Merchant data and keys should be checked in an actual banking application.
 */
export function buildPix({ key = '', name = '', city = '', amount = '', description = '' }) {
  const pixKey = safe(key);
  if (!pixKey) throw new Error('Enter a Pix key.');
  if (pixKey.length > 77) throw new Error('A Pix key must contain at most 77 characters.');
  const merchant = normalizeAscii(name).toUpperCase().slice(0, 25);
  const location = normalizeAscii(city).toUpperCase().slice(0, 15);
  if (!merchant || !location) throw new Error('Enter the recipient name and city.');
  let amountValue = '';
  if (safe(amount)) {
    const normalized = safe(amount).replace(',', '.');
    const numeric = Number(normalized);
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(safe(amount)) || !Number.isFinite(numeric) || numeric <= 0 || numeric > 9999999999.99) {
      throw new Error('The Pix amount must be positive, with up to two decimal places.');
    }
    amountValue = numeric.toFixed(2);
  }
  const account = emvField('00', 'br.gov.bcb.pix') + emvField('01', pixKey) + (safe(description) ? emvField('02', normalizeAscii(description).slice(0, 30)) : '');
  let payload = emvField('00','01') + emvField('01','11') + emvField('26',account) + emvField('52','0000') + emvField('53','986');
  if (amountValue) payload += emvField('54', amountValue);
  payload += emvField('58','BR') + emvField('59',merchant) + emvField('60',location) + emvField('62',emvField('05','***')) + '6304';
  return payload + crc16Ccitt(payload);
}

export const TEMPLATES = {
  text: { label: 'Text / URL', fields: [] },
  wifi: { label: 'Wi-Fi', fields: [
    { key: 'ssid', label: 'Network name (SSID)', placeholder: 'My network' },
    { key: 'password', label: 'Wi-Fi password', placeholder: 'Network password' },
    { key: 'encryption', label: 'Security', type: 'select', options: [['WPA','WPA / WPA2 / WPA3'], ['WEP','WEP'], ['nopass','No password']] },
    { key: 'hidden', label: 'Hidden network', type: 'checkbox' },
  ] },
  contact: { label: 'Contact', fields: [
    { key: 'name', label: 'Full name', placeholder: 'Jane Doe' },
    { key: 'phone', label: 'Phone', placeholder: '+55 11 99999-9999' },
    { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
    { key: 'organization', label: 'Organization', placeholder: 'Company' },
    { key: 'website', label: 'Website', placeholder: 'https://...' },
  ] },
  email: { label: 'Email', fields: [
    { key: 'to', label: 'Recipient', placeholder: 'hello@example.com' },
    { key: 'subject', label: 'Subject', placeholder: 'Hello' },
    { key: 'body', label: 'Message', placeholder: 'I would like to get in touch…' },
  ] },
  pix: { label: 'PIX', fields: [
    { key: 'key', label: 'Pix key', placeholder: 'CPF, email, phone or random key' },
    { key: 'name', label: 'Recipient name', placeholder: 'EXAMPLE STORE' },
    { key: 'city', label: 'Recipient city', placeholder: 'GOIANIA' },
    { key: 'amount', label: 'Amount in BRL (optional)', placeholder: '25.90' },
    { key: 'description', label: 'Description (optional)', placeholder: 'Order payment' },
  ] },
};

export function buildTemplate(type, data) {
  switch (type) {
    case 'wifi': return buildWifi(data);
    case 'contact': return buildContact(data);
    case 'email': return buildEmail(data);
    case 'pix': return buildPix(data);
    default: return safe(data.text);
  }
}
