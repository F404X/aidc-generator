/**
 * Tiny barcode gallery, generated with the same validated encoder as exports.
 * No fake images: formats without a valid sample get an explicit unavailable state.
 */
import {renderCode, svgToRaster} from './renderer.mjs?v=1.4.0';
import {lookupFormat} from './catalog.mjs?v=1.4.0';

const settings = Object.freeze({
  foreground:'#151515', background:'#FFFFFF',
  foregroundOpacity:100, backgroundOpacity:100,
  size:240, margin:8, dotStyle:'square', cornerStyle:'square',
  correction:'M', barHeight:16, showText:false, logo:null, logoSize:20
});
const cache = new Map();
const queue = [];
let busy = 0;
let observer;

export function thumbnailSamples(format) {
 const example=String(format.example||'').trim();
 const specialized=/^(Swiss payment|Structured |GS1 coupon data|BWIPP raw patterns)/i.test(example);
 const samples={
  maxicode:['1234567890','12345678901234567890'],
  raw:['1010101010','1111000011110000'],
  mailmark:['JGB 012100123412345678XY1A 0','12345678901234567890'],
  auspost:['5956439111ABA 9','5956439111'],
  gs1northamericancoupon:['(8110)10614141123456(3900)001000'],
  swissqrcode:['SPC\\n0200\\n1\\nCH4431999123000889012\\nS\\nSAMPLE AG\\nMain Street 1\\n8000\\nZURICH\\nCH\\n\\n\\n\\n\\n\\n\\n25.00\\nCHF\\nS\\nDEMO USER\\nMain Street 1\\n8000\\nZURICH\\nCH\\nNON\\n\\nEPD'],
 };
 const fallback=format.kind==='matrix'?['HELLO','123','123456789','BATCH-001']:['123456','12345678','123456789012','ABC123','A123456B'];
 if(format.category==='gs1')fallback.unshift('(01)09506000134352','09506000134352','(01)09506000134352(10)BATCH');
 if(format.category==='postal')fallback.unshift('12345678901','123456789','1234567-890');
 if(format.category==='health')fallback.unshift('+A123BJC5D6E','12345678');
 return [...new Set([...(specialized?[]:[example]),...(samples[format.id]||[]),...fallback].filter(Boolean))];
}
async function encodeThumb(format) {
  for (const sample of thumbnailSamples(format)) {
    try {
      const svg = await renderCode(format, sample, settings, {preview:true});
      const png = await svgToRaster(svg, 'image/png', 270);
      return {url: URL.createObjectURL(png), sample};
    } catch { /* Try another simple, valid specimen. */ }
  }
  return {url:null,sample:null};
}
function drain() {
  while (busy < 2 && queue.length) {
    const {format, resolve} = queue.shift();
    busy++;
    void encodeThumb(format)
      .then(resolve, () => resolve({url:null,sample:null}))
      .finally(() => { busy--; drain(); });
  }
}
function load(format) {
  if (!cache.has(format.id)) {
    cache.set(format.id, new Promise(resolve => { queue.push({format,resolve});drain(); }));
  }
  return cache.get(format.id);
}
function show(frame, format) {
  void load(format).then(({url,sample}) => {
    if (!frame.isConnected) return;
    frame.classList.remove('is-loading');
    const label = frame.parentElement?.querySelector('.thumb-sample');
    if (!url) {
      frame.classList.add('is-unavailable');
      frame.textContent = 'Special input';
      frame.title = 'A standards-compliant example is not yet available';
      if (label) label.textContent = 'Special input required';
      return;
    }
    const image = document.createElement('img');
    image.className = 'thumb-image';
    image.alt = format.name + ' encoded example: ' + sample;
    image.decoding = 'async';
    image.src = url;
    frame.replaceChildren(image);
    frame.title = 'Encoded example: ' + sample;
    if (label) {
      label.textContent = 'Sample: ' + sample;
      label.title = sample;
    }
  });
}
export function observeThumbnail(frame, format) {
  frame.dataset.formatId = format.id;
  if (!('IntersectionObserver' in window)) { show(frame,format); return; }
  if (!observer) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = entry.target;
        observer.unobserve(target);
        show(target, lookupFormat(target.dataset.formatId));
      }
    }, {rootMargin:'150px 0px'});
  }
  observer.observe(frame);
}
export function unobserveThumbnails(container) {
  if (observer) container.querySelectorAll('.code-thumb').forEach(frame => observer.unobserve(frame));
}
if (typeof window !== 'undefined') window.addEventListener('pagehide', () => {
  for (const promise of cache.values()) {
    void promise.then(value => { if (value.url) URL.revokeObjectURL(value.url); });
  }
});
