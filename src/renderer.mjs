/** Client-only code generation and exports. No external API receives payloads. */
export async function renderCode(format, payload, settings) {
  if (!payload || !String(payload).trim()) throw new Error('Insira o conteúdo para gerar este código.');
  if (format.id === 'qrcode') return renderStyledQr(payload, settings);
  if (!window.bwipjs?.toSVG) throw new Error('O mecanismo de códigos não carregou. Verifique sua conexão com a internet e atualize a página.');
  try {
    const svg = window.bwipjs.toSVG({
      bcid: format.id,
      text: payload,
      scale: Math.max(2, Math.min(6, Math.round(settings.size / 170))),
      height: settings.barHeight,
      includetext: format.kind === 'linear' && settings.showText,
      textxalign: 'center',
      textcolor: settings.foreground.slice(1),
      textsize: 11,
      barcolor: settings.foreground.slice(1),
      backgroundcolor: settings.background.slice(1),
      paddingwidth: settings.margin,
      paddingheight: settings.margin,
    });
    return sanitizeSvg(svg);
  } catch (error) {
    const details = String(error?.message || error).replace(/^bwipp\./, '');
    throw new Error(`Verifique o conteúdo para ${format.name}. ${details}`);
  }
}

async function renderStyledQr(payload, settings) {
  if (!window.QRCodeStyling) throw new Error('O mecanismo de QR Code não carregou. Verifique sua conexão e atualize a página.');
  const qr = new window.QRCodeStyling({
    width: settings.size,
    height: settings.size,
    type: 'svg',
    data: payload,
    margin: settings.margin,
    image: settings.logo || undefined,
    qrOptions: { typeNumber: 0, errorCorrectionLevel: settings.logo ? 'H' : settings.correction },
    imageOptions: { hideBackgroundDots:true, imageSize: settings.logoSize / 100, margin: Math.max(2, Math.round(settings.size * 0.008)), saveAsBlob: true },
    dotsOptions: { type: settings.dotStyle, color: settings.foreground },
    cornersSquareOptions: { type: settings.cornerStyle, color: settings.foreground },
    cornersDotOptions: { type: 'dot', color: settings.foreground },
    backgroundOptions: { color: settings.background },
  });
  try {
    const blob = await qr.getRawData('svg');
    if (!blob) throw new Error('Não foi possível criar o arquivo SVG.');
    const svg = typeof blob.text === 'function' ? await blob.text() : new TextDecoder().decode(blob);
    return sanitizeSvg(svg);
  } catch (error) {
    throw new Error(`Não foi possível gerar o QR Code. ${error?.message || 'O conteúdo pode ser grande demais.'}`);
  }
}

/** Scrub executable SVG elements/attributes before rendering or exporting. */
export function sanitizeSvg(markup) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (doc.querySelector('parsererror') || doc.documentElement.localName !== 'svg') throw new Error('O mecanismo retornou um SVG inválido.');
  const blocked = 'script,foreignObject,iframe,object,embed,animate,animateMotion,animateTransform,set';
  doc.querySelectorAll(blocked).forEach(element => element.remove());
  for (const element of [doc.documentElement, ...doc.querySelectorAll('*')]) {
    for (const attr of [...element.attributes]) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      if (name.startsWith('on') || (name === 'href' || name === 'xlink:href') && !/^(#|data:image\/(png|jpeg|webp);base64,)/i.test(value)) {
        element.removeAttribute(attr.name);
      }
    }
  }
  return new XMLSerializer().serializeToString(doc);
}

export function svgBlob(svg) { return new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }); }

export async function svgToRaster(svg, mime = 'image/png', targetSize = 512, background = '#ffffff') {
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  const viewBox = root.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
  const svgWidth = parseFloat(root.getAttribute('width')) || (viewBox?.[2] ?? targetSize);
  const svgHeight = parseFloat(root.getAttribute('height')) || (viewBox?.[3] ?? targetSize);
  if (![svgWidth,svgHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Dimensões de SVG inválidas.');
  const ratio = targetSize / Math.max(svgWidth,svgHeight);
  const width = Math.max(1,Math.min(4096,Math.round(svgWidth * ratio)));
  const height = Math.max(1,Math.min(4096,Math.round(svgHeight * ratio)));
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Seu navegador não oferece suporte ao Canvas 2D.');
  ctx.fillStyle = background;
  ctx.fillRect(0,0,width,height);
  const url = URL.createObjectURL(svgBlob(svg));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    ctx.drawImage(img,0,0,width,height);
  } finally { URL.revokeObjectURL(url); }
  const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('A conversão da imagem falhou.')), mime, mime === 'image/jpeg' ? 0.94 : undefined));
  return blob;
}