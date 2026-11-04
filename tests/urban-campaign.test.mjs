import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,joinGame,issueOrder,advanceTick,publicState,urbanSupplyConnected,liveBlockades,migrateGame,diplomaticAction} from '../src/engine.mjs';

const t={sp:'s'.repeat(40),mg:'m'.repeat(40)};
const city=(g,id)=>g.sectors.find(s=>s.id===id);
function start(){const g=createGame();joinGame(g,'Comandante SP','sp',t.sp);joinGame(g,'Comandante MG','mg',t.mg);return g;}
function ticks(g,n){for(let i=0;i<n;i++)advanceTick(g);}
function route(g,target='mg-capital'){const a=city(g,target);return a.routeIds[0];}
function blockade(g,routeId=route(g)){return issueOrder(g,t.sp,{type:'sector_blockade',provinceId:'sp',sectorId:'mg-capital',routeId});}

test('v0.12 preserva 171 cidades, schema 10 e estado sem bloqueios',()=>{
 const g=createGame();assert.equal(g.version,10);assert.equal(g.sectors.length,171);assert.deepEqual(g.blockades,[]);
});
test('bloqueio cobra recursos uma só vez e começa depois de um turno',()=>{
 const g=start(),before={...g.nations.sp.resources};
 const o=blockade(g);assert.equal(o.finishTick,1);assert.equal(g.blockades.length,0);
 assert.equal(g.nations.sp.resources.credits,before.credits-110);
 ticks(g,1);assert.equal(liveBlockades(g).length,1);assert.equal(city(g,'mg-capital').underBlockade,undefined);
 assert.equal(publicState(g,t.mg).sectors.find(c=>c.id==='mg-capital').underBlockade,true);
});
test('não permite rota inexistente, autossabotagem ou duplicar bloqueio',()=>{
 const g=start();
 assert.throws(()=>issueOrder(g,t.sp,{type:'sector_blockade',provinceId:'sp',sectorId:'mg-capital',routeId:'sp-capital'}),/Rota urbana inválida/);
 assert.throws(()=>issueOrder(g,t.sp,{type:'sector_blockade',provinceId:'sp',sectorId:'sp-capital',routeId:route(g,'sp-capital')}),/própria cidade/);
 blockade(g);assert.throws(()=>blockade(g),/já possui bloqueio/);ticks(g,1);assert.throws(()=>blockade(g),/já possui bloqueio/);
});
test('bloqueio reduz a renda da cidade e diminui abastecimento',()=>{
 const baseline=start(),occupied=start();blockade(occupied);ticks(occupied,1);
 const beforeBaseline={...baseline.nations.mg.resources},beforeOccupied={...occupied.nations.mg.resources};
 advanceTick(baseline);advanceTick(occupied);
 assert.ok(city(occupied,'mg-capital').supply<city(baseline,'mg-capital').supply);
 // A economia total segue positiva, mas o bloqueio retira parte da receita urbana.
 assert.ok(occupied.nations.mg.resources.credits-beforeOccupied.credits<baseline.nations.mg.resources.credits-beforeBaseline.credits);
});
test('bloqueio tem prazo finito, reaparece pelo relógio da partida e expira',()=>{
 const g=start();blockade(g);ticks(g,1);const expires=liveBlockades(g)[0].expiresTick;
 ticks(g,expires-g.tick);assert.equal(g.tick,expires);assert.equal(liveBlockades(g).length,0);
});
test('cessar-fogo encerra bloqueios e impede novas interdições',()=>{
 const g=start();blockade(g);ticks(g,1);
 diplomaticAction(g,t.sp,{type:'offer_peace',targetId:'mg'});
 const proposal=g.diplomacy.proposals[0];diplomaticAction(g,t.mg,{type:'accept_peace',proposalId:proposal.id});
 assert.equal(liveBlockades(g).length,0);
 assert.throws(()=>blockade(g),/Cessar-fogo/);
});
test('a conquista da cidade elimina os bloqueios anteriores de seu antigo controlador',()=>{
 const g=start();blockade(g);ticks(g,1);city(g,'mg-capital').ownerId='sp';assert.equal(liveBlockades(g).length,0);
 ticks(g,1);assert.equal(g.blockades.length,0);
});
test('um cerco enfraquece abastecimento e impede comboios convencionais',()=>{
 const g=start(),c=city(g,'mg-capital');const before=c.supply;
 issueOrder(g,t.sp,{type:'sector_siege',provinceId:'sp',sectorId:c.id,composition:{infantry:40}});
 advanceTick(g);assert.ok(c.supply<before);assert.equal(publicState(g,t.mg).sectors.find(s=>s.id===c.id).underSiege,true);
 assert.throws(()=>issueOrder(g,t.mg,{type:'sector_supply',provinceId:'mg',sectorId:c.id}),/cercada ou bloqueada/);
});
test('socorro interrompe cerco antes da ocupação, com tropas sobreviventes',()=>{
 const g=start(),c=city(g,'mg-capital');
 issueOrder(g,t.sp,{type:'sector_siege',provinceId:'sp',sectorId:c.id,composition:{infantry:45}});
 const before=g.provinces.find(p=>p.id==='mg').troops;
 issueOrder(g,t.mg,{type:'sector_relieve',provinceId:'mg',sectorId:c.id});
 assert.equal(g.provinces.find(p=>p.id==='mg').troops,before-15);
 ticks(g,2);assert.equal(g.orders.some(o=>o.type==='sector_siege'),false);assert.equal(c.ownerId,'mg');
 assert.ok(g.provinces.find(p=>p.id==='mg').troops>before-15);
});
test('socorro remove bloqueio e melhora suprimento sem conquistar território',()=>{
 const g=start(),c=city(g,'mg-capital');blockade(g);ticks(g,1);
 issueOrder(g,t.mg,{type:'sector_relieve',provinceId:'mg',sectorId:c.id});ticks(g,2);
 assert.equal(liveBlockades(g).length,0);assert.equal(c.ownerId,'mg');assert.ok(c.supply>=70);
});
test('não permite socorro sem ameaça ou sem infantaria para reserva',()=>{
 const g=start();assert.throws(()=>issueOrder(g,t.mg,{type:'sector_relieve',provinceId:'mg',sectorId:'mg-capital'}),/sem cerco ou bloqueio/);
 blockade(g);ticks(g,1);const p=g.provinces.find(p=>p.id==='mg');p.units.infantry=15;p.troops=15;
 assert.throws(()=>issueOrder(g,t.mg,{type:'sector_relieve',provinceId:'mg',sectorId:'mg-capital'}),/15 unidades/);
});
test('migração da v0.11 mantém centros, jogadores, exércitos e ordens',()=>{
 const g=start();g.version=9;delete g.blockades;
 issueOrder(g,t.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:{infantry:25}});
 const amount=g.provinces.find(p=>p.id==='sp').troops;
 const upgraded=migrateGame(g);assert.equal(upgraded.version,10);assert.deepEqual(upgraded.blockades,[]);
 assert.equal(upgraded.orders[0].sectorId,'mg-capital');assert.equal(upgraded.provinces.find(p=>p.id==='sp').troops,amount);
 assert.ok(upgraded.players[t.sp]);
});
test('bloqueios ficam visíveis, mas tropas e suprimentos inimigos continuam privados',()=>{
 const g=start();blockade(g);ticks(g,1);
 const state=publicState(g,t.sp),target=state.sectors.find(c=>c.id==='mg-capital');
 assert.equal(state.blockades.length,1);assert.equal(target.units,null);assert.equal(target.supply,null);
 assert.ok(!JSON.stringify(state).includes(t.mg));
});
