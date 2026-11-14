/** Browser barcode catalog. Symbology IDs match BWIPP / bwip-js encoder names. */
export const CATEGORIES = [
  { id:'all', label:'All' }, { id:'2d', label:'2D codes' },
  { id:'linear', label:'Linear' }, { id:'retail', label:'Retail' },
  { id:'gs1', label:'GS1' }, { id:'postal', label:'Postal' },
  { id:'health', label:'Healthcare / HIBC' },
];

// Suggestions are placeholders only: never written into an input by the app.
export const FORMATS = [
  {
    "id": "qrcode",
    "name": "QR Code",
    "category": "2d",
    "kind": "matrix",
    "example": "https://example.com",
    "hint": "Any text, URL, Wi-Fi configuration, vCard, email, or Brazilian Pix payload. Logo and module shapes available."
  },
  {
    "id": "microqrcode",
    "name": "Micro QR Code",
    "category": "2d",
    "kind": "matrix",
    "example": "123456789",
    "hint": "Compact matrix for short messages; reduced data capacity compared with QR Code."
  },
  {
    "id": "rectangularmicroqrcode",
    "name": "Rectangular Micro QR (rMQR)",
    "category": "2d",
    "kind": "matrix",
    "example": "HELLO-2026",
    "hint": "Rectangular QR designed for narrow labels; limited capacity."
  },
  {
    "id": "datamatrix",
    "name": "Data Matrix",
    "category": "2d",
    "kind": "matrix",
    "example": "BATCH-2026-001",
    "hint": "Compact industrial 2D symbol, often used for traceability and item marking."
  },
  {
    "id": "datamatrixrectangular",
    "name": "Rectangular Data Matrix",
    "category": "2d",
    "kind": "matrix",
    "example": "BATCH-001",
    "hint": "Rectangular Data Matrix for labels with unusual proportions."
  },
  {
    "id": "datamatrixrectangularextension",
    "name": "Data Matrix (DMRE)",
    "category": "2d",
    "kind": "matrix",
    "example": "BATCH-2026",
    "hint": "DMRE extended rectangular Data Matrix."
  },
  {
    "id": "azteccode",
    "name": "Aztec Code",
    "category": "2d",
    "kind": "matrix",
    "example": "TICKET-123456",
    "hint": "2D symbol used on tickets and boarding passes."
  },
  {
    "id": "azteccodecompact",
    "name": "Compact Aztec Code",
    "category": "2d",
    "kind": "matrix",
    "example": "TICKET123",
    "hint": "Compact Aztec variant for shorter values."
  },
  {
    "id": "aztecrune",
    "name": "Aztec Rune",
    "category": "2d",
    "kind": "matrix",
    "example": "42",
    "hint": "A decimal integer from 0 to 255."
  },
  {
    "id": "pdf417",
    "name": "PDF417",
    "category": "2d",
    "kind": "matrix",
    "example": "DOCUMENT-123456789",
    "hint": "Stacked 2D barcode used in IDs, tickets, and documents."
  },
  {
    "id": "pdf417compact",
    "name": "Compact PDF417",
    "category": "2d",
    "kind": "matrix",
    "example": "DOCUMENT-2026",
    "hint": "Compact PDF417 symbology."
  },
  {
    "id": "micropdf417",
    "name": "MicroPDF417",
    "category": "2d",
    "kind": "matrix",
    "example": "BATCH-123",
    "hint": "Small PDF417 variant for limited label space."
  },
  {
    "id": "maxicode",
    "name": "MaxiCode",
    "category": "2d",
    "kind": "matrix",
    "example": "1234567890",
    "hint": "Shipping symbology; requires properly structured carrier data."
  },
  {
    "id": "dotcode",
    "name": "DotCode",
    "category": "2d",
    "kind": "matrix",
    "example": "SERIAL-001",
    "hint": "Dot-based matrix for high-speed industrial printing."
  },
  {
    "id": "hanxin",
    "name": "Han Xin Code",
    "category": "2d",
    "kind": "matrix",
    "example": "123456789",
    "hint": "High-capacity 2D symbology for multilingual content."
  },
  {
    "id": "ultracode",
    "name": "Ultracode",
    "category": "2d",
    "kind": "matrix",
    "example": "HELLO123",
    "hint": "Multicolor matrix with format-specific encoding rules."
  },
  {
    "id": "codeone",
    "name": "Code One",
    "category": "2d",
    "kind": "matrix",
    "example": "CODE-ONE-2026",
    "hint": "Matrix symbology for inventory and shipping."
  },
  {
    "id": "d3aqr",
    "name": "D3 AQR (beta)",
    "category": "2d",
    "kind": "matrix",
    "example": "HELLO2026",
    "hint": "Experimental D3 AQR format. Use standards-compliant data."
  },
  {
    "id": "swissqrcode",
    "name": "Swiss QR Code",
    "category": "2d",
    "kind": "matrix",
    "example": "Swiss payment fields separated by newlines",
    "hint": "Swiss payment QR: requires the official multi-line payment record; plain text does not work."
  },
  {
    "id": "gs1dlqrcode",
    "name": "GS1 Digital Link QR",
    "category": "gs1",
    "kind": "matrix",
    "example": "https://id.gs1.org/01/09506000134352",
    "hint": "GS1 Digital Link URI beginning with https:// and containing GS1 identifiers."
  },
  {
    "id": "gs1dldatamatrix",
    "name": "GS1 Digital Link Data Matrix",
    "category": "gs1",
    "kind": "matrix",
    "example": "https://id.gs1.org/01/09506000134352",
    "hint": "Data Matrix carrying a GS1 Digital Link URI."
  },
  {
    "id": "code128",
    "name": "Code 128",
    "category": "linear",
    "kind": "linear",
    "example": "ABC-123456789",
    "hint": "Flexible alphanumeric barcode for product, inventory and shipment identifiers."
  },
  {
    "id": "code39",
    "name": "Code 39",
    "category": "linear",
    "kind": "linear",
    "example": "ABC-12345",
    "hint": "Uppercase A–Z, digits, spaces and - . $ / + % only."
  },
  {
    "id": "code39ext",
    "name": "Extended Code 39",
    "category": "linear",
    "kind": "linear",
    "example": "ABC-12345",
    "hint": "Extended Code 39 supports extra characters."
  },
  {
    "id": "code93",
    "name": "Code 93",
    "category": "linear",
    "kind": "linear",
    "example": "ABC-12345",
    "hint": "Compact alphanumeric Code 93 barcode."
  },
  {
    "id": "code93ext",
    "name": "Extended Code 93",
    "category": "linear",
    "kind": "linear",
    "example": "ABC-12345",
    "hint": "Extended Code 93 supports extra characters."
  },
  {
    "id": "code11",
    "name": "Code 11",
    "category": "linear",
    "kind": "linear",
    "example": "12345-67",
    "hint": "Digits and hyphens only."
  },
  {
    "id": "code16k",
    "name": "Code 16K",
    "category": "linear",
    "kind": "stacked",
    "example": "ABC123456",
    "hint": "Stacked format derived from Code 128."
  },
  {
    "id": "code49",
    "name": "Code 49",
    "category": "linear",
    "kind": "stacked",
    "example": "ABC123456",
    "hint": "Stacked alphanumeric format."
  },
  {
    "id": "code2of5",
    "name": "Code 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "Numeric 2 of 5 barcode."
  },
  {
    "id": "interleaved2of5",
    "name": "Interleaved 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "12345678",
    "hint": "Even number of digits only."
  },
  {
    "id": "industrial2of5",
    "name": "Industrial 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "matrix2of5",
    "name": "Matrix 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "datalogic2of5",
    "name": "Datalogic 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "coop2of5",
    "name": "COOP 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "iata2of5",
    "name": "IATA 2 of 5",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "code32",
    "name": "Code 32 (pharmaceutical)",
    "category": "health",
    "kind": "linear",
    "example": "12345678",
    "hint": "Healthcare or pharmaceutical barcode. Follow the standard input format."
  },
  {
    "id": "codablockf",
    "name": "Codablock F",
    "category": "linear",
    "kind": "stacked",
    "example": "ABC123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "posicode",
    "name": "PosiCode",
    "category": "linear",
    "kind": "linear",
    "example": "ABC123",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "plessey",
    "name": "Plessey",
    "category": "linear",
    "kind": "linear",
    "example": "01234567",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "msi",
    "name": "MSI Plessey",
    "category": "linear",
    "kind": "linear",
    "example": "123456789",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "telepen",
    "name": "Telepen",
    "category": "linear",
    "kind": "linear",
    "example": "ABC12345",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "telepennumeric",
    "name": "Telepen numeric",
    "category": "linear",
    "kind": "linear",
    "example": "12345678",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "channelcode",
    "name": "Channel Code",
    "category": "linear",
    "kind": "linear",
    "example": "12345",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "bc412",
    "name": "BC412",
    "category": "linear",
    "kind": "linear",
    "example": "ABC123",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "pharmacode",
    "name": "Pharmacode",
    "category": "health",
    "kind": "linear",
    "example": "12345",
    "hint": "Pharmaceutical one-track numeric barcode; restricted numeric range."
  },
  {
    "id": "pharmacode2",
    "name": "Pharmacode 2-track",
    "category": "health",
    "kind": "linear",
    "example": "12345",
    "hint": "Two-track numeric Pharmacode."
  },
  {
    "id": "flattermarken",
    "name": "Flattermarken",
    "category": "linear",
    "kind": "linear",
    "example": "123456",
    "hint": "1D barcode for identifiers. Character set and length depend on the selected standard."
  },
  {
    "id": "rationalizedCodabar",
    "name": "Codabar",
    "category": "linear",
    "kind": "linear",
    "example": "A123456B",
    "hint": "Numeric data with a valid start/stop character (A–D)."
  },
  {
    "id": "raw",
    "name": "Raw bars (advanced)",
    "category": "linear",
    "kind": "linear",
    "example": "BWIPP raw patterns (advanced)",
    "hint": "Advanced BWIPP bar pattern syntax; not plain binary text."
  },
  {
    "id": "ean13",
    "name": "EAN-13",
    "category": "retail",
    "kind": "linear",
    "example": "7891234567895",
    "hint": "Enter 12 digits to auto-calculate the check digit, or a complete valid 13-digit GTIN."
  },
  {
    "id": "ean8",
    "name": "EAN-8",
    "category": "retail",
    "kind": "linear",
    "example": "96385074",
    "hint": "Enter 7 digits to auto-calculate the check digit, or a valid 8-digit GTIN."
  },
  {
    "id": "ean14",
    "name": "EAN-14",
    "category": "retail",
    "kind": "linear",
    "example": "12345678901231",
    "hint": "Enter 13 digits to auto-calculate the check digit, or a valid 14-digit GTIN."
  },
  {
    "id": "ean2",
    "name": "EAN-2 (add-on)",
    "category": "retail",
    "kind": "linear",
    "example": "12",
    "hint": "Exactly 2 digits; EAN/UPC supplement."
  },
  {
    "id": "ean5",
    "name": "EAN-5 (add-on)",
    "category": "retail",
    "kind": "linear",
    "example": "12345",
    "hint": "Exactly 5 digits; EAN/UPC supplement."
  },
  {
    "id": "upca",
    "name": "UPC-A",
    "category": "retail",
    "kind": "linear",
    "example": "012345678905",
    "hint": "Enter 11 digits to calculate the check digit, or a valid 12-digit UPC."
  },
  {
    "id": "upce",
    "name": "UPC-E",
    "category": "retail",
    "kind": "linear",
    "example": "01234565",
    "hint": "UPC-E requires a compressible number with valid zero-suppression pattern."
  },
  {
    "id": "itf14",
    "name": "ITF-14",
    "category": "retail",
    "kind": "linear",
    "example": "12345678901231",
    "hint": "Enter 13 digits to calculate the check digit, or a valid 14-digit GTIN."
  },
  {
    "id": "isbn",
    "name": "ISBN",
    "category": "retail",
    "kind": "linear",
    "example": "9780306406157",
    "hint": "Valid ISBN-10 or ISBN-13; separators may be accepted."
  },
  {
    "id": "ismn",
    "name": "ISMN",
    "category": "retail",
    "kind": "linear",
    "example": "9790230671187",
    "hint": "Valid ISMN identifier."
  },
  {
    "id": "issn",
    "name": "ISSN",
    "category": "retail",
    "kind": "linear",
    "example": "0317-8471",
    "hint": "Valid ISSN identifier, usually 8 characters."
  },
  {
    "id": "mands",
    "name": "Marks & Spencer",
    "category": "retail",
    "kind": "linear",
    "example": "123456",
    "hint": "Retail barcode with format-specific numeric identifiers and check digits."
  },
  {
    "id": "gs1-128",
    "name": "GS1-128",
    "category": "gs1",
    "kind": "linear",
    "example": "(01)09506000134352(17)271231",
    "hint": "GS1 Application Identifiers, e.g. (01)GTIN(17)YYMMDD. Validate your GTIN."
  },
  {
    "id": "sscc18",
    "name": "SSCC-18",
    "category": "gs1",
    "kind": "linear",
    "example": "123456789012345675",
    "hint": "Enter 17 digits to calculate the check digit, or a valid 18-digit SSCC."
  },
  {
    "id": "gs1qrcode",
    "name": "GS1 QR Code",
    "category": "gs1",
    "kind": "matrix",
    "example": "(01)09506000134352",
    "hint": "GS1 Application Identifiers as structured input. No custom QR logo."
  },
  {
    "id": "gs1datamatrix",
    "name": "GS1 Data Matrix",
    "category": "gs1",
    "kind": "matrix",
    "example": "(01)09506000134352",
    "hint": "GS1 Application Identifiers, e.g. (01) followed by a valid GTIN."
  },
  {
    "id": "gs1datamatrixrectangular",
    "name": "Rectangular GS1 Data Matrix",
    "category": "gs1",
    "kind": "matrix",
    "example": "(01)09506000134352",
    "hint": "Rectangular GS1 Data Matrix with structured AIs."
  },
  {
    "id": "gs1dotcode",
    "name": "GS1 DotCode",
    "category": "gs1",
    "kind": "matrix",
    "example": "(01)09506000134352",
    "hint": "Structured GS1 Application Identifiers for a DotCode symbol."
  },
  {
    "id": "gs1-cc",
    "name": "GS1 Composite 2D",
    "category": "gs1",
    "kind": "stacked",
    "example": "(10)ABC123",
    "hint": "GS1 composite two-dimensional component; requires an AI-structured payload."
  },
  {
    "id": "databaromni",
    "name": "GS1 DataBar Omni",
    "category": "gs1",
    "kind": "linear",
    "example": "09506000134352",
    "hint": "GS1 DataBar requiring a valid GTIN."
  },
  {
    "id": "databartruncated",
    "name": "GS1 DataBar Truncated",
    "category": "gs1",
    "kind": "linear",
    "example": "09506000134352",
    "hint": "Truncated GS1 DataBar requiring a valid GTIN."
  },
  {
    "id": "databarstacked",
    "name": "GS1 DataBar Stacked",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352",
    "hint": "Stacked GS1 DataBar requiring a valid GTIN."
  },
  {
    "id": "databarstackedomni",
    "name": "GS1 DataBar Stacked Omni",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352",
    "hint": "Stacked omni-directional GS1 DataBar requiring a valid GTIN."
  },
  {
    "id": "databarlimited",
    "name": "GS1 DataBar Limited",
    "category": "gs1",
    "kind": "linear",
    "example": "09506000134352",
    "hint": "GS1 DataBar Limited with restricted GTIN ranges."
  },
  {
    "id": "databarexpanded",
    "name": "GS1 DataBar Expanded",
    "category": "gs1",
    "kind": "linear",
    "example": "(01)09506000134352",
    "hint": "GS1 DataBar with structured Application Identifiers."
  },
  {
    "id": "databarexpandedstacked",
    "name": "GS1 DataBar Expanded Stacked",
    "category": "gs1",
    "kind": "stacked",
    "example": "(01)09506000134352",
    "hint": "Stacked GS1 DataBar with structured Application Identifiers."
  },
  {
    "id": "gs1-128composite",
    "name": "GS1-128 Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "(01)09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "ean13composite",
    "name": "EAN-13 Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "7891234567895|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "ean8composite",
    "name": "EAN-8 Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "96385074|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "upcacomposite",
    "name": "UPC-A Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "012345678905|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "upcecomposite",
    "name": "UPC-E Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "01234565|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databaromnicomposite",
    "name": "GS1 DataBar Omni Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databartruncatedcomposite",
    "name": "GS1 DataBar Truncated Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databarstackedcomposite",
    "name": "GS1 DataBar Stacked Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databarstackedomnicomposite",
    "name": "GS1 DataBar Stacked Omni Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databarlimitedcomposite",
    "name": "GS1 DataBar Limited Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databarexpandedcomposite",
    "name": "GS1 DataBar Expanded Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "(01)09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "databarexpandedstackedcomposite",
    "name": "GS1 DataBar Expanded Stacked Composite",
    "category": "gs1",
    "kind": "stacked",
    "example": "(01)09506000134352|(10)ABC",
    "hint": "Composite barcode with linear and 2D components; requires standard-specific structured data."
  },
  {
    "id": "gs1northamericancoupon",
    "name": "GS1 North American Coupon",
    "category": "gs1",
    "kind": "stacked",
    "example": "GS1 coupon data with valid AIs",
    "hint": "GS1 barcode; supply standards-compliant data with Application Identifiers where required."
  },
  {
    "id": "postnet",
    "name": "USPS POSTNET",
    "category": "postal",
    "kind": "postal",
    "example": "123456789",
    "hint": "Numeric US postal code (ZIP or ZIP+4)."
  },
  {
    "id": "planet",
    "name": "USPS PLANET",
    "category": "postal",
    "kind": "postal",
    "example": "12345678901",
    "hint": "USPS PLANET requires an appropriately sized numeric value."
  },
  {
    "id": "onecode",
    "name": "USPS Intelligent Mail",
    "category": "postal",
    "kind": "postal",
    "example": "01234567094987654321",
    "hint": "USPS Intelligent Mail tracking code (20 digits, optional routing)."
  },
  {
    "id": "royalmail",
    "name": "Royal Mail 4-State",
    "category": "postal",
    "kind": "postal",
    "example": "ABC123456",
    "hint": "Royal Mail 4-state barcode for eligible address text."
  },
  {
    "id": "mailmark",
    "name": "Royal Mail Mailmark",
    "category": "postal",
    "kind": "postal",
    "example": "Structured Mailmark record",
    "hint": "Royal Mail Mailmark requires a fully structured record."
  },
  {
    "id": "kix",
    "name": "KIX (Netherlands)",
    "category": "postal",
    "kind": "postal",
    "example": "1234AB56",
    "hint": "Dutch postal addressing code."
  },
  {
    "id": "auspost",
    "name": "Australia Post",
    "category": "postal",
    "kind": "postal",
    "example": "Structured Australia Post record",
    "hint": "Australia Post requires structured postal fields."
  },
  {
    "id": "japanpost",
    "name": "Japan Post",
    "category": "postal",
    "kind": "postal",
    "example": "1234567-890",
    "hint": "Japanese postal barcode using postal numbers and permitted characters."
  },
  {
    "id": "leitcode",
    "name": "Deutsche Post Leitcode",
    "category": "postal",
    "kind": "postal",
    "example": "1234567890123",
    "hint": "German postal sorting identifier."
  },
  {
    "id": "identcode",
    "name": "Deutsche Post Identcode",
    "category": "postal",
    "kind": "postal",
    "example": "12345678901",
    "hint": "German postal identification identifier."
  },
  {
    "id": "daft",
    "name": "DAFT (4-State)",
    "category": "postal",
    "kind": "postal",
    "example": "FTAD",
    "hint": "4-state DAFT sequence using letters D, A, F and T."
  },
  {
    "id": "hibccode128",
    "name": "HIBC Code 128",
    "category": "health",
    "kind": "linear",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibccode39",
    "name": "HIBC Code 39",
    "category": "health",
    "kind": "linear",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcazteccode",
    "name": "HIBC Aztec",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcdatamatrix",
    "name": "HIBC Data Matrix",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcdatamatrixrectangular",
    "name": "Rectangular HIBC Data Matrix",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcqrcode",
    "name": "HIBC QR Code",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcpdf417",
    "name": "HIBC PDF417",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibcmicropdf417",
    "name": "HIBC MicroPDF417",
    "category": "health",
    "kind": "matrix",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "hibccodablockf",
    "name": "HIBC Codablock F",
    "category": "health",
    "kind": "stacked",
    "example": "+A123BJC5D6E",
    "hint": "HIBC healthcare symbol. Requires a valid HIBC label with appropriate check character."
  },
  {
    "id": "pzn",
    "name": "PZN (Germany)",
    "category": "health",
    "kind": "linear",
    "example": "12345678",
    "hint": "German pharmaceutical product identifier (PZN)."
  }
];

export const QUICK_IDS = ['qrcode','code128','datamatrix','ean13'];
export const SIDEBAR_IDS = ['qrcode','code128','ean13','pdf417','datamatrix','azteccode'];
export const byId = new Map(FORMATS.map(item => [item.id,item]));
export function lookupFormat(id) { return byId.get(id) || byId.get('qrcode'); }
export function searchFormats(query='', category='all') {
  const normalized = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const q=normalized(query.trim());
  return FORMATS.filter(item => (category === 'all' || item.category === category) &&
    normalized(`${item.id} ${item.name} ${item.hint} ${item.category}`).includes(q));
}
