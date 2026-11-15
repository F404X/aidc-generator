/** Validate common standard-specific input before handing it to the encoder. */
const MOD10_LENGTHS = Object.freeze({ ean8:8, ean13:13, ean14:14, upca:12, itf14:14, sscc18:18 });
const DIGITS = /^\d+$/;
export function mod10CheckDigit(digits) {
  if (!DIGITS.test(digits)) throw new Error('Only digits are allowed.');
  let sum = 0;
  for (let index = 0; index < digits.length; index++) {
    const digit = digits.charCodeAt(digits.length - index - 1) - 48;
    sum += digit * (index % 2 === 0 ? 3 : 1);
  }
  return String((10 - sum % 10) % 10);
}
export function prepareBarcodePayload(format, content) {
  const value = String(content ?? '').trim();
  if (!value) throw new Error('Enter content to generate a code.');
  const expectedLength = MOD10_LENGTHS[format.id];
  if (expectedLength) {
    if (!DIGITS.test(value)) throw new Error(`${format.name} accepts digits only (${expectedLength-1} or ${expectedLength} digits).`);
    if (value.length === expectedLength-1) return value + mod10CheckDigit(value);
    if (value.length !== expectedLength) throw new Error(`${format.name} requires ${expectedLength-1} or ${expectedLength} digits; the check digit can be calculated automatically.`);
    const actual = mod10CheckDigit(value.slice(0,-1));
    if (actual !== value.at(-1)) throw new Error(`Incorrect check digit for ${format.name}: expected ${actual}.`);
  }
  if (format.id === 'interleaved2of5' && (!DIGITS.test(value) || value.length % 2)) {
    throw new Error('Interleaved 2 of 5 requires an even number of digits.');
  }
  if (format.id === 'code39' && /[^0-9A-Z .\-$\/+%]/.test(value)) {
    throw new Error('Code 39 accepts uppercase A–Z, digits, spaces, and - . $ / + %. Use Extended Code 39 for other characters.');
  }
  if (format.id === 'aztecrune' && (!DIGITS.test(value) || Number(value) > 255)) {
    throw new Error('Aztec Rune accepts an integer from 0 to 255.');
  }
  if (format.id === 'swissqrcode' && !value.includes('\n')) {
    throw new Error('Swiss QR requires a complete multi-line Swiss payment record; plain text is not supported.');
  }
  // Do not guess how to validate specialized BWIPP input. The encoder provides
  // authoritative errors for composite, postal, health and raw symbologies.
  return value;
}
