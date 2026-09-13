export const SAVE_KEY='quietGarden.v1';
export const THEMES=['day','sunset','night'];
export const OBJECTS=['plant','stone','lantern'];
export const FLOWERS=6;
export const MAX_ADDITIONS=12;
export function cleanSave(value){
  const v=value&&typeof value==='object'?value:{};
  return {theme:THEMES.includes(v.theme)?v.theme:'sunset',still:v.still===true,
    blooms:[...new Set(Array.isArray(v.blooms)?v.blooms.filter(n=>Number.isInteger(n)&&n>=0&&n<FLOWERS):[])],
    additions:(Array.isArray(v.additions)?v.additions:[]).filter(p=>p&&OBJECTS.includes(p.type)&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Math.hypot(p.x,p.z)<5.05).slice(0,MAX_ADDITIONS).map(p=>({type:p.type,x:p.x,z:p.z}))};
}
export function safeReturnPath(value,origin){try{const u=new URL(value,origin);return u.origin===origin&&u.pathname==='/'?u.pathname+u.search+u.hash:'/';}catch{return '/';}}
