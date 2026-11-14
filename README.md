# AIDC Studio

A responsive, privacy-oriented AIDC barcode and QR code generator built with HTML, CSS, and native JavaScript modules. The interface uses **English** and the **charcoal + warm yellow** visual language of the [F404X portfolio](https://github.com/F404X/f404x-portfolio).

## Features

- Browse **110 barcode symbologies** through a searchable catalog, from QR, Data Matrix, Aztec, PDF417, Code 128 and EAN/UPC to specialist GS1, postal, and healthcare encoders.
- A **blank editor on first load**. Every format has an informative placeholder and input hint, but no code is generated until the user supplies data.
- QR Code styling: **square modules**, rounded modules, dots, several corner shapes, error-correction level, optional centered logo, and foreground/background colors.
- **Live preview** after a short 55 ms debounce, with a smaller working preview for speed and a full-resolution vector regenerated on export.
- Export **SVG, PNG, JPG, WEBP**, copy image or content, and generate **up to 60 codes at once in ZIP** (errors are included as a text file).
- QR payload builders for URLs/text, Wi-Fi, vCard contacts, email, and Brazilian static Pix BR Code.
- Data is encoded in the browser, never sent to an API. Library scripts and fonts are loaded from external CDNs; the CDN providers receive normal HTTP metadata, not the entered data.

**Important:** The catalog includes specialized standards that do **not** accept arbitrary text. Check digits, Application Identifiers, data lengths, and carrier or country specifications must be valid. Popular numeric GTIN/UPC formats include automatic Mod-10 check-digit calculation. For production labels and payments, validate results with the intended scanner or official application. The catalog is an encoder inventory, not a guarantee that every sample payload is standard-compliant.

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm run dev
```

Open `http://localhost:4173` (default). This is a **static** site; no build system, backend, or database is required. Avoid opening `index.html` via `file://` because some browsers block ES modules there.

## Tests

```bash
npm run check
npm test
```

Tests cover payload builders, validation, catalog and utilities. Browser interaction tests require a running browser. Since the encoder libraries are downloaded from CDNs, an internet connection is required for first-time use. If a CDN is blocked, the app tries alternate providers and shows a clear loading error.

## Deployment

**GitHub Pages:** Repository **Settings → Pages → Deploy from a branch → `main` → `/(root)`**. The expected address is `https://f404x.github.io/aidc-generator/` once deployment completes.

**Cloudflare Pages:** Connect the GitHub repository, use no build command and set output directory to `.`. The `_headers` file applies CSP and privacy-related headers on Cloudflare Pages.

## Shortcuts

- `/` — Open format catalog (outside editor controls).
- `Ctrl/Cmd + Enter` — Generate current preview.
- `Ctrl/Cmd + S` — Download PNG.
- `Esc` — Close catalog or export menu.

## Limitations and privacy

- Centered logo support applies to **regular QR Codes** only. Error correction is raised to H with a logo. Very large logos or low-contrast colors can still make a code unreadable.
- Static Pix QR payloads are **not verified dynamic payment charges**. Verify recipient and amount before paying.
- Image clipboard access requires HTTPS or localhost and browser Clipboard API support.
- The ZIP exporter handles raw data lines; it does not interpret the structured QR form templates in batch mode.
- The fonts and libraries are third-party resources loaded from pinned CDN versions; an offline build would need local, separately licensed vendor files.

## Architecture

```text
index.html                 UI shell
styles.css                 charcoal/yellow responsive theme
src/app.mjs                editor, live preview, exports, catalog, batch
src/catalog.mjs            searchable symbology catalog
src/renderer.mjs           SVG rendering, sanitization, raster exports
src/engines.mjs            encoder initialization and CDN fallbacks
src/validation.mjs         basic standard input checks and Mod-10
src/payloads.mjs           QR content templates and Pix CRC16
src/utils.mjs              shared helpers
scripts/serve.mjs          minimal local development server
tests/payloads.test.mjs    automated tests
```

Libraries: [bwip-js 4.11.4](https://github.com/metafloor/bwip-js) (barcode encoders), [qr-code-styling 1.9.2](https://github.com/kozakdenys/qr-code-styling) (custom QR), [JSZip 3.10.1](https://stuk.github.io/jszip/), and [Lucide](https://lucide.dev/) icons. Each external dependency has its own license. This project is MIT licensed.


## v1.2 — Full-size PNG live preview and opacity controls

- Every supported format is previewed as a **PNG raster**, scaled to the available preview frame without stretching its geometry.
- The export pipeline remains SVG-first for crisp final SVG, PNG, JPEG and WEBP downloads.
- Independent **foreground opacity** and **background opacity** sliders (0–100%). PNG, WEBP and SVG retain transparency. JPEG is composited on white because it does not support an alpha channel.
- The preview uses a checkerboard backdrop to make transparent areas recognizable.
- Preview is rerasterized on resize without re-encoding the barcode.
- Extremely wide barcodes may appear shorter than the preview frame to avoid distorting widths or scanner readability.
