/** Pure QR payload builders. They never make network requests. */
const safe = value => String(value ?? '').trim();
const escapeWifi = value => safe(value).replace(/([\\;,:"'])/g, '\\$1');
const escapeVCard = value => safe(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
export const normalizeAscii = value => safe(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');

export function buildWifi({ ssid = '', password = '', encryption = 'WPA', hidden = false }) {
  if (!safe(ssid)) throw new Error('Informe o nome da rede (SSID).');
  const type = encryption === 'nopass' ? 'nopass' : encryption === 'WEP' ? 'WEP' : 'WPA';
  const pass = type === 'nopass' ? '' : escapeWifi(password);
  if (type !== 'nopass' && !pass) throw new Error('Informe a senha da rede Wi-Fi.');
  return `WIFI:T:${type};S:${escapeWifi(ssid)};P:${pass};H:${hidden ? 'true' : 'false'};;`;
}

export function buildContact({ name = '', phone = '', email = '', organization = '', website = '' }) {
  if (!safe(name)) throw new Error('Informe o nome do contato.');
  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `FN:${escapeVCard(name)}`];
  if (safe(phone)) lines.push(`TEL;TYPE=CELL:${escapeVCard(phone)}`);
  if (safe(email)) lines.push(`EMAIL:${escapeVCard(email)}`);
  if (safe(organization)) lines.push(`ORG:${escapeVCard(organization)}`);
  if (safe(website)) lines.push(`URL:${escapeVCard(website)}`);
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function buildEmail({ to = '', subject = '', body = '' }) {
  if (!safe(to)) throw new Error('Informe o e-mail do destinatário.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safe(to))) throw new Error('Informe um endereço de e-mail válido.');
  const params = new URLSearchParams();
  if (safe(subject)) params.set('subject', safe(subject));
  if (safe(body)) params.set('body', safe(body));
  return `mailto:${safe(to)}${params.size ? '?' + params.toString() : ''}`;
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
  if (contents.length > 99) throw new Error(`Campo ${id} excede o tamanho permitido.`);
  return `${id}${String(contents.length).padStart(2, '0')}${contents}`;
}

/**
 * Brazilian Pix static QR payload (BR Code EMV / CRC-16-CCITT).
 * This creates a static payload, not a bank-verified dynamic charge.
 * Merchant data and keys should be checked in an actual banking application.
 */
export function buildPix({ key = '', name = '', city = '', amount = '', description = '' }) {
  const pixKey = safe(key);
  if (!pixKey) throw new Error('Informe a chave PIX.');
  if (pixKey.length > 77) throw new Error('A chave PIX deve ter no máximo 77 caracteres.');
  const merchant = normalizeAscii(name).toUpperCase().slice(0, 25);
  const location = normalizeAscii(city).toUpperCase().slice(0, 15);
  if (!merchant || !location) throw new Error('Informe o nome do recebedor e a cidade.');
  let amountValue = '';
  if (safe(amount)) {
    const normalized = safe(amount).replace(',', '.');
    const numeric = Number(normalized);
    if (!/^\d+(?:[.,]\d{1,2})?$/.test(safe(amount)) || !Number.isFinite(numeric) || numeric <= 0 || numeric > 9999999999.99) {
      throw new Error('O valor PIX deve ser positivo e usar até duas casas decimais.');
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
  text: { label: 'Texto / URL', fields: [] },
  wifi: { label: 'Wi-Fi', fields: [
    { key: 'ssid', label: 'Nome da rede (SSID)', placeholder: 'Minha rede' },
    { key: 'password', label: 'Senha Wi-Fi', placeholder: 'Senha da rede' },
    { key: 'encryption', label: 'Segurança', type: 'select', options: [['WPA','WPA / WPA2 / WPA3'], ['WEP','WEP'], ['nopass','Sem senha']] },
    { key: 'hidden', label: 'Rede oculta', type: 'checkbox' },
  ] },
  contact: { label: 'Contato', fields: [
    { key: 'name', label: 'Nome completo', placeholder: 'Maria Silva' },
    { key: 'phone', label: 'Telefone', placeholder: '+55 11 99999-9999' },
    { key: 'email', label: 'E-mail', placeholder: 'maria@exemplo.com' },
    { key: 'organization', label: 'Organização', placeholder: 'Empresa' },
    { key: 'website', label: 'Website', placeholder: 'https://...' },
  ] },
  email: { label: 'E-mail', fields: [
    { key: 'to', label: 'Destinatário', placeholder: 'contato@exemplo.com' },
    { key: 'subject', label: 'Assunto', placeholder: 'Olá!' },
    { key: 'body', label: 'Mensagem', placeholder: 'Gostaria de entrar em contato...' },
  ] },
  pix: { label: 'PIX', fields: [
    { key: 'key', label: 'Chave PIX', placeholder: 'CPF, e-mail, telefone ou chave aleatória' },
    { key: 'name', label: 'Nome do recebedor', placeholder: 'LOJA EXEMPLO' },
    { key: 'city', label: 'Cidade do recebedor', placeholder: 'GOIANIA' },
    { key: 'amount', label: 'Valor em R$ (opcional)', placeholder: '25,90' },
    { key: 'description', label: 'Descrição (opcional)', placeholder: 'Pagamento do pedido' },
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