import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, MAP, FACTIONS, joinGame, issueOrder, advanceTick, publicState, playerFromToken, migrateGame, diplomaticAction } from '../src/engine.mjs';

const token = c => c.repeat(40);
const join = (g, uf, letter='a') => joinGame(g, 'Comandante ' + letter.toUpperCase(), uf, token(letter));
const province = (g,id) => g.provinces.find(p=>p.id===id);

test('Brasil: 27 UFs incluindo DF, 27 comandos e geometria estadual', () => {
 assert.equal(MAP.length,27);
 assert.equal(FACTIONS.length,27);
 assert.equal(new Set(MAP.map(p=>p.sigla)).size,27);
 assert.equal(new Set(MAP.map(p=>p.region)).size,5);
 for(const p of MAP){
  assert.equal(p.id, p.sigla.toLowerCase());
  assert.equal(p.ownerId,p.id);
  assert.ok(/^M\d/.test(p.path),p.id);
  assert.ok(Number.isInteger(p.x)&&Number.isInteger(p.y));
  assert.ok(p.neighbors.length,p.id);
  for(const nb of p.neighbors){
   const other=MAP.find(x=>x.id===nb);
   assert.ok(other,`${p.id}->${nb} desconhecido`);
   assert.ok(other.neighbors.includes(p.id),`${p.id} e ${nb} não simétricos`);
  }
 }
 assert.deepEqual(MAP.find(p=>p.id==='df').neighbors,['go']);
 assert.deepEqual(MAP.find(p=>p.id==='rs').neighbors,['sc']);
});

test('uma sessão por estado e sessão validada no servidor', () => {
 const g=createGame();join(g,'sp');
 assert.equal(g.version,10);
 assert.throws(()=>joinGame(g,'Invasor','sp',token('b')),/ocupado/);
 assert.throws(()=>joinGame(g,'I','mg',token('c')),/Nome/);
 assert.throws(()=>joinGame(g,'Comandante B','aurora',token('b')),/Estado inválido/);
 assert.equal(playerFromToken(g,token('a')).nationId,'sp');
 assert.equal(playerFromToken(g,'fake'),null);
});

test('proíbe ordens em estados de outros jogadores', () => {
 const g=createGame();join(g,'sp');
 assert.throws(()=>issueOrder(g,token('a'),{type:'recruit',provinceId:'mg'}),/não controla/);
 assert.throws(()=>issueOrder(g,'bad',{type:'recruit',provinceId:'sp'}),/autorizada/);
});

test('movimentação limitada a estados fronteiriços e guarnição mínima', () => {
 const g=createGame();join(g,'sp');const origin=province(g,'sp');const n=origin.troops;
 assert.throws(()=>issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'am',units:20}),/vizinha/);
 assert.throws(()=>issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',units:n}),/Tropas inválidas/);
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',units:20});
 assert.equal(origin.troops,n-20);
 assert.equal(g.orders[0].finishTick,2);
 advanceTick(g);assert.equal(g.orders.length,1);
 advanceTick(g);assert.equal(g.orders.length,0);
});

test('recrutamento desconta materiais e completa em dois turnos', () => {
 const g=createGame();join(g,'ms');const p=province(g,'ms');const before=p.troops;
 issueOrder(g,token('a'),{type:'recruit',provinceId:'ms'});
 assert.equal(g.nations.ms.resources.credits,1320);
 assert.throws(()=>issueOrder(g,token('a'),{type:'recruit',provinceId:'ms'}),/Já existe/);
 advanceTick(g);assert.equal(p.troops,before);
 advanceTick(g);assert.equal(p.troops,before+30);
});

test('indústria aumenta produção e respeita nível máximo', () => {
 const g=createGame();join(g,'df');const p=province(g,'df');p.industry=3;
 issueOrder(g,token('a'),{type:'industry',provinceId:'df'});
 for(let i=0;i<4;i++)advanceTick(g);
 assert.equal(p.industry,4);
 assert.throws(()=>issueOrder(g,token('a'),{type:'industry',provinceId:'df'}),/máximo/);
});

test('batalha conquista UF vizinha e muda dono no mapa', () => {
 const g=createGame();join(g,'sp');const origin=province(g,'sp'),target=province(g,'mg');
 origin.units.infantry=400;origin.troops=400;target.units.infantry=20;target.troops=20;
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',units:300});
 advanceTick(g);advanceTick(g);
 assert.equal(target.ownerId,'sp');
 assert.ok(target.troops>0&&target.troops<300);
 assert.ok(g.events.some(e=>e.type==='battle'&&e.message.includes('conquistou')));
});

test('defesa superior repele ataque', () => {
 const g=createGame();join(g,'sp');const target=province(g,'mg');target.units.infantry=1000;target.troops=1000;
 issueOrder(g,token('a'),{type:'move',provinceId:'sp',targetId:'mg',units:10});
 advanceTick(g);advanceTick(g);
 assert.equal(target.ownerId,'mg');assert.ok(target.troops<1000);
});

test('estado público oculta tokens e inventário dos adversários', () => {
 const g=createGame();join(g,'sp');join(g,'mg','b');
 const s=publicState(g,token('a'));
 assert.equal(s.me.nationId,'sp');assert.equal(s.provinces.length,27);
 assert.ok(!('nations' in s));
 assert.equal(JSON.stringify(s).includes(token('a')),false);
 assert.equal(JSON.stringify(s).includes(token('b')),false);
 assert.equal(publicState(g,'bad').me,null);
});

test('mapa: 27 estados brasileiros apenas, sem oceanos estrangeiros ou países genéricos', () => {
 assert.ok(FACTIONS.every(f=>MAP.some(p=>p.id===f.id)));
 assert.ok(MAP.some(p=>p.name==='Mato Grosso do Sul'));
 assert.ok(!MAP.some(p=>p.id==='aurora'));
});
