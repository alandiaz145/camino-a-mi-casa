import {validContent,validMedia} from './content.js';
// API V2: datos públicos sin costos; escritura solo con JWT validado de Cloudflare Access.
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers}});
const bad=(msg,status=400)=>json({error:msg},status);
const id=()=>crypto.randomUUID();
const integer=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const str=(v,max=240)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
const b64url=s=>{const t=s.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(t+'='.repeat((4-t.length%4)%4)),c=>c.charCodeAt(0))};
export async function verifyAccess(request,env){
  if(!env.CF_ACCESS_TEAM_DOMAIN||!env.CF_ACCESS_AUD||!env.ADMIN_EMAIL)throw Error('Auth not configured');
  const token=request.headers.get('cf-access-jwt-assertion');
  if(!token)throw Error('Access token required');
  const parts=token.split('.');if(parts.length!==3)throw Error('Invalid token');
  const header=JSON.parse(new TextDecoder().decode(b64url(parts[0])));
  const payload=JSON.parse(new TextDecoder().decode(b64url(parts[1])));
  const domain=env.CF_ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//,'').replace(/\/$/,'');
  if(header.alg!=='RS256'||!str(header.kid,200))throw Error('Unsupported token');
  if(payload.iss!=='https://'+domain||payload.aud!==env.CF_ACCESS_AUD&&!(Array.isArray(payload.aud)&&payload.aud.includes(env.CF_ACCESS_AUD)))throw Error('Invalid issuer/audience');
  const now=Math.floor(Date.now()/1000);
  if(!integer(payload.exp,now+1)||(payload.nbf!==undefined&&!integer(payload.nbf,0,now+60)))throw Error('Expired token');
  if((payload.email||'').toLowerCase()!==env.ADMIN_EMAIL.toLowerCase())throw Error('Unauthorized user');
  const response=await fetch('https://'+domain+'/cdn-cgi/access/certs');
  if(!response.ok)throw Error('Unable to fetch signing keys');
  const keys=(await response.json()).keys||[];
  const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA');
  if(!jwk)throw Error('Unknown signing key');
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,b64url(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1])))throw Error('Invalid signature');
  return payload.email;
}
export async function state(db,admin=false){
  const rows=await db.batch([
    db.prepare('SELECT key,value FROM settings'),
    db.prepare(admin?'SELECT id,name,price,cost,visible,sort_order FROM products ORDER BY sort_order,id':'SELECT id,name,price FROM products WHERE visible=1 ORDER BY sort_order,id'),
    db.prepare(admin?'SELECT id,kind,amount,concept,created_at FROM movements ORDER BY created_at DESC,id DESC LIMIT 500':'SELECT COALESCE(SUM(CASE WHEN kind=\'in\' THEN amount ELSE -amount END),0) AS balance FROM movements'),
    db.prepare(admin?'SELECT * FROM missions ORDER BY created_at DESC LIMIT 500':'SELECT id,title,description,category,status,priority,due_date FROM missions WHERE public=1 ORDER BY created_at DESC LIMIT 100'),
    db.prepare("SELECT COALESCE(SUM(CASE WHEN kind='in' THEN amount ELSE -amount END),0) AS balance FROM movements"),
    db.prepare('SELECT key,value FROM content'),
    db.prepare(admin?'SELECT * FROM media ORDER BY sort_order,id':'SELECT id,kind,title,description,year,category,url FROM media WHERE visible=1 ORDER BY sort_order,id')
  ]);
  const settings=Object.fromEntries(rows[0].results.map(x=>[x.key,Number(x.value)]));
  const balance=rows[4].results[0].balance;
  return {content:Object.fromEntries(rows[5].results.map(x=>[x.key,JSON.parse(x.value)])),media:rows[6].results,goal:settings.goal,months:settings.months,balance,products:rows[1].results,missions:rows[3].results,...(admin?{movements:rows[2].results}:{})};
}
async function parse(req){
  const limit=131072;
  if(+(req.headers.get('content-length')||0)>limit||!req.body)throw Error('Invalid body');
  const reader=req.body.getReader(),decoder=new TextDecoder();let size=0,text='';
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw Error('Body too large')}text+=decoder.decode(value,{stream:true});}}finally{reader.releaseLock()}
  return JSON.parse(text+decoder.decode());
}
export default {async fetch(request,env){
  const u=new URL(request.url),path=u.pathname;
  if(path==='/admin'||path.startsWith('/admin/')) {
    try {await verifyAccess(request,env)} catch {return bad('Access denied',403)}
    if(!env.ASSETS)return bad('Assets unavailable',503);
    const asset=await env.ASSETS.fetch(request);
    const response=new Response(asset.body,asset);
    response.headers.set('cache-control','no-store');
    response.headers.set('x-content-type-options','nosniff');
    response.headers.set('referrer-policy','same-origin');
    response.headers.set('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    return response;
  }
  // Explicit public allowlist prevents alternate static-asset paths bypassing admin checks.
  if(!path.startsWith('/api/')) {
    if(!['/','/index.html','/quien-soy','/quien-soy.html','/servicios','/servicios.html','/public.js','/finance.js','/content.js'].includes(path))return bad('Not found',404);
    return env.ASSETS ? env.ASSETS.fetch(request) : bad('Not found',404);
  }
  if(!env.DB)return bad('Database binding missing',503);
  if(path==='/api/public'&&request.method==='GET'){try{return json(await state(env.DB))}catch{return bad('Database unavailable',503)}}
  if(!path.startsWith('/api/admin/'))return bad('Not found',404);
  let actor;try{actor=await verifyAccess(request,env)}catch{return bad('Access denied',403)}
  if(request.method==='GET') {
    try {
      if(path==='/api/admin/state') return json(await state(env.DB,true));
      if(path==='/api/admin/backup') {
        const names=['settings','movements','products','missions','audit','content','media'];
        const rows=await env.DB.batch(names.map(name=>env.DB.prepare('SELECT * FROM '+name)));
        return json({version:1,exported_at:new Date().toISOString(),tables:Object.fromEntries(names.map((name,i)=>[name,rows[i].results]))});
      }
    } catch {return bad('Database unavailable',503)}
  }
  if(request.method!=='POST')return bad('Method not allowed',405);
  const origin=request.headers.get('origin');
  if(!env.FRONTEND_ORIGIN||origin!==env.FRONTEND_ORIGIN)return bad('Origin denied',403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return bad('JSON required',415);
  let d;try{d=await parse(request)}catch{return bad('Invalid JSON',400)}
  if(!d||typeof d!=='object'||Array.isArray(d))return bad('JSON object required');
  const db=env.DB;
  const statements=[];
  const record=(action,detail)=>statements.push(db.prepare('INSERT INTO audit(id,actor,action,detail) VALUES(?,?,?,?)').bind(id(),actor,action,JSON.stringify(detail)));
  try{
    if(path==='/api/admin/settings'){
      if(!integer(d.goal,1,10000000000000)||!integer(d.months,1,600))return bad('Invalid goal/months');
      statements.push(db.prepare("UPDATE settings SET value=? WHERE key='goal'").bind(String(d.goal)),db.prepare("UPDATE settings SET value=? WHERE key='months'").bind(String(d.months)));
      record('settings',{goal:d.goal,months:d.months});
    }else if(path==='/api/admin/movements'){
      if(!['in','out'].includes(d.kind)||!integer(d.amount,1,1000000000000)||!str(d.concept))return bad('Invalid movement');
      const key=id();statements.push(db.prepare('INSERT INTO movements(id,kind,amount,concept) VALUES(?,?,?,?)').bind(key,d.kind,d.amount,d.concept.trim()));
      record('movement_created',{id:key});
    }else if(path==='/api/admin/products'){
      if((d.id!==undefined&&!str(d.id,100))||(d.sort_order!==undefined&&!integer(d.sort_order,0,10000))||!str(d.name)||!integer(d.price,0,1000000000000)||!integer(d.cost,0,1000000000000)||typeof d.visible!=='boolean')return bad('Invalid product');
      const key=str(d.id,100)?d.id:id();
      statements.push(db.prepare('INSERT INTO products(id,name,price,cost,visible,sort_order) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,price=excluded.price,cost=excluded.cost,visible=excluded.visible,sort_order=excluded.sort_order').bind(key,d.name.trim(),d.price,d.cost,d.visible?1:0,integer(d.sort_order,0,10000)?d.sort_order:0));
      record('product_saved',{...d,id:key});
    }else if(path==='/api/admin/missions'){
      if((d.priority!==undefined&&!['low','normal','high'].includes(d.priority))||(d.id!==undefined&&!str(d.id,100))||(d.category!==undefined&&(typeof d.category!=='string'||d.category.length>100))||(d.due_date!=null&&d.due_date!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(d.due_date)||!Number.isFinite(Date.parse(d.due_date))||new Date(d.due_date).toISOString().slice(0,10)!==d.due_date))||!str(d.title)||!['pending','doing','done'].includes(d.status)||typeof d.public!=='boolean'||(d.description!==undefined&&(typeof d.description!=='string'||d.description.length>3000)))return bad('Invalid mission');
      const key=str(d.id,100)?d.id:id();
      statements.push(db.prepare('INSERT INTO missions(id,title,description,category,status,due_date,public,priority) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,description=excluded.description,category=excluded.category,status=excluded.status,due_date=excluded.due_date,public=excluded.public,priority=excluded.priority').bind(key,d.title.trim(),String(d.description||'').slice(0,3000),String(d.category||'General').slice(0,100),d.status,d.due_date||null,d.public?1:0,d.priority||'normal'));
      record('mission_saved',{...d,id:key});
    }else if(path==='/api/admin/content'){
      if(!validContent(d))return bad('Invalid content');
      for(const key of ['intro','story','fx_rate','fx_source','fx_date','instagram','youtube','soundcloud','whatsapp','mercadopago','paypal','wise'])statements.push(db.prepare('INSERT INTO content(key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind(key,JSON.stringify(d[key])));
      record('content_saved',d);
    }else if(path==='/api/admin/media'){
      if(!validMedia(d))return bad('Invalid media');
      const key=d.id||id();
      statements.push(db.prepare('INSERT INTO media(id,kind,title,description,year,category,url,visible,sort_order) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,title=excluded.title,description=excluded.description,year=excluded.year,category=excluded.category,url=excluded.url,visible=excluded.visible,sort_order=excluded.sort_order').bind(key,d.kind,d.title.trim(),d.description,d.year,d.category,d.url,d.visible?1:0,d.sort_order));
      record('media_saved',{...d,id:key});
    }else{return bad('Not found',404)}
    await db.batch(statements);
    return json({ok:true});
  }catch{return bad('Database write failed',500)}
}};
