export function normalizeHex(input) {
  const value = String(input || '').trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(value)) return value;
  if (/^[0-9A-F]{6}$/.test(value)) return `#${value}`;
  return null;
}
export function contrastRatio(a, b) {
  const luminance = hex => {
    const channels = [1, 3, 5].map(p => parseInt(hex.slice(p, p + 2), 16) / 255)
      .map(c => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  const [x,y] = [luminance(a),luminance(b)].sort((p,q)=>q-p);
  return (x+0.05)/(y+0.05);
}
export function safeFilename(str) {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'aidc-code';
}
export function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
}
export const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
export function debounce(fn, ms = 170) {
  let timer;
  const wrapped = (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  wrapped.cancel = () => clearTimeout(timer);
  return wrapped;
}
/** Trailing-edge debounce with a guaranteed interval during continuous typing.
 * Unlike a pure debounce, holding a key does not indefinitely postpone previews.
 */
export function debounceWithMaxWait(fn,delay=55,maxWait=170){
  let timer=null,firstCall=null,args=[];
  const fire=()=>{
    if(timer!==null)clearTimeout(timer);
    timer=null;firstCall=null;
    return fn(...args);
  };
  const scheduled=(...nextArgs)=>{
    args=nextArgs;
    const now=performance.now();
    if(firstCall===null)firstCall=now;
    if(now-firstCall>=maxWait){void fire();return;}
    if(timer!==null)clearTimeout(timer);
    timer=setTimeout(fire,delay);
  };
  scheduled.cancel=()=>{
    if(timer!==null)clearTimeout(timer);
    timer=null;firstCall=null;
  };
  return scheduled;
}
