# A404DC

## v1.4.0: correct raster proportions and real format thumbnails

- The main preview is a white square that never squashes the encoded shape; PNG output preserves the SVG `viewBox` aspect ratio.
- The searchable format catalog and quick formats show actual thumbnails from the same encoder, generated on demand when visible.
- A small, verified sample string appears alongside each successful thumbnail. Specialized formats with no valid example are labeled rather than illustrated with misleading placeholders.
- The interface uses more rectangular surfaces and understated corners.


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

## rMQR automatic sizing

The rMQR encoder requires an explicit version (R7x43 through R17x139) with M or H error correction. A404DC tries the 32 valid sizes by increasing area, selecting the first that can hold the payload.

## Verifying all formats

Run `npm test` to check the catalog and rMQR option profiles. Run `npm run audit:engine` with the pinned bwip-js npm package installed to encode example data for all 110 formats, producing `catalog-audit-report.json`. Some specialized formats require full standard-specific data and may be reported as needing a test fixture rather than a false positive.

## 1.5 features

Logo images are reduced to 128–512 pixels before embedding directly into an SVG, avoiding third-party async image-loading stalls. Use the collapsed **Edit Image** panel to change QR footprint (8–28% of width), black/white threshold, clear zone and downsample resolution. This affects only QR Code.

QR Wi-Fi, contact, email and Pix templates provide pre-filled editable examples and independent **Show below QR** checkboxes for each field. Selected values are drawn below the QR using plain SVG text nodes, and are included in PNG/SVG exports. Example Pix uses the fictional city **Transilvania** and `sample@example.invalid`, which is not an actual payable key.

The preview uses an adaptive white-gray checkerboard for transparency, and default 1D bar height is increased through the actual encoder, not by stretching output images. Specialist symbology fixtures may still require valid standard-specific input.

## v1.5.1 – faster catalog thumbnails

Catalog specimens are created once per symbology using the lightweight BWIPP SVG encoder at scale 1, then cached as tiny image object URLs. They no longer need PNG rasterization, canvas allocation or the styled QR engine. Rendering is lazy, with up to three simultaneous tasks and browser yielding between failed fixture attempts. Real examples were expanded for specialized postal, GS1, composite, HIBC and Swiss QR formats. An unsupported structured sample continues to be labeled honestly rather than replaced with a fictional barcode.

## v1.6 — Variation / Auto Select

An adaptive **Variation** field appears on formats that expose symbol-size, version, layer, or column controls. **Auto Select** is the default for every supported format; fixed versions are validated, encoded without silent substitution and may fail when the selected geometry cannot contain the input. Variation selections are remembered independently for each format and carried into PNG, SVG, WEBP, JPEG, copied images and batch ZIP exports.

Supported (24 format IDs across 9 families):
- **Rectangular Micro QR (rMQR):** all 32 sizes `R7x43` to `R17x139`, with automatic area-based selection.
- **QR Code:** 40 versions, also for GS1 QR, GS1 Digital Link QR and HIBC QR.
- **Micro QR Code:** M1, M2, M3, M4.
- **Data Matrix:** 24 square sizes, 6 rectangular ECC 200 sizes, and 24 DMRE sizes, including applicable GS1, GS1 Digital Link and HIBC matrix wrappers.
- **Aztec Code:** 1–32 layers for full Aztec (also HIBC), 1–4 for compact.
- **PDF417:** 1–30 columns for standard, compact and HIBC. Row count remains automatically sized.
- **MicroPDF417:** 34 permitted rows-by-columns size combinations, also HIBC.
- **Code One:** A–H, T and T-16/32/48, S and S-10/20/30; S requires numeric content.
- **Han Xin Code:** 84 versions.

The menu is hidden for other formats that do not expose a verified discrete size selector. The encoder may refuse a manually selected size when the message does not fit; use Auto Select to recover. In particular Micro QR M1 and Code One S are data-type constrained.

## v1.6.1 — automatic variation feedback and continuous typing

The **Variation** control is now directly below the Symbology selector. **Auto Select** is a separate checkbox (checked by default); it disables manual selection while the adjacent dropdown tracks the version actually generated. QR Code obtains its version from the styled encoder's module count; rMQR reports the exact successful fixed size, and other BWIPP symbologies attempt to match the automatically generated symbol to known fixed-size geometry. If no reliable match is available, the dropdown explicitly says the automatic version was not reported, instead of showing an inaccurate choice. Unchecking Auto Select adopts the last detected size when possible and enables manual control.

The Code content field continues listening to browser `input` events for every repeated keystroke. A trailing debounce with a maximum wait of 170 ms ensures previews refresh during a long held key, without encoding at every individual repeat. Existing image resolution and exports remain unchanged.
