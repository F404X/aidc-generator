/** Required BWIPP profiles and automatic rMQR sizing. */
export const RMQR_VERSIONS = Object.freeze([
  'R7x43','R7x59','R7x77','R7x99','R7x139',
  'R9x43','R9x59','R9x77','R9x99','R9x139',
  'R11x27','R11x43','R11x59','R11x77','R11x99','R11x139',
  'R13x27','R13x43','R13x59','R13x77','R13x99','R13x139',
  'R15x43','R15x59','R15x77','R15x99','R15x139',
  'R17x43','R17x59','R17x77','R17x99','R17x139',
].sort((a,b)=>{
  const area=v=>{const [,height,width]=/^R(\d+)x(\d+)$/.exec(v);return Number(height)*Number(width);};
  return area(a)-area(b);
}));
export const REQUIRED_OPTIONS=Object.freeze({
  rectangularmicroqrcode:Object.freeze({eclevel:'M'})
});
const INVALID_OPTION = /invalid|unknown|unsupported|not available|not implemented|unrecognized/i;
const CAPACITY_ERROR = /data|size|capacity|length|value/i;
export function encodeRmqr(toSVG, baseOptions) {
  let lastCapacityError;
  for(const version of RMQR_VERSIONS){
    try{return toSVG({...baseOptions,version,eclevel:'M'});}
    catch(error){
      const message=String(error?.message||error);
      if(INVALID_OPTION.test(message) && !CAPACITY_ERROR.test(message))throw error;
      lastCapacityError=error;
    }
  }
  throw new Error('Data does not fit in any supported rMQR size. '+String(lastCapacityError?.message||''));
}
