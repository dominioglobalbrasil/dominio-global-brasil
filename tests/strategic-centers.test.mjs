import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,migrateGame,createSectors,MAP,joinGame,issueOrder,advanceTick,publicState,diplomaticAction} from '../src/engine.mjs';
const T={sp:'s'.repeat(40),mg:'m'.repeat(40),rj:'r'.repeat(40)};
function begin(){const g=createGame();joinGame(g,'Comandante SP','sp',T.sp);joinGame(g,'Comandante MG','mg',T.mg);return g;}
const sector=(g,id)=>g.sectors.find(s=>s.id===id);
const province=(g,id)=>g.provinces.find(p=>p.id===id);
const tick=(g,n=2)=>{for(let i=0;i<n;i++)advanceTick(g);};
const composition=(infantry=0,armor=0)=>({infantry,armor});
test('v0.11: 171 centros independentes por UF, com capitais e IDs legados',()=>{
 const g=createGame();assert.equal(g.version,10);assert.equal(g.sectors.length,171);
 assert.deepEqual(new Set(g.sectors.map(s=>s.id)).size,171);
 assert.equal(sector(g,'ms-capital').name,'Campo Grande');
 assert.equal(sector(g,'to-capital').name,'Palmas');
 assert.equal(sector(g,'df-capital').name,'Brasília');
 assert.equal(sector(g,'sp-hub').kind,'hub');
 assert.equal(g.sectors.filter(s=>s.kind==='capital').length,27);
 assert.ok(g.sectors.every(s=>s.troops===0));
});
test('conquistar um centro não conquista o estado inteiro, nem outro centro',()=>{
 const g=begin();const origin=province(g,'sp');origin.units.infantry=240;origin.troops=240;
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(90)});
 assert.equal(origin.troops,150);tick(g);
 assert.equal(sector(g,'mg-capital').ownerId,'sp');
 assert.equal(sector(g,'mg-hub').ownerId,'mg');
 assert.equal(province(g,'mg').ownerId,'mg');
 assert.equal(g.phase,'running');
 assert.ok(sector(g,'mg-capital').troops>0);
});
test('ocupação transfere renda parcial ao controlador, sem duplicar recursos',()=>{
 const g=begin();const orig=province(g,'sp');orig.units.infantry=300;orig.troops=300;
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-hub',composition:composition(90)});
 tick(g);assert.equal(sector(g,'mg-hub').ownerId,'sp');
 const beforeSp={...g.nations.sp.resources}, beforeMg={...g.nations.mg.resources};
 const center=province(g,'mg');
 const gross={credits:Math.floor((12+center.industry*10)*(center.morale<50?.65:1)),steel:center.industry*3,energy:center.industry*2};
 tick(g,1);
 // Estado MG continua ganhando produção, mas cede parte à ocupação; sem valores negativos.
 assert.ok(g.nations.mg.resources.credits>beforeMg.credits);
 assert.ok(g.nations.sp.resources.credits>beforeSp.credits);
 assert.equal(gross.credits,22);
 assert.ok(g.nations.sp.resources.steel>=beforeSp.steel+3);
});
test('centros exigem estado de origem próprio e adjacência real',()=>{
 const g=begin();
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'mg',sectorId:'mg-capital',composition:composition(20)}),/não controla/);
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'am-capital',composition:composition(20)}),/fora do alcance/);
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'nada',composition:composition(20)}),/fora do alcance/);
});
test('infantaria é obrigatória para ocupar, e tipo inválido não gasta recursos',()=>{
 const g=begin(),r={...g.nations.sp.resources};
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(0,5)}),/exige infantaria/);
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:{alien:25}}),/composição militar válida/);
 assert.deepEqual(g.nations.sp.resources,r);
 assert.equal(g.orders.length,0);
});
test('tropas empenhadas não podem ser reaproveitadas nem criadas',()=>{
 const g=begin();
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(80)});
 assert.equal(province(g,'sp').troops,40);
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-hub',composition:composition(50)}),/Tropas insuficientes/);
 assert.equal(g.orders.length,1);
});
test('cessar-fogo impede ataque antes e durante deslocamento',()=>{
 const g=begin();
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(50)});
 diplomaticAction(g,T.sp,{type:'offer_peace',targetId:'mg'});
 const proposal=g.diplomacy.proposals[0];diplomaticAction(g,T.mg,{type:'accept_peace',proposalId:proposal.id});
 tick(g);
 assert.equal(sector(g,'mg-capital').ownerId,'mg');
 assert.ok(g.events.some(e=>e.message.includes('suspenso por cessar-fogo')));
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(15)}),/Cessar-fogo vigente/);
});
test('defesa urbana segura ataque pequeno sem guarnição física',()=>{
 const g=begin();
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(10)});
 tick(g);
 assert.equal(sector(g,'mg-capital').ownerId,'mg');
});
test('reforço de centro ocupado exige controle e desconta tropas da origem',()=>{
 const g=begin();
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_reinforce',provinceId:'sp',sectorId:'mg-capital',composition:composition(10)}),/já controlados/);
 const before=province(g,'sp').troops;
 issueOrder(g,T.sp,{type:'sector_reinforce',provinceId:'sp',sectorId:'sp-capital',composition:composition(20)});
 assert.equal(province(g,'sp').troops,before-20);tick(g);
 assert.equal(sector(g,'sp-capital').units.infantry,20);
});
test('retirada de centro preserva reserva mínima e entrega exército ao estado',()=>{
 const g=begin();issueOrder(g,T.sp,{type:'sector_reinforce',provinceId:'sp',sectorId:'sp-capital',composition:composition(30)});tick(g);
 const before=province(g,'sp').troops;
 assert.throws(()=>issueOrder(g,T.sp,{type:'sector_withdraw',provinceId:'sp',sectorId:'sp-capital',composition:composition(30)}),/Mantenha pelo menos/);
 issueOrder(g,T.sp,{type:'sector_withdraw',provinceId:'sp',sectorId:'sp-capital',composition:composition(18)});
 assert.equal(sector(g,'sp-capital').troops,12);tick(g);
 assert.equal(province(g,'sp').troops,before+18);
});
test('migração v0.8 preserva tropas, recursos, guerras, jogadores e cria 171 centros',()=>{
 const g=begin();const old=structuredClone(g);old.version=6;delete old.sectors;
 old.nations.sp.resources.credits=4321;
 issueOrder(old,T.sp,{type:'recruit',provinceId:'sp'});
 const savedTroops=province(old,'sp').troops;
 const upgraded=migrateGame(old);
 assert.equal(upgraded.version,10);assert.equal(upgraded.sectors.length,171);
 assert.equal(province(upgraded,'sp').troops,savedTroops);
 assert.equal(upgraded.nations.sp.resources.credits,4141);
 assert.ok(upgraded.players[T.sp]);assert.equal(upgraded.orders.length,1);
});
test('migração repetida não duplica centros nem destrói guarnições',()=>{
 const g=begin();sector(g,'sp-capital').units.infantry=6;sector(g,'sp-capital').troops=6;
 const again=migrateGame(g);assert.equal(again.sectors.length,171);assert.equal(sector(again,'sp-capital').troops,6);
 assert.equal(migrateGame(again).sectors.length,171);
});
test('API oculta composição militar de centros adversários e tokens',()=>{
 const g=begin();sector(g,'mg-capital').units.armor=6;sector(g,'mg-capital').troops=6;
 const s=publicState(g,T.sp), opponent=s.sectors.find(c=>c.id==='mg-capital');
 assert.equal(opponent.units,null);assert.equal(opponent.troops,6);
 assert.equal(s.sectors.find(c=>c.id==='sp-capital').units.infantry,0);
 assert.ok(!JSON.stringify(s).includes(T.sp));assert.ok(!JSON.stringify(s).includes(T.mg));
});
test('vitória só acontece quando todos estados E centros estão controlados',()=>{
 const g=begin();g.provinces.forEach(p=>p.ownerId='sp');
 g.sectors.forEach(c=>c.ownerId='sp');sector(g,'mg-hub').ownerId='mg';
 const origin=province(g,'sp');origin.units.infantry=500;origin.troops=500;
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-hub',composition:composition(100)});
 assert.equal(g.phase,'running');tick(g);
 assert.equal(g.phase,'finished');assert.equal(g.winnerId,'sp');
});
test('centros ocupados continuam pertencendo ao ocupante ao conquistar o estado por via militar',()=>{
 const g=begin();const origin=province(g,'sp');origin.units.infantry=500;origin.troops=500;
 issueOrder(g,T.sp,{type:'sector_assault',provinceId:'sp',sectorId:'mg-capital',composition:composition(90)});tick(g);
 issueOrder(g,T.sp,{type:'move',provinceId:'sp',targetId:'mg',composition:composition(250)});tick(g);
 assert.equal(province(g,'mg').ownerId,'sp');
 assert.equal(sector(g,'mg-capital').ownerId,'sp');
 assert.equal(sector(g,'mg-hub').ownerId,'mg');
});

test('desvio econômico de polo produz aço, energia e créditos mesmo no nível industrial 1',()=>{
 const g=begin(),sp={...g.nations.sp.resources},mg={...g.nations.mg.resources};
 sector(g,'mg-hub').ownerId='sp';
 tick(g,1);
 assert.ok(g.nations.sp.resources.credits-sp.credits>=25); // SP 22 + polo MG 3 + funções urbanas
 assert.ok(g.nations.mg.resources.credits-mg.credits>=19); // MG 22 - 3 + funções urbanas
 assert.ok(g.nations.sp.resources.steel-sp.steel>=4);    // SP 3 + MG 1 + bônus por função
 assert.ok(g.nations.mg.resources.steel-mg.steel>=2);    // MG 3 - 1 + bônus por função
 assert.ok(g.nations.sp.resources.energy-sp.energy>=3);
 assert.ok(g.nations.mg.resources.energy-mg.energy>=1);
});
