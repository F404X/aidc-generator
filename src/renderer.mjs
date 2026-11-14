/** Client-only barcode renderers. Encoder libraries are fetched, barcode payloads are not. */
import { ensureEngine } from './engines.mjs';
import { prepareBarcodePayload } from './validation.mjs';

const SVG_MIME = 'image/svg+xml;charset=utf-8';
function drawBwip(format, text, settings, preview) {
  const scale = preview ? 2 : Math.max(2, Math.min(6, Math.round(settings.size / 170)));
  const margin = preview ? Math.round(settings.margin * 320 / settings.size) : settings.margin;
  return window.bwipjs.toSVG({
    bcid: format.id,
    text,
    scale,
    height: settings.barHeight,
    includetext: format.kind === 'linear' && settings.showText,
    textxalign: 'center',
    textcolor: settings.foreground.slice(1),
    textsize: 11,
    barcolor: settings.foreground.slice(1),
    backgroundcolor: settings.background.slice(1),
    paddingwidth: margin,
    paddingheight: margin,
  });
}

export async function renderCode(format, payload, settings, { preview = false } = {}) {
  const text = prepareBarcodePayload(format, payload);
  if (format.id !== 'qrcode') {
    await ensureEngine('bwip');
    try { return sanitizeSvg(drawBwip(format, text, settings, preview)); }
    catch (error) {
      const details = String(error?.message || error).replace(/^bwipp\./, '');
      throw new Error(`${format.name}: ${details}`);
    }
  }
  // Styled QR is preferred, but plain square QR remains available if the
  // styling library fails. Do not silently discard an uploaded logo.
  try {
    await ensureEngine('qr');
    return await styledQr(text, settings, preview);
  } catch (error) {
    if (settings.logo) throw error;
    await ensureEngine('bwip');
    try {
      return sanitizeSvg(window.bwipjs.toSVG({
        bcid: 'qrcode', text,
        scale: preview ? 3 : Math.max(3, Math.round(settings.size / 100)),
        eclevel: settings.correction,
        barcolor: settings.foreground.slice(1),
        backgroundcolor: settings.background.slice(1),
        padding: Math.max(4, settings.margin),
      }));
    } catch { throw error; }
  }
}

async function styledQr(data, settings, preview) {
  const size = preview ? Math.min(384, settings.size) : settings.size;
  const margin = preview ? Math.round(settings.margin * size / settings.size) : settings.margin;
  const qr = new window.QRCodeStyling({
    width: size, height: size, type: 'svg', data, margin,
    image: settings.logo || undefined,
    qrOptions: { typeNumber: 0, errorCorrectionLevel: settings.logo ? 'H' : settings.correction },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: settings.logoSize / 100,
      margin: Math.max(2, Math.round(size * 0.008)),
      saveAsBlob: true,
    },
    dotsOptions: { type: settings.dotStyle, color: settings.foreground },
    cornersSquareOptions: { type: settings.cornerStyle, color: settings.foreground },
    cornersDotOptions: { type: settings.cornerStyle === 'square' ? 'square' : 'dot', color: settings.foreground },
    backgroundOptions: { color: settings.background },
  });
  try {
    const blob = await qr.getRawData('svg');
    if (!blob) throw new Error('Could not generate SVG.');
    const svg = await blob.text();
    return sanitizeSvg(svg);
  } catch (error) {
    throw new Error(`Could not generate QR Code: ${error?.message || 'content may be too large.'}`);
  }
}

/** Whitelist SVG elements and attributes to keep generated previews non-executable. */
export function sanitizeSvg(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') {
    throw new Error('The encoder returned an invalid SVG.');
  }
  const blocked = 'script,foreignObject,iframe,object,embed,animate,animateMotion,animateTransform,set';
  doc.querySelectorAll(blocked).forEach(node => node.remove());
  for (const node of [doc.documentElement, ...doc.querySelectorAll('*')]) {
    for (const attribute of [...node.attributes]) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on') || (name === 'href' || name === 'xlink:href') && !/^(#|data:image\/(png|jpeg|webp);base64,)/i.test(value)) {
        node.removeAttribute(attribute.name);
      }
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

export const svgBlob = svg => new Blob([svg], {type: SVG_MIME});

/** Convert a vector result to a high resolution image without changing its ratio. */
export async function svgToRaster(svg, mime = 'image/png', targetSize = 512, background = '#ffffff') {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  const viewBox = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  const svgWidth = Number.parseFloat(root.getAttribute('width')) || viewBox?.[2] || targetSize;
  const svgHeight = Number.parseFloat(root.getAttribute('height')) || viewBox?.[3] || targetSize;
  if (![svgWidth, svgHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid SVG dimensions.');
  const ratio = Math.min(4096, targetSize) / Math.max(svgWidth, svgHeight);
  const width = Math.max(1, Math.round(svgWidth * ratio));
  const height = Math.max(1, Math.round(svgHeight * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D is unavailable in this browser.');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  const url = URL.createObjectURL(svgBlob(svg));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    context.drawImage(image, 0, 0, width, height);
  } finally { URL.revokeObjectURL(url); }
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not convert SVG to image.')), mime, mime === 'image/jpeg' ? 0.94 : undefined);
  });
  return blob;
}
