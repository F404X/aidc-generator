/** Infer the discrete option used by an automatic BWIPP symbol.
 * Compare actual rendered dimensions with explicitly encoded candidates.
 * If no option matches, return null rather than displaying an invented value.
 */
const bounds=markup=>{
 const m=String(markup).match(/\bviewBox=["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)["']/i);
 return m?[Number(m[1]),Number(m[2])]:null;
};
export function inferBwipVariation(autoSvg,baseOptions,spec,toSVG,maxCandidates=32){
 if(!spec?.options?.length || typeof toSVG!=='function')return null;
 const target=bounds(autoSvg);
 if(!target)return null;
 for(const option of spec.options.slice(0,maxCandidates)){
  try{
   const candidate=toSVG({...baseOptions,[spec.option]:option.value});
   if(candidate===autoSvg)return option.value;
   const current=bounds(candidate);
   if(current&&current[0]===target[0]&&current[1]===target[1])return option.value;
  }catch{ /* This explicit size cannot hold the data. */ }
 }
 return null;
}
export function withDetectedVariation(svg,value){
 if(!value)return svg;
 const normalized=String(value);
 if(!/^[A-Za-z0-9-]{1,32}$/.test(normalized))return svg;
 return String(svg).replace(/<svg\b/i,`<svg data-a404dc-variation="${normalized}"`);
}
export function extractDetectedVariation(svg){
 const value=String(svg).match(/\bdata-a404dc-variation="([A-Za-z0-9-]{1,32})"/);
 return value?.[1]||null;
}
