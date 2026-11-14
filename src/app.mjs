import { CATEGORIES, FORMATS, QUICK_IDS, SIDEBAR_IDS, lookupFormat, searchFormats } from './catalog.mjs';
import { TEMPLATES, buildTemplate } from './payloads.mjs';
import { renderCode, svgBlob, svgToRaster } from './renderer.mjs';
import { normalizeHex, contrastRatio, safeFilename, triggerDownload, nextFrame, debounce } from './utils.mjs';

const $ = id => document.getElementById(id);
const DEFAULTS = Object.freeze({foreground:'#171A21', background:'#FFFFFF', size:512, margin:16, dotStyle:'rounded', cornerStyle:'extra-rounded', correction:'H', barHeight:18, showText:true, logo:null, logoSize:22});
const state = {
  format: lookupFormat('qrcode'), template:'text', settings:{...DEFAULTS},
  values: {qrcode:'https://exemplo.com.br'}, fields: {
    wifi:{ssid:'Minha rede',password:'12345678',encryption:'WPA',hidden:false},
    contact:{name:'Maria Silva', phone:'+55 11 99999-9999',email:'maria@exemplo.com',organization:'',website:''},
    email:{to:'contato@exemplo.com',subject:'Olá',body:''},
    pix:{key:'', name:'', city:'', amount:'', description:''},
  },
  svg:null, lastPayload:'', lastRevision:-1, revision:0, previewUrl:null,
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
function snapshotSettings() { return {...state.settings}; }
function currentPayload() {
  return state.format.id === 'qrcode' && state.template !== 'text'
    ? buildTemplate(state.template,state.fields[state.template])
    : $('payloadInput').value;
}
function refreshCount() {
  try { const count = [...currentPayload()].length; $('charCount').textContent = `${count.toLocaleString('pt-BR')} caracteres`; }
  catch { $('charCount').textContent = 'Campos incompletos'; }
}
function syncContrast() {
  const ratio = contrastRatio(state.settings.foreground, state.settings.background);
  const note = $('downloadNote');
  const badge = $('readyBadge');
  if (ratio < 3) {
    note.textContent = 'Atenção: pouco contraste entre as cores pode impedir a leitura por scanners.';
    note.classList.add('warning-text');
    if (state.svg) {badge.classList.add('warning'); badge.innerHTML = '<i data-lucide="alert-circle"></i> Baixo contraste'; icons();}
  } else {
    note.textContent = 'PNG, JPG, WEBP ou SVG. O SVG mantém a nitidez em qualquer tamanho.';
    note.classList.remove('warning-text');
    if (state.svg) {badge.classList.remove('warning'); badge.innerHTML = '<span class="status-dot"></span> Pronto';}
  }
}
function setBusy() {
  $('previewLoading').hidden = false;
  $('previewError').hidden = true;
  $('readyBadge').innerHTML = '<span class="status-dot pending-dot"></span> Gerando';
  $('readyBadge').classList.remove('warning');
}
function setError(message) {
  $('previewLoading').hidden = true;
  $('previewImage').hidden = true;
  $('previewError').hidden = false;
  $('previewErrorText').textContent = message;
  $('readyBadge').innerHTML = '<i data-lucide="alert-circle"></i> Verifique os dados';
  $('readyBadge').classList.add('warning');
  icons();
}

async function renderNow() {
  const revision = state.revision;
  const format = state.format;
  const settings = snapshotSettings();
  let payload;
  setBusy();
  try {
    payload = currentPayload();
    const svg = await renderCode(format,payload,settings);
    if (revision !== state.revision) return null;
    state.svg = svg;
    state.lastRevision = revision;
    state.lastPayload = payload;
    const url = URL.createObjectURL(svgBlob(svg));
    const oldUrl = state.previewUrl;
    const image = $('previewImage');
    image.onload = () => { if (oldUrl) URL.revokeObjectURL(oldUrl); };
    image.onerror = () => { if (revision === state.revision) setError('Não foi possível carregar a prévia SVG.'); };
    state.previewUrl = url;
    image.src = url;
    image.hidden = false;
    $('previewLoading').hidden = true;
    $('previewError').hidden = true;
    syncContrast();
    return svg;
  } catch (error) {
    if (revision !== state.revision) return null;
    state.svg = null;
    state.lastRevision = revision;
    setError(error?.message || 'Não foi possível gerar este formato.');
    return null;
  }
}
const scheduleRender = debounce(() => renderNow(), 190);
function changed() {
  state.revision++;
  refreshCount();
  scheduleRender();
}
async function ensureResult() {
  scheduleRender.cancel();
  if (state.svg && state.lastRevision === state.revision) return state.svg;
  const svg = await renderNow();
  if (!svg) throw new Error('Corrija o conteúdo antes de exportar.');
  return svg;
}

function formatIcon(kind) {
  return kind === 'matrix' ? 'qr-code' : kind === 'postal' ? 'mail' : kind === 'stacked' ? 'layers-3' : 'barcode';
}
function quickButton(format) {
  const btn = el('button',`quick-type ${state.format.id === format.id ? 'is-active' : ''}`);
  btn.type='button'; btn.dataset.formatId = format.id;
  const icon = el('span','quick-icon');icon.innerHTML = `<i data-lucide="${formatIcon(format.kind)}"></i>`;
  btn.append(icon,el('span','quick-label',format.name));
  btn.addEventListener('click',()=>selectFormat(format.id));
  return btn;
}
function renderQuickTypes() {
  $('quickTypes').replaceChildren(...QUICK_IDS.map(id=>quickButton(lookupFormat(id))));
  $('sideFormats').replaceChildren(...SIDEBAR_IDS.map(id=> {
    const f = lookupFormat(id);
    const btn = el('button',`side-format ${state.format.id === id ? 'is-active' : ''}`);
    btn.type = 'button'; btn.dataset.formatId = id;
    btn.innerHTML = `<i data-lucide="${formatIcon(f.kind)}"></i><span></span><i data-lucide="arrow-up-right" class="side-format-arrow"></i>`;
    btn.querySelector('span').textContent = f.name;
    btn.addEventListener('click',()=>selectFormat(id));
    return btn;
  }));
  icons();
}
function selectFormat(id) {
  const next = lookupFormat(id);
  if (state.format.id !== next.id) {
    if (state.template === 'text' || state.format.id !== 'qrcode') state.values[state.format.id] = $('payloadInput').value;
    state.format = next;
    $('payloadInput').value = state.values[next.id] ?? next.example;
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
  $('currentFormatHint').textContent = 'Vetor em alta qualidade';
  syncTemplateUI();
  renderQuickTypes();
  closeCatalog();
  changed();
}

function addField(field, data) {
  const label = el('label','dynamic-field');
  if (field.type === 'checkbox') {
    const check = el('input');check.type='checkbox';check.checked = Boolean(data[field.key]);
    check.addEventListener('change',()=>{data[field.key]=check.checked;changed();});
    label.append(check,el('span','',field.label));
  } else {
    label.append(el('span','dynamic-label',field.label));
    const control = field.type === 'select' ? el('select') : el('input');
    if (field.type === 'select') {
      for (const [value,title] of field.options) {
        const opt = el('option','',title);opt.value=value;control.append(opt);
      }
      control.value = data[field.key] || 'WPA';
    } else { control.type = 'text'; control.placeholder=field.placeholder || ''; control.value=data[field.key] || ''; }
    control.addEventListener('input',()=>{data[field.key]=control.value;changed();});
    label.append(control);
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
  details.append(el('summary','', 'Ver dados codificados'));
  const pre = el('pre','', 'Os dados aparecerão após preencher os campos.');
  details.append(pre);
  container.append(details);
  const updatePreview = () => { try { pre.textContent = currentPayload(); } catch (error) {pre.textContent = error.message;} };
  container.addEventListener('input',updatePreview,{once:true});
  updatePreview();
}
function chooseTemplate(template) {
  if (state.format.id !== 'qrcode' || !TEMPLATES[template]) return;
  if (state.template === 'text') state.values.qrcode = $('payloadInput').value;
  state.template=template;
  if (template === 'text') $('payloadInput').value=state.values.qrcode || 'https://exemplo.com.br';
  syncTemplateUI(); changed();
}

function syncColor(which) {
  const hex = state.settings[which];
  $(`${which}Color`).value = hex.toLowerCase();
  $(`${which}Hex`).value = hex;
}
function setColor(which,value) {
  const hex = normalizeHex(value);
  if (!hex) { syncColor(which); toast('Informe uma cor hexadecimal válida (#RRGGBB).','error'); return; }
  state.settings[which]=hex;
  syncColor(which);
  changed();
}
function resetAll() {
  state.settings={...DEFAULTS}; state.template='text';
  for(const prop of ['foreground','background']) syncColor(prop);
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
  $('uploadTitle').textContent='Clique ou arraste sua logo';
  $('logoUpload').value='';
  selectFormat('qrcode');
  $('payloadInput').value='https://exemplo.com.br';
  state.values.qrcode=$('payloadInput').value;
  syncTemplateUI(); changed();
  toast('Configurações restauradas.');
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
  $('catalogResultCount').textContent=`${results.length} ${results.length === 1 ? 'formato encontrado' : 'formatos encontrados'}`;
  const list = $('catalogResults');
  if (!results.length) {list.replaceChildren(el('p','no-results','Nenhum formato encontrado. Tente outro termo.'));return;}
  list.replaceChildren(...results.map(format => {
    const btn=el('button',`catalog-item ${format.id===state.format.id?'current':''}`);
    btn.type='button';
    const icon=el('span','catalog-item-icon'); icon.innerHTML=`<i data-lucide="${formatIcon(format.kind)}"></i>`;
    const body=el('span','catalog-item-body');
    body.append(el('strong','',format.name),el('small','',format.hint));
    const action=el('span','catalog-item-action'); action.innerHTML=`<i data-lucide="${format.id===state.format.id?'check':'arrow-up-right'}"></i>`;
    btn.append(icon,body,action);
    btn.addEventListener('click',()=>selectFormat(format.id));
    return btn;
  }));
  icons();
}

async function readLogo(file) {
  if (!file) return;
  if (!['image/png','image/jpeg','image/webp'].includes(file.type)) { toast('Use PNG, JPG ou WEBP para a imagem central.','error'); return; }
  if (file.size > 2 * 1024 * 1024) {toast('A imagem precisa ter no máximo 2 MB.','error');return;}
  try {
    const dataURL = await new Promise((resolve,reject) => {
      const reader = new FileReader(); reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Falha ao ler imagem.'));reader.readAsDataURL(file);
    });
    state.settings.logo=dataURL;
    $('logoControls').hidden=false;
    $('uploadTitle').textContent=file.name;
    changed();
    toast('Imagem central adicionada. Teste a leitura com um celular.');
  } catch(error) {toast(error.message,'error');}
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
      if (blob.type !== mime) {ext='png';toast('Formato não suportado pelo navegador; exportando em PNG.','error');}
    }
    triggerDownload(blob,`${name}.${ext === 'jpeg'?'jpg':ext}`);
    toast(`Arquivo ${ext.toUpperCase()} preparado.`);
  } catch (error) {toast(error.message,'error');}
  finally {button.disabled=false;$('exportMenu').hidden=true;$('moreExport').setAttribute('aria-expanded','false');}
}
async function copyImage() {
  const btn=$('copyImage');btn.disabled=true;
  try {
    if (!window.ClipboardItem || !navigator.clipboard?.write) throw new Error('Copiar imagem exige HTTPS ou localhost em um navegador compatível.');
    const svg=await ensureResult();
    const blob=await svgToRaster(svg,'image/png',state.settings.size,state.settings.background);
    await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
    toast('Imagem copiada para a área de transferência.');
  } catch(error){toast(error.message,'error');}
  finally {btn.disabled=false;}
}
async function copyPayload() {
  try {const payload=currentPayload();if(!payload) throw new Error('Não há conteúdo para copiar.');
    if (!navigator.clipboard?.writeText) throw new Error('A cópia requer HTTPS ou localhost.');
    await navigator.clipboard.writeText(payload);toast('Conteúdo copiado.');
  } catch(error) {toast(error.message,'error');}
}
async function downloadBatch() {
  if(state.batchRunning) return;
  if (!window.JSZip) {toast('Biblioteca ZIP não carregada. Verifique sua conexão.','error');return;}
  const lines=$('batchInput').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(!lines.length){toast('Insira pelo menos uma linha para gerar o lote.','error');return;}
  if(lines.length>60){toast('O limite por lote é de 60 códigos.','error');return;}
  const button=$('downloadBatch'), progress=$('batchProgress');
  state.batchRunning=true;button.disabled=true;
  const format={...state.format}, settings=snapshotSettings();
  const zip=new JSZip();
  let succeeded=0;
  const errors=[];
  try {
    for(let i=0;i<lines.length;i++){
      progress.textContent=`Processando ${i+1} de ${lines.length} códigos...`;
      try {
        const svg=await renderCode(format,lines[i],settings);
        const blob=await svgToRaster(svg,'image/png',settings.size,settings.background);
        zip.file(`${format.id}-${String(i+1).padStart(3,'0')}.png`,blob);
        succeeded++;
      } catch(error){errors.push(`Linha ${i+1}: ${error?.message || 'Erro desconhecido'}`);}
      if(i%3===0) await nextFrame();
    }
    if(!succeeded) throw new Error('Nenhuma linha foi codificada. Verifique os conteúdos.');
    if(errors.length) zip.file('erros.txt',errors.join('\n'));
    progress.textContent='Compactando arquivos...';await nextFrame();
    const archive=await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:4}});
    triggerDownload(archive,`aidc-${safeFilename(format.id)}-lote.zip`);
    progress.textContent=`${succeeded} código(s) exportado(s)${errors.length?` · ${errors.length} erro(s) documentado(s) no ZIP`:''}.`;
    toast(`Lote de ${succeeded} códigos exportado.`);
  }catch(error){progress.textContent='Não foi possível concluir a exportação.';toast(error.message,'error');}
  finally {state.batchRunning=false;button.disabled=false;}
}

function attachEvents() {
  $('payloadInput').addEventListener('input',()=>{state.values[state.format.id]=$('payloadInput').value;changed();});
  for(const btn of document.querySelectorAll('[data-template]')) btn.addEventListener('click',()=>chooseTemplate(btn.dataset.template));
  for(const prop of ['foreground','background']) {
    $(`${prop}Color`).addEventListener('input',e=>setColor(prop,e.target.value));
    $(`${prop}Hex`).addEventListener('change',e=>setColor(prop,e.target.value));
    $(`${prop}Hex`).addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.target.blur();}});
  }
  $('swapColors').addEventListener('click',()=>{const {foreground,background}=state.settings;state.settings.foreground=background;state.settings.background=foreground;syncColor('foreground');syncColor('background');changed();});
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
  $('removeLogo').addEventListener('click',()=>{state.settings.logo=null;$('logoUpload').value='';$('logoControls').hidden=true;$('uploadTitle').textContent='Clique ou arraste sua logo';changed();});
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
function openBatch() { $('batchBody').hidden=false; $('toggleBatch').innerHTML='Fechar <i data-lucide="chevron-up"></i>';icons(); }
function closeBatch() { $('batchBody').hidden=true;$('toggleBatch').innerHTML='Modo lote <i data-lucide="arrow-up-right"></i>';icons(); }

function init() {
  $('totalFormatCount').textContent = `${FORMATS.length}+`;
  $('formatCountLabel').textContent=String(FORMATS.length);
  attachEvents();
  selectFormat('qrcode');
  icons();
}
init();