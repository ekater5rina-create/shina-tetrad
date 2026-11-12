import {TYPES,validDate,totals} from './core.js';
const DAY=86400000;
export const REVENUE_TYPES=['sale','package','other','service','straightening','disposal'];
export const SERVICE_TYPES=['service','straightening','disposal'];
export const EXTERNAL_OUT_TYPES=['purchase','expense','salary','bonus','refund','market'];
export function shiftDate(date,days){return new Date(Date.parse(date+'T00:00:00Z')+days*DAY).toISOString().slice(0,10);}
export function previousPeriod(from,to){const length=Math.round((Date.parse(to)-Date.parse(from))/DAY)+1;return {from:shiftDate(from,-length),to:shiftDate(from,-1),length};}
export function metrics(entries){
 const result={grossRevenue:0,sales:0,services:0,refunds:0,netRevenue:0,externalOut:0,purchases:0,expenses:0,salary:0,collection:0,injections:0,cashNet:0,saleCount:0,soldQty:0,serviceCount:0,averageSale:null,payments:{cash:0,qr:0,card:0,transfer:0}};
 for(const e of entries){
  if(REVENUE_TYPES.includes(e.type)){result.grossRevenue+=e.amount;for(const p of e.payments)result.payments[p.method]+=p.amount;}
  if(['sale','package','other'].includes(e.type))result.sales+=e.amount;
  if(SERVICE_TYPES.includes(e.type)){result.services+=e.amount;result.serviceCount++;}
  if(e.type==='sale'){result.saleCount++;result.soldQty+=e.qty;}
  if(['refund','market'].includes(e.type))result.refunds+=e.amount;
  if(EXTERNAL_OUT_TYPES.includes(e.type))result.externalOut+=e.amount;
  if(e.type==='purchase')result.purchases+=e.amount;
  if(['expense','bonus'].includes(e.type))result.expenses+=e.amount;
  if(e.type==='salary')result.salary+=e.amount;
  if(e.type==='collection')result.collection+=e.amount;
  if(e.type==='income')result.injections+=e.amount;
  for(const p of e.payments)if(p.method==='cash')result.cashNet+=TYPES[e.type][1]*p.amount;
 }
 result.netRevenue=result.grossRevenue-result.refunds;
 if(result.saleCount)result.averageSale=Math.round(entries.filter(e=>e.type==='sale').reduce((s,e)=>s+e.amount,0)/result.saleCount);
 return result;
}
export function analyzeOwner(data,from,to){
 if(!validDate(from)||!validDate(to)||from>to)throw Error('Проверьте начало и конец периода');
 const prior=previousPeriod(from,to);if(prior.length>3660)throw Error('Выберите период до 10 лет');
 const rows=data.entries.filter(e=>e.date>=from&&e.date<=to),oldRows=data.entries.filter(e=>e.date>=prior.from&&e.date<=prior.to);
 const rowsByDate=new Map();for(const row of rows){if(!rowsByDate.has(row.date))rowsByDate.set(row.date,[]);rowsByDate.get(row.date).push(row);}
 const knownDates=[...new Set([...Object.keys(data.days),...data.entries.map(e=>e.date)])].sort();
 const dates=knownDates.filter(d=>d>=from&&d<=to),oldDates=knownDates.filter(d=>d>=prior.from&&d<=prior.to);
 const closed=dates.filter(d=>data.days[d]?.closed),oldClosed=oldDates.filter(d=>data.days[d]?.closed);
 const byDate=dates.map(date=>({date,entries:rowsByDate.get(date)||[],...metrics(rowsByDate.get(date)||[])}));
 const discrepancies=dates.filter(d=>data.days[d]?.actual!==null&&data.days[d]?.actual!==undefined).map(date=>{const d=data.days[date],calculated=totals(rowsByDate.get(date)||[],d.opening).ending;return {date,actual:d.actual,calculated,difference:d.actual-calculated};}).filter(d=>d.difference!==0);
 const negativeCash=dates.map(date=>({date,ending:totals(rowsByDate.get(date)||[],data.days[date]?.opening||0).ending})).filter(d=>d.ending<0);
 const lastDate=dates.at(-1);let cash=null;
 if(lastDate&&data.days[lastDate]){const d=data.days[lastDate];cash={date:lastDate,opening:d.opening,calculated:totals(rowsByDate.get(lastDate)||[],d.opening).ending,actual:d.actual,closed:d.closed};}
 return {from,to,prior,rows,oldRows,current:metrics(rows),previous:metrics(oldRows),dates,byDate,cash,coverage:{days:dates.length,closed:closed.length,expected:prior.length,previousDays:oldDates.length,previousClosed:oldClosed.length},comparable:closed.length===prior.length&&oldClosed.length===prior.length,discrepancies,negativeCash};
}
