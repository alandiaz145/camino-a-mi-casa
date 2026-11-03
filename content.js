const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const safeUrl=url=>{try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const originalIntro=document.querySelector('.hero>p')?.textContent;
const originals=new Map();
for(const selector of ['.socialIcons','.supportGrid','.workFrame','.gallery','article.story']){const e=document.querySelector(selector);if(e)originals.set(selector,[...e.childNodes].map(n=>n.cloneNode(true)));}
export function applyContent(s){
  for(const [selector,nodes]of originals){const e=document.querySelector(selector);e.replaceChildren(...nodes.map(n=>n.cloneNode(true)));}
  const c=s.content||{};
  const intro=document.querySelector('.hero>p');if(intro&&document.querySelector('#inicio'))intro.textContent=c.intro||originalIntro;
  const story=document.querySelector('article.story');if(story&&c.story){story.replaceChildren(...c.story.split(/\n\s*\n/).filter(Boolean).map(p=>node('p',p)));}
  const icons=document.querySelector('.socialIcons');if(icons)for(const [key,label]of [['instagram','IG'],['youtube','YT'],['soundcloud','SC'],['whatsapp','WA']]){const existing=[...icons.children].find(e=>e.textContent===label);if(existing&&safeUrl(c[key])){const link=node('a',label);link.href=c[key];link.title=key;existing.replaceWith(link);}}
  const support=document.querySelector('.supportGrid');if(support)for(const [i,key]of ['mercadopago','paypal','wise'].entries())if(safeUrl(c[key])){const old=support.children[i],link=node('a','');link.className='support';link.href=c[key];link.append(node('b',['Mercado Pago','PayPal','Wise'][i]),node('span','Aporte voluntario'));old.replaceWith(link);}
  const media=s.media||[],archive=media.filter(m=>m.kind==='archive'&&safeUrl(m.url)),gallery=media.filter(m=>m.kind==='gallery'&&safeUrl(m.url));
  const frame=document.querySelector('.workFrame');if(frame&&archive.length){frame.style.height='auto';frame.style.display='block';frame.replaceChildren(...archive.map(m=>{const figure=node('figure',''),img=node('img','');img.src=m.url;img.alt=m.title;img.loading='lazy';img.style.width='100%';img.style.borderRadius='12px';figure.append(img,node('figcaption',[m.title,m.year,m.category,m.description].filter(Boolean).join(' · ')));return figure;}));}
  const container=document.querySelector('.gallery');if(container&&gallery.length){container.querySelectorAll('img').forEach(e=>e.remove());for(const [i,m]of gallery.entries()){const img=node('img','');img.src=m.url;img.alt=[m.title,m.description].filter(Boolean).join(' · ');img.className=i===0?'active':'';img.loading='lazy';container.insertBefore(img,container.querySelector('.galleryNav'));}const note=container.previousElementSibling;if(note)note.textContent='Referencia narrativa. No implica disponibilidad ni precio vigente. Fotografías autorizadas.';}
  const fx=document.querySelector('#fxReference');if(fx)fx.textContent=c.fx_rate>0?`Referencia manual: 1 USD = ${new Intl.NumberFormat('es-AR').format(c.fx_rate)} ARS · Fuente: ${c.fx_source} · Fecha: ${c.fx_date}. Meta equivalente: USD ${new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(s.goal/c.fx_rate)}.`:'';
}
if(document.querySelector('article.story'))fetch('/api/public',{cache:'no-store',signal:AbortSignal.timeout(10000)}).then(r=>{if(!r.ok)throw Error();return r.json();}).then(applyContent).catch(()=>{/* Preserve the original story when the API is unavailable. */});
