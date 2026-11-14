/** Load browser encoders from a primary CDN, with alternate providers as fallback.
 * No barcode payload is sent to these hosts: only the library scripts are downloaded.
 */
const dependencies = {
  bwip: {
    ready: () => typeof window.bwipjs?.toSVG === 'function',
    urls: [
      'https://cdnjs.cloudflare.com/ajax/libs/bwip-js/4.11.4/bwip-js-min.js',
      'https://cdn.jsdelivr.net/npm/bwip-js@4.11.4/dist/bwip-js-min.js',
      'https://unpkg.com/bwip-js@4.11.4/dist/bwip-js-min.js',
    ],
    label: 'barcodes',
  },
  qr: {
    ready: () => typeof window.QRCodeStyling === 'function',
    urls: [
      'https://cdn.jsdelivr.net/npm/qr-code-styling@1.9.2/lib/qr-code-styling.js',
      'https://unpkg.com/qr-code-styling@1.9.2/lib/qr-code-styling.js',
    ],
    label: 'custom QR Codes',
  },
  zip: {
    ready: () => typeof window.JSZip === 'function',
    urls: [
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
    ],
    label: 'ZIP files',
  },
};
const pending = new Map();

function injectScript(url, ready) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.referrerPolicy = 'no-referrer';
    let finished = false;
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (error) { script.remove(); reject(error); }
      else resolve();
    };
    const timeout = setTimeout(() => finish(new Error('Connection timed out')), 6500);
    script.onload = () => finish(ready() ? null : new Error('Unexpected encoder API'));
    script.onerror = () => finish(new Error('Network error'));
    document.head.appendChild(script);
  });
}

export function ensureEngine(name) {
  const dependency = dependencies[name];
  if (!dependency) return Promise.reject(new Error('Unknown encoder.'));
  if (dependency.ready()) return Promise.resolve();
  if (pending.has(name)) return pending.get(name);
  const request = (async () => {
    for (const url of dependency.urls) {
      try {
        await injectScript(url, dependency.ready);
        if (dependency.ready()) return;
      } catch { /* Try another trusted CDN. */ }
    }
    throw new Error(`Could not load the ${dependency.label} engine. Check the connection and any script blockers.`);
  })();
  pending.set(name, request);
  request.catch(() => pending.delete(name));
  return request;
}

export function warmupEngines() {
  // No unhandled rejection on startup; the selected encoder reports any failure.
  void ensureEngine('bwip').catch(() => {});
  void ensureEngine('qr').catch(() => {});
}
