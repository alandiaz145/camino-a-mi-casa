const text=(value,max)=>typeof value==='string'&&value.length<=max;
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
export function validContent(d){
  if(!text(d.intro,2000)||!text(d.story,20000)||!text(d.fx_source,240)||!text(d.fx_date,10)||!Number.isFinite(d.fx_rate)||d.fx_rate<0||d.fx_rate>1000000000)return false;
  if(d.fx_rate>0&&(!d.fx_source.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(d.fx_date)||!Number.isFinite(Date.parse(d.fx_date))||new Date(d.fx_date).toISOString().slice(0,10)!==d.fx_date))return false;
  for(const key of ['instagram','youtube','soundcloud','whatsapp','mercadopago','paypal','wise'])if(!text(d[key],2048)||(d[key]&&!https(d[key])))return false;
  return true;
}
export function validMedia(d){return ['archive','gallery'].includes(d.kind)&&text(d.title,240)&&d.title.trim()&&text(d.description,3000)&&text(d.category,100)&&https(d.url)&&d.url.length<=2048&&typeof d.visible==='boolean'&&d.rights_confirmed===true&&(d.year===null||Number.isInteger(d.year)&&d.year>=1900&&d.year<=2100)&&Number.isInteger(d.sort_order)&&d.sort_order>=0&&d.sort_order<=10000&&(d.id===undefined||text(d.id,100)&&d.id.trim());}
