import {TYPES,METHODS,totals} from './core.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('ru-RU',{minimumFractionDigits:n%100?2:0,maximumFractionDigits:2}).format(n/100);
const cash=e=>e.payments.filter(p=>p.method==='cash').reduce((s,p)=>s+p.amount,0);
const pay=e=>e.payments.map(p=>`${METHODS[p.method]}${e.payments.length>1?' '+money(p.amount):''}`).join(' / ');
const slice=(rows,page,size)=>rows.slice(page*size,(page+1)*size);
function table(headers,rows,slots,cls=''){return `<table class="${cls}"><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${Array.from({length:Math.max(slots,rows.length)},(_,i)=>`<tr>${(rows[i]||headers.map(()=>'' )).map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
const heading=title=>`<h2 class="print-heading">${title}</h2>`;
const dateLabel=date=>date.split('-').reverse().join('.');
function returnTable(title,rows,slots=4){return heading(title)+table(['№','Арт.','Наименование','Дата','Сумма','Оплата / шт.'],rows.map((e,i)=>[i+1,esc(e.article),`${esc(e.title)}${e.customer?'<small>'+esc(e.customer)+'</small>':''}`,dateLabel(e.date),money(e.amount),esc(pay(e))+'<small>'+e.qty+' шт.</small>']),slots,'return-table');}
/** Print operates on a snapshot of the chosen day, independently of active tab/search. */
export function buildNotebook({date,entries,day}){
 const es=entries.filter(e=>e.date===date).sort((a,b)=>a.time.localeCompare(b.time));const sales=es.filter(e=>['sale','package','other'].includes(e.type)),services=es.filter(e=>['service','straightening','disposal'].includes(e.type)),purchases=es.filter(e=>e.type==='purchase'),refunds=es.filter(e=>e.type==='refund'),market=es.filter(e=>e.type==='market'),expenses=es.filter(e=>['expense','salary','collection','bonus'].includes(e.type)),income=es.filter(e=>e.type==='income');const total=totals(es,day.opening);const pages=[];
 const header=(title,index)=>`<div class="print-page-head">${heading(title)}<span>Дата: <b>${dateLabel(date)}</b></span><span>В кассе на начало дня: <b>${money(day.opening)} ₽</b></span></div>${index?'<div class="print-continuation">Продолжение</div>':''}`;
 const nSales=Math.max(1,Math.ceil(sales.length/12),Math.ceil(refunds.length/4),Math.ceil(market.length/4));
 for(let page=0;page<nSales;page++){
  const part=slice(sales,page,12),sum=part.reduce((s,e)=>s+e.amount,0);
  pages.push(`<section class="print-sheet">${header('ПРОДАЖИ',page)}${table(['№','Шт.','Арт.','Наименование / клиент','М-р','Сумма','Оплата','Время'],part.map((e,i)=>[page*12+i+1,e.qty,esc(e.article),`${esc(e.title)}${e.customer||e.phone?'<small>'+esc([e.customer,e.phone].filter(Boolean).join(' · '))+'</small>':''}`,esc(e.manager),money(e.amount),esc(pay(e)),esc(e.time)]),12,'sales-table')}<div class="print-subtotal">Сумма на странице: <b>${money(sum)} ₽</b> · Продажи за день: <b>${money(total.sales)} ₽</b></div><div class="print-returns">${'<div>'+returnTable('Возвраты',slice(refunds,page,4))+'</div>'}${'<div>'+returnTable('Возвраты Я.Маркет',slice(market,page,4))+'</div>'}</div><footer>Территория шин · Тетрадь · ${dateLabel(date)} · Продажи ${page+1}/${nSales}</footer></section>`);
 }
 const nOps=Math.max(1,Math.ceil(purchases.length/15),Math.ceil(services.length/16),Math.ceil(expenses.length/9),Math.ceil(income.length/4));
 const sumCash=types=>es.filter(e=>types.includes(e.type)).reduce((s,e)=>s+cash(e),0);
 const cashRows=[['На начало',day.opening],['+ Продажи шин',sumCash(['sale'])],['+ Шиномонтаж / правка',sumCash(['service','straightening'])],['+ Пакеты / другие продажи',sumCash(['package','other'])],['+ Утилизация',sumCash(['disposal'])],['+ Внесения',sumCash(['income'])],['− Купили',sumCash(['purchase'])],['− Зарплата',sumCash(['salary'])],['− Расход / бонусы',sumCash(['expense','bonus'])],['− Инкассация',sumCash(['collection'])],['− Возвраты',sumCash(['refund','market'])],['Остаток расчетный',total.ending]];
 if(day.actual!==null)cashRows.push(['Фактически в кассе',day.actual],['Расхождение',day.actual-total.ending]);
 for(let page=0;page<nOps;page++){
  const buy=slice(purchases,page,15),svc=slice(services,page,16),cost=slice(expenses,page,9),inc=slice(income,page,4);
  pages.push(`<section class="print-sheet">${header('ЗАКУПКИ / ШИНОМОНТАЖ',page)}<div class="print-columns"><div>${heading('ЗАКУПКИ')}${table(['№','Шт.','Наименование','М-р','Сумма','Время'],buy.map((e,i)=>[page*15+i+1,e.qty,esc(e.title)+'<small>'+esc(pay(e))+'</small>',esc(e.manager),money(e.amount),esc(e.time)]),15)}${page===0?heading('ИТОГИ · НАЛИЧНЫЕ')+table(['Показатель','Сумма, ₽'],cashRows.map(([label,value])=>[label,money(value)]),cashRows.length,'cash-table')+'<p class="print-note">Только наличные. QR, терминал и переводы в кассу не включены.</p>':''}</div><div>${heading('ШИНОМОНТАЖ')}${table(['№','Услуга','Сумма','Оплата','Время'],svc.map((e,i)=>[page*16+i+1,esc(e.title)+(e.manager?'<small>'+esc(e.manager)+'</small>':''),money(e.amount),esc(pay(e)),esc(e.time)]),16)}${heading('РАСХОД')}${table(['Наименование','Сумма','Оплата'],cost.map(e=>[esc(e.title)+(e.type!=='expense'?'<small>'+esc(TYPES[e.type][0])+'</small>':''),money(e.amount),esc(pay(e))]),9)}${heading('ПРИХОД / ВНЕСЕНИЯ')}${table(['Наименование','Сумма','Оплата'],inc.map(e=>[esc(e.title),money(e.amount),esc(pay(e))]),4)}</div></div><footer>Территория шин · Тетрадь · ${dateLabel(date)} · Операции ${page+1}/${nOps}</footer></section>`);
 }
 return pages.join('');
}
export function printNotebook(snapshot){const root=document.querySelector('#print-root');root.innerHTML=buildNotebook(snapshot);const oldTitle=document.title;document.title='Тетрадь '+dateLabel(snapshot.date);window.addEventListener('afterprint',()=>{document.title=oldTitle;root.innerHTML='';},{once:true});window.print();}
