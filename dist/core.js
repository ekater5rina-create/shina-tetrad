export const TYPES = {
 sale: ['Продажа шин', 1, 'Продажи'], service: ['Шиномонтаж', 1, 'Услуги'],
 straightening: ['Правка диска', 1, 'Услуги'], package: ['Пакеты', 1, 'Продажи'],
 disposal: ['Утилизация', 1, 'Услуги'], other: ['Другая продажа', 1, 'Продажи'],
 purchase: ['Закупка', -1, 'Закупки'], expense: ['Расход', -1, 'Расходы'],
 salary: ['Зарплата', -1, 'Расходы'], collection: ['Инкассация', -1, 'Касса'],
 refund: ['Возврат покупателю', -1, 'Возвраты'], market: ['Возврат Я.Маркет', -1, 'Возвраты'],
 income: ['Внесение в кассу', 1, 'Касса'], bonus: ['Перевод / бонус', -1, 'Расходы']
};
export const METHODS = {cash:'Наличные',qr:'QR',card:'Терминал',transfer:'Перевод'};
export function cents(value) {
 const s=String(value).trim().replace(',','.');
 if(!/^\d+(\.\d{1,2})?$/.test(s)) throw Error('Введите сумму с точностью до копейки');
 const [r,k='']=s.split('.'); const n=Number(r)*100+Number(k.padEnd(2,'0'));
 if(!Number.isSafeInteger(n)||n>1e12) throw Error('Слишком большая сумма');
 return n;
}
export function totals(entries, opening=0) {
 const t={revenue:0,outflow:0,cashIn:0,cashOut:0,qr:0,card:0,transfer:0,sales:0,services:0,refunds:0};
 for(const e of entries){const sign=TYPES[e.type][1];
  if(['sale','package','other'].includes(e.type)){t.sales+=e.amount;t.revenue+=e.amount;}
  if(['service','straightening','disposal'].includes(e.type)){t.services+=e.amount;t.revenue+=e.amount;}
  if(['refund','market'].includes(e.type))t.refunds+=e.amount;
  if(sign<0)t.outflow+=e.amount;
  for(const p of e.payments)if(p.method==='cash')t[sign>0?'cashIn':'cashOut']+=p.amount;else t[p.method]+=sign*p.amount;
 }
 t.ending=opening+t.cashIn-t.cashOut;return t;
}
export const validDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
export function validate(data){
 if(!data||data.version!==1||!Array.isArray(data.entries)||!data.days||typeof data.days!=='object'||Array.isArray(data.days))throw Error('Неверный формат резервной копии');
 const ids=new Set();const integer=n=>Number.isSafeInteger(n)&&Math.abs(n)<=1e12;
 for(const [date,d]of Object.entries(data.days))if(!validDate(date)||!d||!integer(d.opening)||typeof d.closed!=='boolean'||(d.actual!==null&&!integer(d.actual)))throw Error('Ошибка параметров дня');
 for(const e of data.entries){
  if(!e||typeof e.id!=='string'||ids.has(e.id)||!Object.hasOwn(TYPES,e.type)||!validDate(e.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)||!integer(e.amount)||e.amount<=0||!Number.isInteger(e.qty)||e.qty<1||e.qty>9999||!Array.isArray(e.payments)||!e.payments.length||e.payments.length>2)throw Error('Ошибка записи в копии');
  for(const key of ['title','article','manager','customer','phone','note'])if(typeof e[key]!=='string'||e[key].length>2000)throw Error('Ошибка текстового поля');
  if(e.payments.some(p=>!p||!Object.hasOwn(METHODS,p.method)||!integer(p.amount)||p.amount<0)||e.payments.reduce((s,p)=>s+p.amount,0)!==e.amount)throw Error('Сумма оплат не совпадает');
  if(!Object.hasOwn(data.days,e.date))throw Error('Не найден день записи');ids.add(e.id);
 }return data;
}
export function csvCell(v){let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
