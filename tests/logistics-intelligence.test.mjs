import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,migrateGame,joinGame,issueOrder,advanceTick,logisticsNetwork,publicState,diplomaticAction} from '../src/engine.mjs';
const tok = c => c.repeat(48);
const setup = ()=>{const g=createGame();joinGame(g,'Jogador SP','sp',tok('a'));joinGame(g,'Jogador MG','mg',tok('b'));return g;};
const prov=(g,id)=>g.provinces.find(p=>p.id===id);
const tick=(g,n)=>{for(let i=0;i<n;i++)advanceTick(g);};

test('bases têm custo, duração, limite e duplicação validados pelo servidor',()=>{
 const g=setup(),sp=prov(g,'sp'),r=g.nations.sp.resources;
 const before={...r};
 const o=issueOrder(g,tok('a'),{type:'base',provinceId:'sp'});
 assert.equal(o.finishTick,4);assert.equal(r.credits,before.credits-480);assert.equal(r.steel,before.steel-110);
 assert.throws(()=>issueOrder(g,tok('a'),{type:'base',provinceId:'sp'}),/Já existe/);
 tick(g,3);assert.equal(sp.base,0);tick(g,1);assert.equal(sp.base,1);
 assert.equal(logisticsNetwork(g,'sp').get('sp'),0);
 sp.base=3;assert.throws(()=>issueOrder(g,tok('a'),{type:'base',provinceId:'sp'}),/máximo/);
});

test('suprimento percorre fronteiras amigas e isola bolsões sem rota',()=>{
 const g=setup();
 for(const id of ['go','to','rr'])prov(g,id).ownerId='sp';
 // SP conectado à MG, mas MG continua adversário: GO/TO ficam isolados.
 tick(g,1);assert.equal(prov(g,'go').supplyDistance,null);
 assert.equal(prov(g,'go').supply,40);assert.equal(prov(g,'to').supply,40);
 prov(g,'mg').ownerId='sp';tick(g,1);
 assert.equal(prov(g,'mg').supplyDistance,1);
 assert.equal(prov(g,'go').supplyDistance,2);
 assert.equal(prov(g,'to').supplyDistance,3);
 assert.ok(prov(g,'sp').supply>prov(g,'go').supply);
 assert.equal(prov(g,'rr').supplyDistance,null);
});

test('base remota cria novo centro logístico mesmo se região estiver isolada',()=>{
 const g=setup();prov(g,'rr').ownerId='sp';tick(g,1);assert.equal(prov(g,'rr').supply,40);
 prov(g,'rr').base=1;tick(g,1);
 assert.equal(prov(g,'rr').supplyDistance,0);assert.equal(prov(g,'rr').supply,100);
});

test('drones não podem fazer reconhecimento sem base, drones e fronteira válida',()=>{
 const g=setup();
 assert.throws(()=>issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'}),/base militar/);
 prov(g,'sp').base=1;
 assert.throws(()=>issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'}),/2 drones/);
 prov(g,'sp').units.drones=4;prov(g,'sp').troops=124;
 assert.throws(()=>issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'go'}),/vizinho/);
 assert.throws(()=>issueOrder(g,tok('a'),{type:'recon',provinceId:'mg',targetId:'sp'}),/não controla/);
 assert.equal(g.orders.length,0);
});

test('relatório de drones é privado, gera instantâneo e expira no prazo',()=>{
 const g=setup(),sp=prov(g,'sp'),mg=prov(g,'mg');sp.base=1;sp.units.drones=4;sp.troops=124;
 mg.units.armor=12;mg.troops=132;const before=g.nations.sp.resources.fuel;
 const o=issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'});
 assert.equal(o.finishTick,2);assert.equal(g.nations.sp.resources.fuel,before-12);
 assert.throws(()=>issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'}),/Já existe/);
 assert.equal(publicState(g,tok('a')).intelligence.length,0);
 tick(g,2);
 const view=publicState(g,tok('a'));assert.equal(view.intelligence.length,1);
 assert.equal(view.intelligence[0].units.armor,12);
 assert.equal(view.provinces.find(p=>p.id==='mg').units,null);
 assert.equal(publicState(g,tok('b')).intelligence.length,0);
 assert.equal(publicState(g,'anon').intelligence.length,0);
 mg.units.armor=99;
 assert.equal(publicState(g,tok('a')).intelligence[0].units.armor,12,'o relatório é fotografia do momento, não espionagem ao vivo');
 tick(g,6);assert.equal(publicState(g,tok('a')).intelligence.length,0);
});

test('perda de base ou drones cancela missão em curso sem revelar inventários',()=>{
 const g=setup(),sp=prov(g,'sp');sp.base=1;sp.units.drones=2;sp.troops=122;
 issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'});
 sp.base=0;tick(g,2);
 assert.equal(publicState(g,tok('a')).intelligence.length,0);
 assert.ok(g.events.some(e=>e.message.includes('abortada')));
});

test('migração v0.6 para v0.7 preserva militares e não cria bases ou espiões',()=>{
 const g=setup();diplomaticAction(g,tok('a'),{type:'declare_war',targetId:'mg'});
 const old=structuredClone(g);old.version=4;old.provinces.forEach(p=>{delete p.base;delete p.supplyDistance;});delete old.intelligence;
 const upgraded=migrateGame(old);
 assert.equal(upgraded.version,10);assert.equal(upgraded.provinces.length,27);
 assert.equal(prov(upgraded,'sp').units.infantry,120);assert.equal(prov(upgraded,'sp').base,0);
 assert.equal(upgraded.players[tok('b')].nationId,'mg');assert.deepEqual(upgraded.intelligence,{});
 assert.ok(upgraded.diplomacy.wars['mg:sp']);
});

test('ordens de reconhecimento não declaram guerra nem alteram tropas em trânsito',()=>{
 const g=setup(),sp=prov(g,'sp');sp.base=1;sp.units.drones=2;sp.troops=122;
 issueOrder(g,tok('a'),{type:'recon',provinceId:'sp',targetId:'mg'});
 assert.deepEqual(g.diplomacy.wars,{});
 assert.equal(sp.troops,122);assert.equal(sp.units.drones,2);
 tick(g,2);assert.deepEqual(g.diplomacy.wars,{});
});
