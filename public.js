import {calculate} from './finance.js';
import {applyContent} from './content.js';
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat('es-AR', {style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n);
const element = (tag, text) => {const e=document.createElement(tag);e.textContent=text;return e;};
async function load() {
  $('dataStatus').textContent='Consultando el fondo registrado…';
  try {
    const response=await fetch('/api/public', {cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok) throw Error();
    const s=await response.json(), c=calculate(s.goal,s.months,s.balance);
    applyContent(s);
    for(const [key,value] of Object.entries({goalLabel:money(s.goal),balance:money(s.balance),remaining:money(c.remaining),pct:c.percent.toFixed(2)+'%',deadlineChip:s.months+' meses · horizonte de planificación',perMonth:money(c.month),perWeek:money(c.week),perDay:money(c.day)})) $(key).textContent=value;
    $('progress').style.width=c.percent+'%';
    $('progress').parentElement.setAttribute('aria-valuenow',c.percent);
    $('servicesA').replaceChildren();$('servicesB').replaceChildren();$('scenarios').replaceChildren();
    s.products.forEach((p,i)=>{
      const card=element('div','');card.className='product';const body=element('div','');body.append(element('strong',p.name),element('br',''),element('small',p.price>0?'Precio desde '+money(p.price):'Consultar'));card.append(body);$(i%2?'servicesB':'servicesA').append(card);
      const row=element('tr','');[p.name,p.price>0?money(p.price):'Consultar',...[c.month,c.week,c.day].map(v=>p.price>0?String(Math.ceil(v/p.price)):'—')].forEach(t=>row.append(element('td',t)));$('scenarios').append(row);
    });
    if(!s.products.length) $('servicesA').textContent='Catálogo en preparación.';
    $('missionsList').replaceChildren();
    s.missions.forEach(m=>{const item=element('article','');item.className='product';item.append(element('strong',m.title),element('span',({pending:'Pendiente',doing:'En proceso',done:'Completada'})[m.status]),element('p',m.description));$('missionsList').append(item);});
    if(!s.missions.length) $('missionsList').textContent='Todavía no hay misiones públicas.';
    $('dataStatus').textContent='Fondo registrado actualizado. Los escenarios de venta son facturación bruta hipotética; no representan aportes al fondo.';
  } catch {
    for(const key of ['goalLabel','balance','remaining','pct','perMonth','perWeek','perDay']) $(key).textContent='No disponible';
    $('dataStatus').textContent='No se pudieron consultar los datos. Reintentá en unos minutos.';
  }
}
$('retryData').addEventListener('click',load);
load();
document.querySelector('.gallery').addEventListener('click',event=>{const button=event.target.closest('[data-slide]');if(!button)return;const images=[...document.querySelectorAll('.gallery img')];if(!images.length)return;const current=Math.max(0,images.findIndex(i=>i.classList.contains('active')));images[current].classList.remove('active');images[(current+Number(button.dataset.slide)+images.length)%images.length].classList.add('active');});
