import { CATEGORIES, FORMATS, QUICK_IDS, lookupFormat, searchFormats } from './catalog.mjs?v=1.5.0';
import { TEMPLATES, buildTemplate } from './payloads.mjs?v=1.4.0';
import { renderCode, svgBlob, svgToRaster } from './renderer.mjs?v=1.5.0';
import { ensureEngine, warmupEngines } from './engines.mjs?v=1.4.0';
import { observeThumbnail, unobserveThumbnails } from './thumbnails.mjs?v=1.4.0';
import {variationSpec} from './variations.mjs?v=1.6.1';
import {extractDetectedVariation} from './auto-variation.mjs?v=1.6.1';
import { normalizeHex, contrastRatio, safeFilename, triggerDownload, nextFrame, debounce, debounceWithMaxWait } from './utils.mjs?v=1.6.1';

const $ = id => document.getElementById(id);
const DEFAULTS = Object.freeze({foreground:'#19170E', background:'#FFFFFF', foregroundOpacity:100, backgroundOpacity:100, size:512, margin:16, dotStyle:'square', cornerStyle:'square', correction:'H', barHeight:34, showText:true, logo:null, logoSize:20, logoBlackWhite:false, logoThreshold:145, logoMaxDimension:384, logoPadding:3});
const SAMPLE_FIELDS={
 wifi:{ssid:'Transilvania WiFi',password:'sample-password',encryption:'WPA',hidden:false},
 contact:{name:'Alex Demo',phone:'+55 11 99999-9999',email:'alex@example.invalid',organization:'Example Co.',website:'https://example.com'},
 email:{to:'hello@example.invalid',subject:'Sample message',body:'Hello from A404DC'},
 pix:{key:'sample@example.invalid',name:'SAMPLE MERCHANT',city:'Transilvania',amount:'25.90',description:'Demo payment'},
};
const CAPTION_DEFAULTS={wifi:{},contact:{},email:{},pix:{}};

const state = {
  format: lookupFormat('qrcode'), template:'text', settings:{...DEFAULTS},
  values: {qrcode:'https://example.com'}, fields:structuredClone(SAMPLE_FIELDS), captions:structuredClone(CAPTION_DEFAULTS), variations:{}, autoVariations:{}, detectedVariations:{}, variationScanned:{}, logoSource:null, logoToken:0,
  svg:null, exportSvg:null, lastPayload:'', lastRevision:-1, exportRevision:-1, revision:0, previewUrl:null, previewToken:0,
  catalogCategory:'all', batchRunning:false, lastFocused:null,
};

function icons() { if (window.lucide?.createIcons) window.lucide.createIcons(); }
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
function toast(message, type='success') {
  const item = el('div',`toast ${type}`);
  const icon = el('i'); icon.setAttribute('data-lucide',type === 'error' ? 'alert-triangle' : 'check-circle-2');
  item.append(icon,el('span','',message));
  $('toastStack').append(item); icons();
  setTimeout(() => { item.classList.add('toast-out'); setTimeout(()=>item.remove(),250); },3500);
}
function snapshotSettings() {
  const spec=variationSpec(state.format.id);
  const manual=state.variations[state.format.id]||spec?.options[0]?.value;
  const variation=state.autoVariations[state.format.id]===false?manual:'auto';
  const settings={...state.settings,variation};
  if(state.format.id==='qrcode' && state.template!=='text'){
    settings.captionItems=TEMPLATES[state.template].fields
      .filter(field=>state.captions[state.template]?.[field.key] && String(state.fields[state.template][field.key]??'').trim())
      .map(field=>({label:field.label,value:String(state.fields[state.template][field.key])}));
  }
  return settings;
}
function currentPayload() {
  return state.format.id === 'qrcode' && state.template !== 'text'
    ? buildTemplate(state.template,state.fields[state.template])
    : $('payloadInput').value;
}
function hasInput() {
  if (state.format.id !== 'qrcode' || state.template === 'text') return Boolean($('payloadInput').value.trim());
  const fields = state.fields[state.template];
  return Object.entries(fields).some(([key,value]) => key !== 'encryption' && key !== 'hidden' && String(value ?? '').trim() !== '');
}
function refreshCount() {
  if (!hasInput()) { $('charCount').textContent = '0 characters'; return; }
  try { $('charCount').textContent = `${[...currentPayload()].length.toLocaleString('en-US')} characters`; }
  catch { $('charCount').textContent = 'Incomplete fields'; }
}
function syncContrast() {
  const ratio = contrastRatio(state.settings.foreground, state.settings.background);
  const note = $('downloadNote'), badge = $('readyBadge');
  const transparent = state.settings.foregroundOpacity < 100 || state.settings.backgroundOpacity < 100;
  if (ratio < 3 || transparent) {
    note.textContent = transparent
      ? 'Transparency may reduce scanner readability. Test the result against its final background.'
      : 'Low color contrast can make codes unreadable. Choose darker foreground and a light background.';
    note.classList.add('warning-text');
    if (state.svg) {badge.classList.add('warning'); badge.textContent = 'Low contrast';}
  } else {
    note.textContent = 'PNG, JPG, WEBP or SVG. SVG is resolution-independent.';
    note.classList.remove('warning-text');
    if (state.svg) {badge.classList.remove('warning'); badge.textContent = 'Generated';}
  }
}
function clearPreview() {
  $('previewLoading').hidden = true;
  $('previewImage').hidden = true;
  $('previewImage').style.opacity = '1';
  $('previewError').hidden = true;
  $('previewEmpty').hidden = false;
  $('readyBadge').textContent = 'Awaiting input';
  $('readyBadge').classList.remove('warning');
  ++state.previewToken;
  if (state.previewUrl) {URL.revokeObjectURL(state.previewUrl); state.previewUrl = null;}
  $('previewImage').removeAttribute('src');
  state.svg = null;
}
function setBusy() {
  $('previewEmpty').hidden = true;
  $('previewLoading').hidden = false;
  $('previewError').hidden = true;
  $('previewImage').style.opacity = '0.45';
  $('readyBadge').textContent = 'Generating…';
  $('readyBadge').classList.remove('warning');
}
function setError(message) {
  $('previewLoading').hidden = true;
  $('previewEmpty').hidden = true;
  $('previewImage').hidden = true;
  $('previewError').hidden = false;
  $('previewErrorText').textContent = message;
  $('readyBadge').textContent = 'Check input';
  $('readyBadge').classList.add('warning');
}

/** Fit the raster to the usable preview area, including HiDPI screens. */
function previewRasterSize() {
  const area = $('previewArtboard');
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  return Math.min(2048, Math.max(320, Math.ceil(Math.max(area.clientWidth, area.clientHeight) * dpr)));
}

/** Paint a PNG preview without recalculating the barcode on container resize. */
async function paintPreview(svg, revision) {
  const token = ++state.previewToken;
  const png = await svgToRaster(svg, 'image/png', previewRasterSize());
  if (revision !== state.revision || token !== state.previewToken) return false;
  const url = URL.createObjectURL(png);
  try {
    // Decode before replacing the visible image to avoid a blank/stale preview.
    const decoded = new Image();
    decoded.src = url;
    await decoded.decode();
    if (revision !== state.revision || token !== state.previewToken) return false;
    const image = $('previewImage');
    const previousUrl = state.previewUrl;
    state.previewUrl = url;
    image.src = url;
    image.hidden = false;
    image.style.opacity = '1';
    $('previewLoading').hidden = true;
    $('previewError').hidden = true;
    $('previewEmpty').hidden = true;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    return true;
  } finally {
    if (state.previewUrl !== url) URL.revokeObjectURL(url);
  }
}

async function renderNow() {
  const revision = state.revision, format = state.format, settings = snapshotSettings();
  if (!hasInput()) { clearPreview(); return null; }
  setBusy();
  try {
    const payload = currentPayload();
    const svg = await renderCode(format, payload, settings, {preview: true});
    if (revision !== state.revision) return null;
    if (!await paintPreview(svg, revision)) return null;
    recordDetectedVariation(format,svg);
    state.svg = svg;
    state.lastRevision = revision;
    state.lastPayload = payload;
    syncContrast();
    return svg;
  } catch (error) {
    if (revision !== state.revision) return null;
    state.svg = null;
    state.lastRevision = revision;
    setError(error?.message || 'Could not generate this format.');
    return null;
  }
}
// Short trailing-edge debounce: visually updates almost immediately while typing,
// but expensive QR SVG renders are not launched for every keystroke burst.
const scheduleRender = debounceWithMaxWait(renderNow, 55, 170);
function changed() {
  ++state.revision;
  state.exportSvg = null;
  state.exportRevision = -1;
  refreshCount();
  if(state.autoVariations[state.format.id]!==false && variationSpec(state.format.id)){
    state.variationScanned[state.format.id]=false;
    updateVariationDisplay(state.format);
  }
  if (!hasInput()) {scheduleRender.cancel(); clearPreview(); return;}
  scheduleRender();
}
async function ensureResult() {
  if (!hasInput()) throw new Error('Enter a value before exporting.');
  if (state.exportSvg && state.exportRevision === state.revision) return state.exportSvg;
  const revision=state.revision;
  const payload=currentPayload();
  const svg=await renderCode(state.format,payload,snapshotSettings());
  if (revision !== state.revision) throw new Error('Settings changed. Please try exporting again.');
  recordDetectedVariation(state.format,svg);
  state.exportSvg = svg;
  state.exportRevision = revision;
  return svg;
}

function formatIcon(kind) {
  return kind === 'matrix' ? 'qr-code' : kind === 'postal' ? 'mail' : kind === 'stacked' ? 'layers-3' : 'barcode';
}
function quickButton(format) {
  const btn = el('button',`quick-type ${state.format.id === format.id ? 'is-active' : ''}`);
  btn.type='button'; btn.dataset.formatId = format.id;
  const thumb = el('span','code-thumb quick-thumb is-loading');
  const label = el('span','quick-copy');
  label.append(el('span','quick-label',format.name),el('span','thumb-sample'));
  btn.append(thumb,label);
  observeThumbnail(thumb,format);
  btn.addEventListener('click',()=>selectFormat(format.id));
  return btn;
}
function renderQuickTypes() {
  unobserveThumbnails($('quickTypes'));
  $('quickTypes').replaceChildren(...QUICK_IDS.map(id=>quickButton(lookupFormat(id))));

  icons();
}
/** Display the actual encoder-selected version in the disabled select. */
function updateVariationDisplay(format){
  if(!variationSpec(format.id) || state.format.id!==format.id)return;
  const select=$('variationSelect'),auto=state.autoVariations[format.id]!==false;
  const detected=state.detectedVariations[format.id];
  const manual=state.variations[format.id];
  const candidate=auto?detected:manual;
  const valid=variationSpec(format.id).options.some(option=>option.value===candidate);
  select.value=valid?candidate:'';
  select.disabled=auto;
  $('variationAuto').checked=auto;
  const placeholder=select.querySelector('option[value=""]');
  if(placeholder)placeholder.textContent=auto
    ?(state.variationScanned[format.id]?'Automatic · version not exposed':'Detecting variation…')
    :'Choose a variation';
}
function recordDetectedVariation(format,svg){
  if(state.autoVariations[format.id]===false || !variationSpec(format.id))return;
  const detected=extractDetectedVariation(svg);
  state.detectedVariations[format.id]=variationSpec(format.id).options.some(option=>option.value===detected)?detected:null;
  state.variationScanned[format.id]=true;
  updateVariationDisplay(format);
}
function syncVariation(format) {
  const row=$('variationRow'),select=$('variationSelect'),hint=$('variationHint');
  const spec=variationSpec(format.id);
  row.hidden=!spec;
  if(!spec){select.replaceChildren();return;}
  const placeholder=el('option','','Detecting variation…');
  placeholder.value='';placeholder.disabled=true;
  const choices=spec.options.map(item=>{
    const option=el('option','',item.label);
    option.value=item.value;
    return option;
  });
  select.replaceChildren(placeholder,...choices);
  select.setAttribute('aria-label',spec.title);
  $('variationDescription').textContent=spec.title;
  hint.textContent=spec.hint;
  updateVariationDisplay(format);
}
function selectFormat(id) {
  const next = lookupFormat(id);
  if (state.format.id !== next.id) {
    if (state.template === 'text' || state.format.id !== 'qrcode') state.values[state.format.id] = $('payloadInput').value;
    state.format = next;
    $('payloadInput').value = state.values[next.id] ?? next.example ?? '';
  }
  if (next.id !== 'qrcode') {
    state.template = 'text';
  }
  $('qrSettings').hidden = next.id !== 'qrcode';
  $('templateRow').hidden = next.id !== 'qrcode';
  $('linearSettings').hidden = next.kind !== 'linear';
  $('formatTriggerLabel').textContent = next.name;
  $('currentFormatName').textContent = next.name;
  $('payloadHint').textContent = next.hint;
  $('payloadInput').placeholder = next.example ? `Example: ${next.example}` : `Enter valid ${next.name} data…`;
  $('currentFormatHint').textContent = 'Crisp vector output';
  syncVariation(next);
  syncTemplateUI();
  renderQuickTypes();
  closeCatalog();
  changed();
}

function addField(field,data) {
 const label=el('label','dynamic-field');
 const row=el('span','dynamic-label');
 row.append(el('span','',field.label));
 const include=el('span','caption-toggle');
 const toggle=el('input');toggle.type='checkbox';toggle.checked=Boolean(state.captions[state.template]?.[field.key]);
 toggle.setAttribute('aria-label','Include '+field.label+' below QR');
 toggle.addEventListener('change',()=>{state.captions[state.template][field.key]=toggle.checked;changed();});
 include.append(toggle,el('span','','Show below QR'));row.append(include);label.append(row);
 if(field.type==='checkbox'){
  const control=el('input');control.type='checkbox';control.checked=Boolean(data[field.key]);
  control.addEventListener('change',()=>{data[field.key]=control.checked;changed();});label.append(control);
 }else{
  const control=field.type==='select'?el('select'):el('input');
  if(field.type==='select'){
   for(const [value,title] of field.options){const option=el('option','',title);option.value=value;control.append(option);}
   control.value=data[field.key]||'WPA';
  }else{control.type='text';control.placeholder=field.placeholder||'';control.value=data[field.key]||'';}
  control.addEventListener('input',()=>{data[field.key]=control.value;changed();});label.append(control);
 }
 return label;
}
function syncTemplateUI() {
  for (const button of document.querySelectorAll('[data-template]')) {
    button.classList.toggle('selected', button.dataset.template===state.template);
  }
  const dynamic = state.format.id === 'qrcode' && state.template !== 'text';
  $('payloadInput').hidden = dynamic;
  $('customFields').hidden = !dynamic;
  if (!dynamic) return;
  const template = TEMPLATES[state.template];
  const fields = state.fields[state.template];
  const container = $('customFields');
  container.replaceChildren(...template.fields.map(field=>addField(field,fields)));
  const details = el('details','payload-details');
  details.append(el('summary','', 'View encoded payload'));
  const pre = el('pre','', 'Fill in the fields to view encoded data.');
  details.append(pre);
  container.append(details);
  const updatePreview = () => { if (!hasInput()) { pre.textContent = 'Fill in the fields to view encoded data.'; return; } try { pre.textContent = currentPayload(); } catch (error) {pre.textContent = error.message;} };
  container.addEventListener('input',updatePreview);
  updatePreview();
}
function chooseTemplate(template) {
  if (state.format.id !== 'qrcode' || !TEMPLATES[template]) return;
  if (state.template === 'text') state.values.qrcode = $('payloadInput').value;
  state.template=template;
  if (template === 'text') $('payloadInput').value=state.values.qrcode || 'https://example.com';
  syncTemplateUI(); changed();
}

function syncColor(which) {
  const hex = state.settings[which];
  $(`${which}Color`).value = hex.toLowerCase();
  $(`${which}Hex`).value = hex;
}
function setColor(which,value) {
  const hex = normalizeHex(value);
  if (!hex) { syncColor(which); toast('Enter a valid hexadecimal color (#RRGGBB).' ,'error'); return; }
  state.settings[which]=hex;
  syncColor(which);
  changed();
}
function syncOpacity(which) {
  const value = state.settings[`${which}Opacity`];
  $(`${which}Opacity`).value = String(value);
  $(`${which}OpacityOutput`).textContent = `${value}%`;
}
function resetAll() {
  state.settings={...DEFAULTS};state.variations={};state.autoVariations={};state.detectedVariations={};state.variationScanned={}; state.template='text';state.values={qrcode:'https://example.com'};state.fields=structuredClone(SAMPLE_FIELDS);state.captions=structuredClone(CAPTION_DEFAULTS);state.logoSource=null;state.logoToken++;
  for(const prop of ['foreground','background']) {
    syncColor(prop);
    syncOpacity(prop);
  }
  $('sizeSelect').value = String(DEFAULTS.size);
  $('marginInput').value = String(DEFAULTS.margin);
  $('dotStyle').value = DEFAULTS.dotStyle;
  $('cornerStyle').value = DEFAULTS.cornerStyle;
  $('errorCorrection').value = DEFAULTS.correction;
  $('humanReadable').checked=DEFAULTS.showText;
  $('barHeight').value=String(DEFAULTS.barHeight);
  $('barHeightOutput').textContent=`${DEFAULTS.barHeight} mm`;
  $('logoSize').value=String(DEFAULTS.logoSize);
  $('logoSizeOutput').textContent=`${DEFAULTS.logoSize}%`;
  $('logoControls').hidden=true;
  $('uploadTitle').textContent='Click or drop your logo';
  $('logoUpload').value='';
  $('logoBlackWhite').checked=false;$('logoThresholdWrap').hidden=true;
  $('logoThreshold').value='145';$('logoThresholdOutput').textContent='145';
  $('logoMaxDimension').value='384';$('logoPadding').value='3';$('logoPaddingOutput').textContent='3 px';
  selectFormat('qrcode');
  $('payloadInput').value='https://example.com';
  state.values.qrcode=$('payloadInput').value;
  syncTemplateUI(); changed();
  toast('Settings reset.');
}

function openCatalog() {
  state.lastFocused=document.activeElement;
  $('catalogModal').hidden=false;
  document.body.classList.add('modal-open');
  $('catalogSearchInput').value=''; state.catalogCategory='all';
  renderCatalog();
  requestAnimationFrame(()=>$('catalogSearchInput').focus());
}
function closeCatalog() {
  if ($('catalogModal').hidden) return;
  $('catalogModal').hidden=true;
  document.body.classList.remove('modal-open');
  if (state.lastFocused?.isConnected) state.lastFocused.focus();
}
function renderCatalog() {
  const filters = $('catalogFilters');
  filters.replaceChildren(...CATEGORIES.map(category => {
    const btn = el('button',`filter-chip ${state.catalogCategory===category.id?'selected':''}`,category.label);
    btn.type='button'; btn.setAttribute('aria-pressed',String(state.catalogCategory===category.id));
    btn.addEventListener('click',()=>{state.catalogCategory=category.id;renderCatalog();});
    return btn;
  }));
  const results = searchFormats($('catalogSearchInput').value,state.catalogCategory);
  $('catalogResultCount').textContent=`${results.length} ${results.length === 1 ? 'format' : 'formats'} found`;
  const list = $('catalogResults');
  if (!results.length) {list.replaceChildren(el('p','no-results','No formats found. Try a different search.'));return;}
  unobserveThumbnails(list);
  list.replaceChildren(...results.map(format => {
    const btn=el('button',`catalog-item ${format.id===state.format.id?'current':''}`);
    btn.type='button';
    const thumb=el('span','code-thumb catalog-thumb is-loading');
    const body=el('span','catalog-item-body');
    body.append(el('strong','',format.name),el('small','',format.hint),el('span','thumb-sample'));
    const action=el('span','catalog-item-action'); action.innerHTML=`<i data-lucide="${format.id===state.format.id?'check':'arrow-up-right'}"></i>`;
    btn.append(thumb,body,action);
    observeThumbnail(thumb,format);
    btn.addEventListener('click',()=>selectFormat(format.id));
    return btn;
  }));
  icons();
}

async function processLogo() {
 const token=++state.logoToken;
 if(!state.logoSource)return;
 const file=state.logoSource;
 let image=null,objectUrl=null,bitmap=null;
 try {
  if('createImageBitmap' in window){try{bitmap=await createImageBitmap(file);}catch{}}
  if(!bitmap) {
   objectUrl=URL.createObjectURL(file);
   image=new Image();image.src=objectUrl;
   await Promise.race([image.decode(),new Promise((_,reject)=>setTimeout(()=>reject(new Error('Image decoding timed out.')),8000))]);
  }
  if(token!==state.logoToken)return;
  const source=bitmap||image,limit=Number(state.settings.logoMaxDimension)||384;
  const ratio=Math.min(1,limit/Math.max(source.width,source.height));
  const width=Math.max(1,Math.round(source.width*ratio)),height=Math.max(1,Math.round(source.height*ratio));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)throw Error('Image editing is unsupported in this browser.');
  ctx.drawImage(source,0,0,width,height);
  if(state.settings.logoBlackWhite) {
   const frame=ctx.getImageData(0,0,width,height),threshold=Number(state.settings.logoThreshold);
   for(let i=0;i<frame.data.length;i+=4){
    const brightness=frame.data[i]*.299+frame.data[i+1]*.587+frame.data[i+2]*.114;
    const mono=brightness>=threshold?255:0;
    frame.data[i]=frame.data[i+1]=frame.data[i+2]=mono;
   }
   ctx.putImageData(frame,0,0);
  }
  if(token!==state.logoToken)return;
  state.settings.logo=canvas.toDataURL('image/png');
  $('logoControls').hidden=false;changed();
 }finally{bitmap?.close?.();if(objectUrl)URL.revokeObjectURL(objectUrl);}
}
async function readLogo(file) {
 if(!file)return;
 if(!/^image\/(png|jpeg|webp|gif|bmp)$/i.test(file.type)){toast('Choose PNG, JPG, WEBP, GIF or BMP.','error');return;}
 if(file.size>10*1024*1024){toast('The image must be 10 MB or smaller.','error');return;}
 state.logoSource=file;$('uploadTitle').textContent=file.name;
 try{await processLogo();toast('Logo ready. Use Edit Image to customize.');}
 catch(error){state.settings.logo=null;changed();toast(error.message||'Image processing failed.','error');}
}
async function saveSingle(kind) {
  const button = $(kind === 'png' ? 'downloadPng' : kind === 'svg' ? 'downloadSvg' : 'moreExport');
  button.disabled=true;
  try {
    const svg=await ensureResult();
    const format=safeFilename(state.format.id);
    const name=`aidc-${format}`;
    let blob, ext=kind;
    if (kind === 'svg') blob=svgBlob(svg);
    else {
      const mime = kind === 'jpeg' ? 'image/jpeg' : kind === 'webp' ? 'image/webp' : 'image/png';
      blob=await svgToRaster(svg,mime,state.settings.size,state.settings.background);
      if (blob.type !== mime) {ext='png';toast('Browser does not support that format. Downloading PNG instead.','error');}
    }
    triggerDownload(blob,`${name}.${ext === 'jpeg'?'jpg':ext}`);
    toast(`${ext.toUpperCase()} file ready.`);
  } catch (error) {toast(error.message,'error');}
  finally {button.disabled=false;$('exportMenu').hidden=true;$('moreExport').setAttribute('aria-expanded','false');}
}
async function copyImage() {
  const btn=$('copyImage');btn.disabled=true;
  try {
    if (!window.ClipboardItem || !navigator.clipboard?.write) throw new Error('Copy image requires HTTPS or localhost and a compatible browser.');
    const svg=await ensureResult();
    const blob=await svgToRaster(svg,'image/png',state.settings.size,state.settings.background);
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    toast('Image copied to clipboard.');
  } catch(error){toast(error.message,'error');}
  finally {btn.disabled=false;}
}
async function copyPayload() {
  try {const payload=currentPayload();if(!payload) throw new Error('There is nothing to copy.');
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard access requires HTTPS or localhost.');
    await navigator.clipboard.writeText(payload);toast('Content copied.');
  } catch(error) {toast(error.message,'error');}
}
async function downloadBatch() {
  if(state.batchRunning) return;
  try {await ensureEngine('zip');} catch (error) {toast(error.message,'error');return;}
  const lines=$('batchInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length){toast('Enter at least one line to generate a batch.','error');return;}
  if(lines.length>60){toast('Batch generation is limited to 60 entries.','error');return;}
  const button=$('downloadBatch'), progress=$('batchProgress');
  state.batchRunning=true;button.disabled=true;
  const format={...state.format}, settings=snapshotSettings();
  const zip=new JSZip();
  let succeeded=0;
  const errors=[];
  try {
    for(let i=0;i<lines.length;i++){
      progress.textContent=`Processing ${i+1} of ${lines.length} codes…`;
      try {
        const svg=await renderCode(format,lines[i],settings);
        const blob=await svgToRaster(svg,'image/png',settings.size,settings.background);
        zip.file(`${format.id}-${String(i+1).padStart(3,'0')}.png`,blob);
        succeeded++;
      } catch(error){errors.push(`Line ${i+1}: ${error?.message || 'Unknown error'}`);}
      if(i%3===0) await nextFrame();
    }
    if(!succeeded) throw new Error('No entries could be encoded. Check the input format.');
    if(errors.length) zip.file('errors.txt',errors.join('\n'));
    progress.textContent='Compressing files…';await nextFrame();
    const archive=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});
    triggerDownload(archive,`aidc-${safeFilename(format.id)}-batch.zip`);
    progress.textContent=`${succeeded} code(s) exported${errors.length?` · ${errors.length} error(s) saved inside the ZIP`:''}.`;
    toast(`Exported ${succeeded} codes.`);
  }catch(error){progress.textContent='Could not complete batch export.';toast(error.message,'error');}
  finally {state.batchRunning=false;button.disabled=false;}
}

function attachEvents() {
  $('variationAuto').addEventListener('change',event=>{
    const format=state.format,spec=variationSpec(format.id);
    state.autoVariations[format.id]=event.target.checked;
    if(!event.target.checked && spec){
      const detected=state.detectedVariations[format.id];
      const saved=state.variations[format.id];
      state.variations[format.id]=spec.options.some(item=>item.value===detected)?detected
        :spec.options.some(item=>item.value===saved)?saved:spec.options[0].value;
    }
    updateVariationDisplay(format);
    changed();
  });
  $('variationSelect').addEventListener('change',event=>{
    if(state.autoVariations[state.format.id]!==false || !event.target.value)return;
    state.variations[state.format.id]=event.target.value;
    changed();
  });
  const payloadChanged=()=>{
    state.values[state.format.id]=$('payloadInput').value;
    changed();
  };
  // input fires on every key repeat; change additionally handles autofill/commit.
  $('payloadInput').addEventListener('input',payloadChanged);
  $('payloadInput').addEventListener('change',payloadChanged);
  for(const btn of document.querySelectorAll('[data-template]')) btn.addEventListener('click',()=>chooseTemplate(btn.dataset.template));
  for(const prop of ['foreground','background']) {
    $(`${prop}Color`).addEventListener('input',e=>setColor(prop,e.target.value));
    $(`${prop}Hex`).addEventListener('change',e=>setColor(prop,e.target.value));
    $(`${prop}Hex`).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur();}});
    $(`${prop}Opacity`).addEventListener('input',e=>{
      state.settings[`${prop}Opacity`] = Number(e.target.value);
      syncOpacity(prop);
      changed();
    });
  }
  $('swapColors').addEventListener('click',()=>{
    const {foreground,background,foregroundOpacity,backgroundOpacity}=state.settings;
    Object.assign(state.settings,{foreground:background,background:foreground,foregroundOpacity:backgroundOpacity,backgroundOpacity:foregroundOpacity});
    for (const side of ['foreground','background']) {syncColor(side);syncOpacity(side);}
    changed();
  });
  for(const [id,key,parse] of [['sizeSelect','size',Number],['marginInput','margin',Number],['dotStyle','dotStyle',String],['cornerStyle','cornerStyle',String],['errorCorrection','correction',String]])
    $(id).addEventListener('change',e=>{state.settings[key]=parse(e.target.value);changed();});
  $('humanReadable').addEventListener('change',e=>{state.settings.showText=e.target.checked;changed();});
  for(const [id,key,output,suffix] of [['barHeight','barHeight','barHeightOutput',' mm'],['logoSize','logoSize','logoSizeOutput','%']])
    $(id).addEventListener('input',e=>{state.settings[key]=Number(e.target.value);$(output).textContent=e.target.value+suffix;changed();});
  $('resetButton').addEventListener('click',resetAll);
  $('chooseLogo').addEventListener('click',()=>$('logoUpload').click());
  $('uploadArea').addEventListener('click',e=>{if(!e.target.closest('button')) $('logoUpload').click();});
  $('logoUpload').addEventListener('change',e=>readLogo(e.target.files[0]));
  const upload=$('uploadArea');
  for (const event of ['dragenter','dragover']) upload.addEventListener(event,e=>{e.preventDefault();upload.classList.add('drag-over');});
  for (const event of ['dragleave','drop']) upload.addEventListener(event,e=>{e.preventDefault();upload.classList.remove('drag-over');});
  upload.addEventListener('drop',e=>readLogo(e.dataTransfer?.files?.[0]));
  $('removeLogo').addEventListener('click',()=>{state.logoSource=null;state.logoToken++;state.settings.logo=null;$('logoUpload').value='';$('logoControls').hidden=true;$('uploadTitle').textContent='Click or drop your logo';changed();});
  $('logoBlackWhite').addEventListener('change',e=>{
    state.settings.logoBlackWhite=e.target.checked;$('logoThresholdWrap').hidden=!e.target.checked;
    void processLogo().catch(error=>toast(error.message,'error'));
  });
  $('logoThreshold').addEventListener('input',e=>{
    state.settings.logoThreshold=Number(e.target.value);$('logoThresholdOutput').textContent=e.target.value;
    void processLogo().catch(error=>toast(error.message,'error'));
  });
  $('logoMaxDimension').addEventListener('change',e=>{
    state.settings.logoMaxDimension=Number(e.target.value);
    void processLogo().catch(error=>toast(error.message,'error'));
  });
  $('logoPadding').addEventListener('input',e=>{
    state.settings.logoPadding=Number(e.target.value);$('logoPaddingOutput').textContent=e.target.value+' px';changed();
  });
  for(const id of ['openCatalog','openCatalogSide']) $(id).addEventListener('click',openCatalog);
  for(const id of ['closeCatalog','modalCancel']) $(id).addEventListener('click',closeCatalog);
  $('catalogModal').addEventListener('mousedown',e=>{if(e.target===$('catalogModal'))closeCatalog();});
  $('catalogSearchInput').addEventListener('input',debounce(renderCatalog,110));
  $('goBatchSide').addEventListener('click',()=>{openBatch();$('batchPanel').scrollIntoView({behavior:'smooth',block:'center'});});
  $('toggleBatch').addEventListener('click',()=>{$('batchBody').hidden ? openBatch() : closeBatch();});
  $('downloadPng').addEventListener('click',()=>saveSingle('png'));
  $('downloadSvg').addEventListener('click',()=>saveSingle('svg'));
  $('moreExport').addEventListener('click',()=>{const menu=$('exportMenu');menu.hidden=!menu.hidden;$('moreExport').setAttribute('aria-expanded',String(!menu.hidden));});
  for(const button of document.querySelectorAll('[data-export]')) button.addEventListener('click',()=>saveSingle(button.dataset.export));
  document.addEventListener('click',e=>{if(!e.target.closest('.export-more-wrap')){$('exportMenu').hidden=true;$('moreExport').setAttribute('aria-expanded','false');}});
  $('copyImage').addEventListener('click',copyImage); $('copyText').addEventListener('click',copyPayload);
  $('downloadBatch').addEventListener('click',downloadBatch);
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){$('exportMenu').hidden=true;closeCatalog();}
    if((e.ctrlKey || e.metaKey) && e.key==='Enter'){e.preventDefault();renderNow();}
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='s'){e.preventDefault();saveSingle('png');}
    if(e.key==='/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName) && $('catalogModal').hidden){e.preventDefault();openCatalog();}
    if(!$('catalogModal').hidden && e.key==='Tab') {
      const items=[...$('catalogModal').querySelectorAll('button:not(:disabled), input:not(:disabled)')].filter(x=>x.getClientRects().length);
      if(!items.length)return;
      const first=items[0],last=items.at(-1);
      if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  window.addEventListener('beforeunload',()=>{if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);});
}
function openBatch() { $('batchBody').hidden=false; $('toggleBatch').innerHTML='Close <i data-lucide="chevron-up"></i>';icons(); }
function closeBatch() { $('batchBody').hidden=true;$('toggleBatch').innerHTML='Batch mode <i data-lucide="arrow-up-right"></i>';icons(); }

function init() {
  $('totalFormatCount').textContent = `${FORMATS.length}+`;
  $('formatCountLabel').textContent=String(FORMATS.length);
  attachEvents();
  for (const side of ['foreground','background']) syncOpacity(side);
  $('payloadInput').value=state.values.qrcode;
  if ('ResizeObserver' in window) {
    const onResize = debounce(() => {
      if (state.svg && state.lastRevision === state.revision) {
        void paintPreview(state.svg, state.revision).catch(error => setError(error.message));
      }
    }, 90);
    new ResizeObserver(onResize).observe($('previewArtboard'));
  }
  selectFormat('qrcode');
  icons();
  if ('requestIdleCallback' in window) requestIdleCallback(warmupEngines, {timeout: 1800});
  else setTimeout(warmupEngines, 300);
}
init();
