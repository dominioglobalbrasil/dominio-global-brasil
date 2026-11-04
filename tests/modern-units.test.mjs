import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, migrateGame, UNIT_TYPES, joinGame, issueOrder, advanceTick, publicState, diplomaticAction } from '../src/engine.mjs';
const token = c => c.repeat(40);
const setup = () => { const g=createGame();joinGame(g,'General SP','sp',token('a'));joinGame(g,'General MG','mg',token('b'));return g; };
const p = (g,id) => g.provinces.find(x=>x.id===id);
const tick = (g,n) => { for(let i=0;i<n;i++)advanceTick(g); };
const setArmy = (province,units) => { province.units={infantry:0,armor:0,artillery:0,aircraft:0,drones:0,...units};province.troops=Object.values(province.units).reduce((a,b)=>a+b,0); };

test('cinco especialidades militares distintas e preços não nulos',()=>{
 assert.deepEqual(Object.keys(UNIT_TYPES),['infantry','armor','artillery','aircraft','drones']);
 for(const t of Object.values(UNIT_TYPES)){ assert.ok(t.batch>0 && t.buildTicks>0 && t.attack>0 && t.defense>0);assert.ok(t.cost.credits>0); }
});
test('recrutamento blindado desconta recursos e chega no lote exato',()=>{
 const g=setup(), home=p(g,'sp');
 const steel=g.nations.sp.resources.steel;
 const order=issueOrder(g,token('a'),{type:'recruit_unit',unitType:'armor',provinceId:'sp'});
 assert.equal(order.finishTick,UNIT_TYPES.armor.buildTicks);
 assert.equal(g.nations.sp.resources.steel,steel-UNIT_TYPES.armor.cost.steel);
 assert.throws(()=>issueOrder(g,token('a'),{type:'recruit_unit',unitType:'armor',provinceId:'sp'}),/Já existe/);
 tick(g,4);assert.equal(home.units.armor,5);assert.equal(home.troops,125);
});
test('treinamento de infantaria e drones pode ocorrer simultaneamente',()=>{
 const g=setup();issueOrder(g,token('a'),{type:'recruit_unit',unitType:'infantry',provinceId:'sp'});
 issueOrder(g,token('a'),{type:'recruit_unit',unitType:'drones',provinceId:'sp'});
 assert.equal(g.orders.length,2);tick(g,3);
 assert.equal(p(g,'sp').units.infantry,150);assert.equal(p(g,'sp').units.drones,8);
});
test('aviação requer nível 2 de indústria, além dos recursos necessários',()=>{
 const g=setup();
 assert.throws(()=>issueOrder(g,token('a'),{type:'recruit_unit',unitType:'aircraft',provinceId:'sp'}),/indústria nível 2/);
 p(g,'sp').industry=2;
 issueOrder(g,token('a'),{type:'recruit_unit',unitType:'aircraft',provinceId:'sp'});
 tick(g,5);assert.equal(p(g,'sp').units.aircraft,2);
});
test('pedido militar inválido não debita recursos nem remove tropas',()=>{
 const g=setup(),before=structuredClone(g.nations.sp.resources);
 assert.throws(()=>issueOrder(g,token('a'),{type:'recruit_unit',unitType:'super_bomb',provinceId:'sp'}),/inválido/);
 assert.throws(()=>issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{infantry:10,laser:5}}),/Composição/);
 assert.throws(()=>issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{infantry:100000}}),/Tropas inválidas/);
 assert.throws(()=>issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{infantry:1.3}}),/Composição/);
 assert.deepEqual(g.nations.sp.resources,before);
 assert.equal(p(g,'sp').troops,120);assert.equal(g.orders.length,0);
});
test('marcha conjunta transfere exatamente a composição pedida',()=>{
 const g=setup();setArmy(p(g,'sp'),{infantry:50,armor:15,drones:9});
 const order=issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'pr',composition:{infantry:20,armor:10,drones:8}});
 assert.equal(order.finishTick,3); // blindados são a unidade mais lenta
 assert.equal(p(g,'sp').units.armor,5);
 assert.equal(p(g,'sp').units.infantry,30);
 // PR começa como adversário, simulamos cessão de território durante o deslocamento.
 p(g,'pr').ownerId='sp';
 tick(g,3);assert.equal(p(g,'pr').units.armor,10);assert.equal(p(g,'pr').units.drones,8);
 assert.equal(p(g,'pr').units.infantry,140);
});
test('blindados sem infantaria vencem confronto, mas não ocupam o estado',()=>{
 const g=setup();setArmy(p(g,'sp'),{infantry:20,armor:35});setArmy(p(g,'mg'),{infantry:5});
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{armor:30}});
 tick(g,3);
 assert.equal(p(g,'mg').ownerId,'mg');
 assert.ok(p(g,'sp').units.armor>5);
 assert.ok(g.events.some(e=>e.message.includes('não ocupou')));
});
test('coluna com infantaria e blindados consegue conquistar e manter composição',()=>{
 const g=setup();setArmy(p(g,'sp'),{infantry:120,armor:30,drones:8});setArmy(p(g,'mg'),{infantry:22});
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{infantry:60,armor:20,drones:5}});
 tick(g,3);
 assert.equal(p(g,'mg').ownerId,'sp');assert.ok(p(g,'mg').units.armor>0);
 assert.ok(p(g,'mg').units.infantry>0);
});
test('consumo logístico gera crise, altera eficiência e não cria estoque negativo',()=>{
 const g=setup();setArmy(p(g,'sp'),{infantry:1400,armor:45,aircraft:20,drones:40});
 g.nations.sp.resources.food=0;g.nations.sp.resources.fuel=0;g.nations.sp.resources.energy=0;
 advanceTick(g);
 assert.ok(g.nations.sp.supply<55,g.nations.sp.supply);
 assert.equal(p(g,'sp').supply,g.nations.sp.supply);
 assert.ok(p(g,'sp').morale<100);
 for(const k of ['food','fuel','energy'])assert.ok(g.nations.sp.resources[k]>=0);
 assert.ok(g.nations.sp.upkeep.food>0 && g.nations.sp.upkeep.fuel>0);
 assert.ok(g.events.some(e=>e.type==='logistics'));
});
test('composição do adversário é privada e ordens de movimento também',()=>{
 const g=setup();setArmy(p(g,'mg'),{infantry:200,aircraft:10});
 const view=publicState(g,token('a'));
 assert.equal(view.provinces.find(x=>x.id==='mg').units,null);
 assert.equal(view.provinces.find(x=>x.id==='sp').units.infantry,120);
 assert.equal(view.provinces.find(x=>x.id==='mg').supply,null);
 assert.ok(view.unitTypes.drones);
});
test('migração de v0.5 preserva ordens, tropas e diplomacia',()=>{
 const g=setup();diplomaticAction(g,token('a'),{type:'declare_war',targetId:'mg'});
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',units:20});
 const old=structuredClone(g);old.version=3;
 for(const province of old.provinces){delete province.units;delete province.supply;}
 for(const n of Object.values(old.nations)){delete n.supply;delete n.upkeep;}
 for(const order of old.orders){delete order.composition;delete order.unitType;}
 const upgraded=migrateGame(old);
 assert.equal(upgraded.version,10);
 assert.equal(p(upgraded,'sp').units.infantry,100);
 assert.equal(upgraded.orders[0].composition.infantry,20);
 assert.equal(upgraded.diplomacy.wars['mg:sp'],true);
 assert.equal(upgraded.players[token('a')].nationId,'sp');
});
test('cessar-fogo devolve exército combinado sem duplicar unidades',()=>{
 const g=setup();setArmy(p(g,'sp'),{infantry:120,armor:15,drones:8});
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',composition:{infantry:20,armor:10,drones:5}});
 const proposal=diplomaticAction(g,token('a'),{type:'offer_peace',targetId:'mg'});
 diplomaticAction(g,token('b'),{type:'accept_peace',proposalId:proposal.id});
 tick(g,3);
 assert.equal(p(g,'sp').units.infantry,120);
 assert.equal(p(g,'sp').units.armor,15);
 assert.equal(p(g,'sp').units.drones,8);
 assert.equal(p(g,'mg').ownerId,'mg');
});
