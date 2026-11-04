import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, joinGame, diplomaticAction, issueOrder, advanceTick, migrateGame, publicState } from '../src/engine.mjs';
const t = x => x.repeat(40);
const game = () => { const g = createGame(); joinGame(g, 'Capitão Paulo', 'sp', t('a')); joinGame(g, 'Capitão Minas', 'mg', t('b')); return g; };
const tick = (g, n) => {for(let i=0;i<n;i++)advanceTick(g);};
const pair = 'mg:sp';

test('migração de v0.4 preserva tropas, jogadores, ordens e recursos',()=>{
 const g=game(); issueOrder(g,t('a'),{type:'recruit',provinceId:'sp'});
 const prev=JSON.parse(JSON.stringify(g)); prev.version=2; delete prev.diplomacy;
 const upgraded=migrateGame(prev);
 assert.equal(upgraded.version,10);
 assert.equal(upgraded.orders.length,1);
 assert.equal(upgraded.provinces.length,27);
 assert.deepEqual(upgraded.nations.sp.resources,g.nations.sp.resources);
 assert.equal(upgraded.players[t('a')].nationId,'sp');
 assert.deepEqual(upgraded.diplomacy.wars,{});
});

test('guerra formal é pública e só autenticado pode declarar',()=>{
 const g=game();
 assert.throws(()=>diplomaticAction(g,'invalid',{type:'declare_war',targetId:'mg'}),/não autorizada/);
 diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'});
 assert.ok(publicState(g,t('b')).diplomacy.wars.includes(pair));
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'}),/já estão em guerra/);
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'declare_war',targetId:'sp'}),/si mesmo/);
});

test('atacar fronteira neutra declara guerra automaticamente',()=>{
 const g=game();
 issueOrder(g,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:10});
 assert.ok(g.diplomacy.wars[pair]);
 assert.ok(g.events.some(e=>e.message.includes('declarou guerra')));
});

test('negociação não gera paz unilateral, exige aceite do adversário',()=>{
 const g=game(); diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'});
 const proposal=diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'mg'});
 assert.equal(proposal.status,'pending');
 assert.ok(g.diplomacy.wars[pair]);
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'accept_peace',proposalId:proposal.id}),/não encontrada/);
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'mg'}),/pendente/);
 assert.equal(publicState(g,t('b')).diplomacy.proposals.length,1);
 assert.equal(publicState(g,null).diplomacy.proposals.length,0);
 const accepted=diplomaticAction(g,t('b'),{type:'accept_peace',proposalId:proposal.id});
 assert.equal(accepted.status,'truce');
 assert.equal(g.diplomacy.wars[pair],undefined);
 assert.equal(g.diplomacy.truces[pair],10);
});

test('cessar-fogo bloqueia novos ataques sem perder tropas, termina no prazo',()=>{
 const g=game(); diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'});
 const p=diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'mg'});
 diplomaticAction(g,t('b'),{type:'accept_peace',proposalId:p.id});
 const troops=g.provinces.find(x=>x.id==='sp').troops;
 assert.throws(()=>issueOrder(g,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:20}),/Cessar-fogo/);
 assert.equal(g.provinces.find(x=>x.id==='sp').troops,troops);
 assert.equal(g.orders.length,0);
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'}),/cessar-fogo/);
 tick(g,10);
 assert.equal(g.diplomacy.truces[pair],undefined);
 diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'});
 assert.ok(g.diplomacy.wars[pair]);
});

test('paz aceita antes da chegada manda tropas de volta e evita batalha',()=>{
 const g=game();g.provinces.find(x=>x.id==='sp').troops=500;g.provinces.find(x=>x.id==='sp').units.infantry=500;
 issueOrder(g,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:200});
 const p=diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'mg'});
 diplomaticAction(g,t('b'),{type:'accept_peace',proposalId:p.id});
 tick(g,2);
 assert.equal(g.provinces.find(x=>x.id==='sp').troops,500);
 assert.equal(g.provinces.find(x=>x.id==='mg').ownerId,'mg');
 assert.equal(g.orders.length,0);
 assert.ok(g.events.some(e=>e.message.includes('suspenso pelo cessar-fogo')));
});

test('proposta rejeitada ou expirada não interrompe a guerra',()=>{
 const g=game(); diplomaticAction(g,t('a'),{type:'declare_war',targetId:'mg'});
 const a=diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'mg'});
 diplomaticAction(g,t('b'),{type:'reject_peace',proposalId:a.id});
 assert.equal(g.diplomacy.proposals.length,0);
 assert.ok(g.diplomacy.wars[pair]);
 diplomaticAction(g,t('b'),{type:'offer_peace',targetId:'sp'});
 tick(g,12);
 assert.equal(g.diplomacy.proposals.length,0);
 assert.ok(g.diplomacy.wars[pair]);
});

test('não negocia com estado sem jogador humano',()=>{
 const g=game(); diplomaticAction(g,t('a'),{type:'declare_war',targetId:'rj'});
 assert.throws(()=>diplomaticAction(g,t('a'),{type:'offer_peace',targetId:'rj'}),/comandante humano/);
});

test('fortificação desconta recursos, conclui e amplia defesa em combate',()=>{
 const g=game(); const mg=g.provinces.find(p=>p.id==='mg');
 const money=g.nations.mg.resources.credits;
 issueOrder(g,t('b'),{type:'fort',provinceId:'mg'});
 assert.equal(g.nations.mg.resources.credits,money-260);
 assert.throws(()=>issueOrder(g,t('b'),{type:'fort',provinceId:'mg'}),/Já existe/);
 tick(g,3);assert.equal(mg.fort,1);
 mg.fort=2;
 issueOrder(g,t('b'),{type:'fort',provinceId:'mg'});
 tick(g,3);assert.equal(mg.fort,3);
 assert.throws(()=>issueOrder(g,t('b'),{type:'fort',provinceId:'mg'}),/máximo/);
 const base=game(); base.provinces.find(p=>p.id==='sp').troops=250;base.provinces.find(p=>p.id==='sp').units.infantry=250;
 base.provinces.find(p=>p.id==='mg').troops=100;base.provinces.find(p=>p.id==='mg').units.infantry=100;
 issueOrder(base,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:200});tick(base,2);
 assert.equal(base.provinces.find(p=>p.id==='mg').ownerId,'sp');
 const fortified=game(); fortified.provinces.find(p=>p.id==='sp').troops=250;fortified.provinces.find(p=>p.id==='sp').units.infantry=250;
 fortified.provinces.find(p=>p.id==='mg').troops=100;fortified.provinces.find(p=>p.id==='mg').units.infantry=100;fortified.provinces.find(p=>p.id==='mg').fort=3;
 issueOrder(fortified,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:200});tick(fortified,2);
 assert.equal(fortified.provinces.find(p=>p.id==='mg').ownerId,'mg');
});

test('cancelamento de obra por mudança de dono não fortifica o conquistador',()=>{
 const g=game();const mg=g.provinces.find(p=>p.id==='mg');
 issueOrder(g,t('b'),{type:'fort',provinceId:'mg'});
 g.provinces.find(p=>p.id==='sp').troops=500;g.provinces.find(p=>p.id==='sp').units.infantry=500;mg.troops=10;mg.units.infantry=10;
 issueOrder(g,t('a'),{type:'move',provinceId:'sp',targetId:'mg',units:300});
 tick(g,3);
 assert.equal(mg.ownerId,'sp');assert.equal(mg.fort,0);
});
