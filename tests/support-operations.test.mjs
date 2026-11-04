import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createGame, migrateGame, joinGame, issueOrder, advanceTick, diplomaticAction,
 borderDistance, publicState, SUPPORT_FACILITIES, SUPPORT_MISSIONS,
} from '../src/engine.mjs';
const A='a'.repeat(48), B='b'.repeat(48);
function setup(){const g=createGame();joinGame(g,'Comandante SP','sp',A);joinGame(g,'Comandante MG','mg',B);return g;}
const prov=(g,id)=>g.provinces.find(p=>p.id===id);
const tick=(g,n)=>{for(let i=0;i<n;i++)advanceTick(g);};
function equip(g){const p=prov(g,'sp');p.airfield=1;p.battery=1;p.units.aircraft=12;p.units.artillery=24;p.troops=156;return p;}
function war(g,target='mg'){diplomaticAction(g,A,{type:'declare_war',targetId:target});}
test('cria 27 UFs e instalações v0.8 inicialmente zeradas',()=>{
 const g=createGame();assert.equal(g.version,10);assert.equal(g.provinces.length,27);
 for(const p of g.provinces){assert.equal(p.airfield,0);assert.equal(p.battery,0);}
 assert.equal(SUPPORT_FACILITIES.airfield.max,2);assert.equal(SUPPORT_MISSIONS.barrage.ticks,1);
});
test('instalações: custo, duração, bloqueio por ordem ativa e limite de nível',()=>{
 const g=setup(),p=prov(g,'sp');
 let before={...g.nations.sp.resources};
 const order=issueOrder(g,A,{type:'airfield',provinceId:'sp'});
 assert.equal(order.finishTick,4);assert.equal(g.nations.sp.resources.credits,before.credits-520);
 assert.equal(g.nations.sp.resources.steel,before.steel-125);
 assert.throws(()=>issueOrder(g,A,{type:'airfield',provinceId:'sp'}),/Já existe/);
 tick(g,3);assert.equal(p.airfield,0);tick(g,1);assert.equal(p.airfield,1);
 before={...g.nations.sp.resources};
 issueOrder(g,A,{type:'battery',provinceId:'sp'});
 assert.equal(g.nations.sp.resources.fuel,before.fuel-28);
 tick(g,3);assert.equal(p.battery,1);
 p.airfield=2;p.battery=2;
 assert.throws(()=>issueOrder(g,A,{type:'airfield',provinceId:'sp'}),/máximo/);
 assert.throws(()=>issueOrder(g,A,{type:'battery',provinceId:'sp'}),/máximo/);
});
test('missões exigem instalações, guerra declarada e quantidade inteira válida',()=>{
 const g=setup();const p=equip(g);p.airfield=0;
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:2}),/guerra declarada/);
 war(g);
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:2}),/aeródromo/);
 p.airfield=1;
 for(const bad of [0,1,2.4,13,'2',null,-1])assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:bad}),/Quantidade inválida/);
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'sp',unitCount:2}),/inimigo válido/);
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'mg',targetId:'sp',unitCount:2}),/não controla/);
 assert.equal(g.orders.length,0);
});
test('alcance aéreo em bordas: 2 no nível 1; 3 no nível 2; além disso bloqueado',()=>{
 const g=setup(),p=equip(g);war(g,'ba');war(g,'to');
 assert.equal(borderDistance(g,'sp','ba'),2);assert.equal(borderDistance(g,'sp','to'),3);
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'to',unitCount:2}),/fora do alcance/);
 const o=issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'ba',unitCount:2});
 assert.equal(o.targetId,'ba');p.airfield=2;
 tick(g,2);
 const next=issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'to',unitCount:2});assert.equal(next.targetId,'to');
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'rn',unitCount:2}),/guerra declarada/);
});
test('ataque aéreo reserva aeronaves, paga combustível e energia e não conquista',()=>{
 const g=setup(),p=equip(g),d=prov(g,'mg');war(g);
 const before={...g.nations.sp.resources};const old=d.troops;
 const o=issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:4});
 assert.equal(o.finishTick,2);assert.equal(p.units.aircraft,8);assert.equal(p.troops,152);
 assert.equal(g.nations.sp.resources.fuel,before.fuel-32-4*8);
 assert.equal(g.nations.sp.resources.energy,before.energy-18);
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:2}),/Já existe/);
 tick(g,1);assert.equal(d.troops,old);tick(g,1);
 assert.ok(d.troops<old);assert.equal(d.ownerId,'mg');assert.equal(p.units.aircraft,12);
 assert.equal(g.orders.length,0);
});
test('artilharia exige bateria, alvo vizinho e causa dano sem ocupar',()=>{
 const g=setup(),p=equip(g),target=prov(g,'mg');war(g);war(g,'ba');
 assert.throws(()=>issueOrder(g,A,{type:'barrage',provinceId:'sp',targetId:'ba',unitCount:12}),/fora do alcance/);
 const before=target.troops;target.fort=2;
 const o=issueOrder(g,A,{type:'barrage',provinceId:'sp',targetId:'mg',unitCount:12});
 assert.equal(o.finishTick,1);assert.equal(p.units.artillery,12);
 tick(g,1);assert.equal(target.ownerId,'mg');assert.ok(target.troops<before);
 assert.equal(target.fort,1);assert.equal(p.units.artillery,24);
});
test('cessar-fogo que começa durante o voo cancela missão e devolve unidades',()=>{
 const g=setup(),p=equip(g),target=prov(g,'mg');war(g);
 const before=target.troops;
 issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:5});
 const offer=diplomaticAction(g,A,{type:'offer_peace',targetId:'mg'});
 diplomaticAction(g,B,{type:'accept_peace',proposalId:offer.id});
 assert.equal(p.units.aircraft,7);
 tick(g,2);assert.equal(p.units.aircraft,12);
 assert.equal(target.troops,before);assert.equal(target.ownerId,'mg');
 assert.ok(g.events.some(e=>e.message.includes('cancelado por alteração diplomática')));
});
test('uma missão aérea não pode usar aeronaves já comprometidas em deslocamento',()=>{
 const g=setup(),p=equip(g);war(g);
 issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:12});
 assert.equal(p.units.aircraft,0);
 assert.throws(()=>issueOrder(g,A,{type:'move',provinceId:'sp',targetId:'mg',composition:{aircraft:1,infantry:1}}),/Tropas inválidas/);
});
test('v0.7 migrada mantém exércitos, diplomacia, recursos e introduz instalações zero',()=>{
 const g=setup();war(g);equip(g);
 const snapshot=structuredClone(g);snapshot.version=5;snapshot.provinces.forEach(p=>{delete p.airfield;delete p.battery;});
 const upgraded=migrateGame(snapshot);const p=prov(upgraded,'sp');
 assert.equal(upgraded.version,10);assert.equal(p.airfield,0);assert.equal(p.battery,0);
 assert.equal(p.units.aircraft,12);assert.equal(p.units.artillery,24);
 assert.equal(upgraded.nations.sp.resources.credits,1500);assert.equal(upgraded.players[A].nationId,'sp');
 assert.ok(upgraded.diplomacy.wars['mg:sp']);
});
test('partida salva v0.8 com missão pendente continua após restauração',()=>{
 const g=setup();equip(g);war(g);
 issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:3});
 const resumed=migrateGame(structuredClone(g));
 assert.equal(resumed.orders.length,1);tick(resumed,2);
 assert.equal(resumed.orders.length,0);
 assert.equal(prov(resumed,'sp').units.aircraft,12);
 assert.equal(prov(resumed,'mg').ownerId,'mg');
});
test('API pública só exibe ordens militares ao dono; tropas inimigas continuam ocultas',()=>{
 const g=setup();equip(g);war(g);
 issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:2});
 const own=publicState(g,A),enemy=publicState(g,B),anon=publicState(g,'sem-token');
 assert.equal(own.orders[0].type,'airstrike');assert.equal(enemy.orders.length,0);assert.equal(anon.orders.length,0);
 assert.equal(own.provinces.find(p=>p.id==='mg').units,null);
 assert.equal(own.provinces.find(p=>p.id==='sp').airfield,1);
});
test('recursos insuficientes e missões inválidas não descontam recursos',()=>{
 const g=setup();equip(g);war(g);g.nations.sp.resources.fuel=0;
 const before={...g.nations.sp.resources},count=prov(g,'sp').units.aircraft;
 assert.throws(()=>issueOrder(g,A,{type:'airstrike',provinceId:'sp',targetId:'mg',unitCount:2}),/Recursos insuficientes/);
 assert.deepEqual(g.nations.sp.resources,before);assert.equal(prov(g,'sp').units.aircraft,count);
});
