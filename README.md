# A404DC

**A browser-based workspace for creating, customizing, and exporting QR codes, barcodes, and other automatic identification symbols.**

A404DC brings **110 symbologies** into one searchable interface—from everyday QR codes and retail barcodes to specialized formats used in logistics, industry, healthcare, and identification. Choose a format, enter your data, fine-tune its appearance, and download an image or vector file.

**[Try A404DC in your browser](https://d0b3427e.aidc-generator.pages.dev/)** · [Explore the source code](https://github.com/F404X/aidc-generator)

No account, server-side barcode generation, or installation is required to use the hosted app.

## Create your first code

1. Open A404DC and select **QR Code** in the **Symbology** menu.
2. Enter `https://example.com` in **Code content**. The preview updates as you type.
3. Click **Download PNG** and scan the image with your phone to open the link.

To make an inventory label, select **Code 128** and try `ITEM-001`. For a design or print layout, export as **SVG** to resize the code without losing sharpness.

## What can you make?

| Category | Examples | Typical uses |
| --- | --- | --- |
| **QR and 2D codes** | QR Code, Micro QR, rMQR, Data Matrix, Aztec, PDF417 | Links, digital information, labels, compact data |
| **Retail barcodes** | EAN, UPC and related formats | Product identification |
| **Linear barcodes** | Code 128, Code 39, ITF and other 1D formats | Inventory, assets, shipping |
| **Industry and logistics** | GS1 and DataBar families, composite symbols | Product tracking and structured identification |
| **Specialized formats** | Postal, healthcare/HIBC and other standards | Standards-specific workflows |

The **110-format library** is searchable, with compact sample images where the encoder can generate a valid specimen. Some specialist standards require structured data rather than arbitrary text.

## Main features

### Create and customize

- **Live preview:** See the result as you enter or edit data, without stretching the symbol's original proportions.
- **Searchable format catalog:** Find a symbology by name, category, or purpose.
- **Color and transparency controls:** Set foreground and background colors independently, including opacity.
- **QR design tools:** Customize module and finder-pattern shapes, error correction, and an optional center logo.
- **Logo editor:** Resize an uploaded image, turn it black and white, adjust the threshold, and set the clear space around the logo.
- **Barcode settings:** Adjust bar height and toggle human-readable text for compatible linear formats.

### Choose the right variation

Some formats can be generated in more than one size or configuration. For these, **Variation** appears directly under the symbology selector.

- **Auto Select** is enabled by default and lets the encoder choose a suitable configuration.
- When the chosen variation can be identified, its value appears in the disabled selector.
- Turn off Auto Select to choose a supported version, size, number of layers, or column count manually.
- If the selected variation cannot hold the supplied data, the generator reports an error rather than silently choosing another size.

Variation controls are available for **24 catalog entries across nine families**, including **all 32 rMQR sizes**, QR versions 1–40, Micro QR M1–M4, Data Matrix sizes, Aztec layers, PDF417/MicroPDF417 configurations, Code One, and Han Xin. Related GS1 and HIBC variants are covered where applicable.

### Build useful QR content

A404DC includes dedicated forms for common QR tasks, so you do not need to construct the underlying payload manually:

| QR template | What it creates |
| --- | --- |
| **Text / URL** | A QR code containing text or a web address |
| **Wi-Fi** | Network name, security settings, and optional password |
| **Contact** | A vCard containing contact details |
| **Email** | An email link with optional subject and body |
| **Pix (Brazil)** | A static Pix BR Code payload with optional amount and description |

For structured templates, individual field values can optionally be **displayed below the QR code**. These captions are off by default and are included in supported image/vector exports when enabled.

### Export or generate in bulk

| Output | Notes |
| --- | --- |
| **SVG** | Scalable vector output, suitable for further design work |
| **PNG** | Raster image with transparency support |
| **WEBP** | Raster image with transparency support |
| **JPG** | Raster image with an opaque background |
| **Clipboard** | Copy the image or its encoded content |
| **Batch ZIP** | Generate up to **60 PNG codes** from separate lines of text |

Batch generation uses the selected symbology and current appearance settings. Each line is treated as a separate raw payload; batch mode does not fill in the structured QR template forms.

## Privacy and how it works

**Barcode content is processed locally in your browser.** The site generates symbols client-side; it does not require an account, database, or barcode-generation API, and the entered content is not submitted to a generation server.

The application downloads JavaScript libraries, fonts, and other static resources from third-party CDNs. Those providers can receive normal network request metadata, but not your barcode input as an API payload. Initial loading therefore requires an internet connection.

A404DC is a static web app built with **HTML, CSS, and JavaScript ES modules**, using:

- [bwip-js](https://github.com/metafloor/bwip-js) for barcode symbologies
- [qr-code-styling](https://github.com/kozakdenys/qr-code-styling) for styled QR codes
- [JSZip](https://stuk.github.io/jszip/) for batch downloads
- [Lucide](https://lucide.dev/) for interface icons

## Run locally

**Requirements:** [Node.js](https://nodejs.org/) 18 or newer, plus an internet connection to load the browser-side libraries.

~~~bash
git clone https://github.com/F404X/aidc-generator.git
cd aidc-generator
npm run dev
~~~

Open **http://localhost:4173**.

A404DC has no production build step, backend, or database. Use its local HTTP server rather than opening the HTML file directly through a file URL, since browsers can restrict ES module loading from local files.

### Checks and tests

~~~bash
npm install
npm run check
npm test
~~~

For a broader encoding audit of the catalog:

~~~bash
npm run audit:engine
~~~

The full encoder audit produces a JSON report in the project root. It may report failures for specialist formats whose sample data does not satisfy the required standards; a passing general test suite is not certification of every encoded standard.

## Important limitations

- **A404DC generates codes; it is not a barcode scanner or decoder.**
- **Valid content matters.** Formats such as GS1, postal, healthcare, and retail codes may require specific lengths, checksums, identifiers, or structured fields. Not every format accepts arbitrary text.
- **Test before production use.** Scanner compatibility depends on the symbology, payload, dimensions, colors, physical printing, and the target device.
- **Pix is static.** The Pix template constructs a BR Code payload; it does not verify a payment request or recipient against a bank. Verify all payment details in a trusted banking app.
- **QR logos and low contrast affect readability.** Larger logos, transparency, and unusual colors can make a code harder to scan.
- **Clipboard support varies by browser.** Copying images generally requires HTTPS or localhost.

## Contributing

Bug reports, suggestions, and contributions are welcome through [GitHub Issues](https://github.com/F404X/aidc-generator/issues) and [Pull Requests](https://github.com/F404X/aidc-generator/pulls).

## License

Released under the [MIT License](LICENSE). Third-party libraries retain their respective licenses.

**Created by [F404X](https://github.com/F404X).**
