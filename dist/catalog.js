// A manual product list supplied by the owner; no live MoySklad connection.
export const PRODUCTS = [
 ['Michelin Primacy Tour A/S R20 245/50',450000,''],
 ['Michelin Latitude Sport 3 R19 255/55',220000,''],
 ['Michelin Energy XM2 R15 185/65',120000,''],
 ['Goodyear UltraGrip Arctic 2 R17 215/55',375000,''],
 ['Nokian Tyres Nordman 7 R15 185/65',375000,'6ab7524e50534'],
 ['iLink Wintervorhut Stud II R19 255/35',915000,''],
 ['Matador MP 92 Sibir Snow SUV R17 215/60',400000,''],
 ['Michelin Energy XM2 R15 185/65',100000,''],
 ['Michelin Energy XM2 R15 185/65',120000,''],
 ['Viatti Brina Nordico V-522 R15 185/65',250000,''],
 ['Continental Conti4x4Contact R16 215/65',160000,''],
 ['KAMA (Нижнекамский шинный завод) Grant (НK-241) R14 175/65',175000,''],
 ['Roadstone NFera RU5 SUV 225/55/18',400000,''],
 ['Pirelli Chrono Winter R16c 235/65',200000,''],
 ['Kumho Majesty Solus KU50 R17 235/55',420000,''],
 ['Bridgestone Blizzak Spike-01 R16 235/60',220000,'69c0a57201346'],
 ['Pirelli PZero MGT 275/45 110Y R20',650000,''],
 ['Kapsen Headking S2000 245/40 R19 98Y',450000,'3372'],
 ['Dunlop SP Sport LM 705 245/45/19',750000,'']
].map(([title,unitPrice,article],i)=>({id:'owner-list-'+String(i+1).padStart(2,'0'),title,unitPrice,article,sourceRow:i+1}));

export function lineTotal(unitPrice,qty){
 if(!Number.isSafeInteger(unitPrice)||unitPrice<=0||!Number.isInteger(qty)||qty<1||qty>9999)throw Error('Проверьте цену и количество');
 const result=unitPrice*qty;if(!Number.isSafeInteger(result)||result>1e12)throw Error('Слишком большая сумма');return result;
}
