
/** QR vector extras; all text is added using DOM text nodes, never innerHTML. */
const NS='http://www.w3.org/2000/svg';
const shape=(doc,tag,attrs={})=>{const n=doc.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));return n};
const documentFor=source=>{const doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('Invalid QR SVG.');return doc};
const coords=root=>{const a=root.getAttribute('viewBox')?.trim().split(/[\s,]+/).map(Number);return a?.length===4&&a.every(Number.isFinite)&&a[2]>0&&a[3]>0?a:[0,0,Number.parseFloat(root.getAttribute('width'))||512,Number.parseFloat(root.getAttribute('height'))||512]};
/** Draw a pre-rasterized PNG over the QR. Never use the third-party library's image loader. */
export function overlayQrLogo(source, settings) {
 if(!settings.logo)return source;
 if(!/^data:image\/png;base64,[a-z0-9+/=]+$/i.test(settings.logo))throw Error('Invalid logo data.');
 const doc=documentFor(source),root=doc.documentElement;
 const [x,y,w,h]=coords(root),fraction=Math.min(28,Math.max(8,Number(settings.logoSize)||20))/100;
 const side=Math.min(w,h)*fraction,pad=Math.max(0,Math.min(12,Number(settings.logoPadding)||0))*w/512;
 const left=x+(w-side)/2,top=y+(h-side)/2;
 const group=shape(doc,'g',{'data-logo':'center'});
 group.appendChild(shape(doc,'rect',{x:left-pad,y:top-pad,width:side+2*pad,height:side+2*pad,rx:pad,fill:settings.background||'#FFFFFF','fill-opacity':Math.min(1,Math.max(0,(settings.backgroundOpacity??100)/100))}));
 group.appendChild(shape(doc,'image',{x:left,y:top,width:side,height:side,href:settings.logo,preserveAspectRatio:'xMidYMid meet'}));
 root.appendChild(group);
 return new XMLSerializer().serializeToString(doc);
}
/** Preserve the square QR, then create a separate human-readable vector panel. */
export function appendQrCaption(source,items=[]) {
 const lines=items.filter(item=>item?.label&&String(item.value??'').trim()).slice(0,10);
 if(!lines.length)return source;
 const doc=documentFor(source),root=doc.documentElement,[x,y,w,h]=coords(root);
 const font=Math.max(9,Math.min(16,w/31)),gap=font*1.65,pad=w*.042;
 const captionH=pad*2+gap*(lines.length+1.4);
 root.setAttribute('viewBox',[x,y,w,h+captionH].join(' '));
 root.setAttribute('width',String(w));root.setAttribute('height',String(h+captionH));
 root.setAttribute('preserveAspectRatio','xMidYMid meet');
 const g=shape(doc,'g',{'data-caption':'human-readable'});
 g.appendChild(shape(doc,'rect',{x,y:y+h,width:w,height:captionH,fill:'#FFFFFF'}));
 g.appendChild(shape(doc,'path',{d:'M '+x+' '+(y+h)+' h '+w,stroke:'#D9D9D1','stroke-width':1}));
 const heading=shape(doc,'text',{x:x+pad,y:y+h+pad+font,'font-family':'Arial, sans-serif','font-weight':700,'font-size':font,fill:'#222'});
 heading.textContent='DETAILS';g.appendChild(heading);
 for(let i=0;i<lines.length;i++){
   const t=shape(doc,'text',{x:x+pad,y:y+h+pad+font+gap*(i+1.3),'font-family':'Arial, sans-serif','font-size':font,fill:'#222'});
   const key=shape(doc,'tspan',{'font-weight':700});key.textContent=String(lines[i].label).slice(0,32)+': ';
   const value=shape(doc,'tspan');const normalized=String(lines[i].value).replace(/\s+/g,' ').trim();
   value.textContent=normalized.length>63?normalized.slice(0,60)+'…':normalized;
   t.append(key,value);g.appendChild(t);
 }
 root.appendChild(g);
 return new XMLSerializer().serializeToString(doc);
}
