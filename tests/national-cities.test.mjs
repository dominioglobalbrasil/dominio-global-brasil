import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createGame,migrateGame,createSectors,MAP,CITY_CATALOG,CITY_ROLES,joinGame,issueOrder,advanceTick,publicState,urbanSupplyConnected} from '../src/engine.mjs';
const tok='city-v011-'+('k'.repeat(50));
const city=(g,id)=>g.sectors.find(s=>s.id===id);
const province=(g,id)=>g.provinces.find(p=>p.id===id);

test('v0.11 tem exatamente 171 localidades reais, com 27 capitais e 27 UFs',()=>{
 const g=createGame();
 assert.equal(g.version,10);assert.equal(g.sectors.length,171);
 assert.equal(new Set(g.sectors.map(c=>c.id)).size,171);
 assert.equal(new Set(g.sectors.map(c=>c.catalogId)).size,171);
 assert.equal(g.sectors.filter(c=>c.kind==='capital').length,27);
 assert.equal(new Set(g.sectors.map(c=>c.provinceId)).size,27);
 assert.equal(g.sectors.filter(c=>c.kind==='hub').length,27);
 assert.equal(g.sectors.filter(c=>c.kind==='city').length,117);
 assert.equal(city(g,'sp-hub').name,'Campinas');
 assert.equal(city(g,'ms-capital').name,'Campo Grande');
 assert.ok(g.sectors.some(c=>c.name==='Três Lagoas' && c.provinceId==='ms'));
 assert.equal(g.sectors.filter(c=>c.provinceId==='df').length,4);
 assert.equal(CITY_CATALOG.filter(c=>c.capital).length,27);
});

test('v0.11 todas as cidades têm função válida e coordenadas projetadas',()=>{
 const g=createGame();
 for(const c of g.sectors){
  assert.ok(CITY_ROLES[c.role],c.name);
  assert.ok(CITY_ROLES[c.secondaryRole],c.name);
  assert.ok(Number.isFinite(c.x)&&Number.isFinite(c.y));
  assert.ok(c.lon>=-75&&c.lon<=-33);
  assert.ok(c.lat>=-34&&c.lat<=6);
  assert.ok(['centroide_municipio','indicativo'].includes(c.positionPrecision));
 }
});

test('rotas estratégicas de todas as UFs são conexas, simétricas e locais',()=>{
 const g=createGame();const byId=new Map(g.sectors.map(c=>[c.id,c]));
 for(const p of g.provinces){
  const nodes=g.sectors.filter(c=>c.provinceId===p.id);
  const seen=new Set([nodes[0].id]),stack=[nodes[0].id];
  while(stack.length){const cur=byId.get(stack.pop());
   for(const to of cur.routeIds){
    const dest=byId.get(to);
    assert.equal(dest.provinceId,p.id);
    assert.ok(dest.routeIds.includes(cur.id),'rota reversa ausente');
    if(!seen.has(to)){seen.add(to);stack.push(to);}
   }
  }
  assert.equal(seen.size,nodes.length,`UF ${p.id} com rotas desconectadas`);
 }
});

test('migração preserva os 54 IDs legados, tropas, conquistas, ordens e contratos',()=>{
 const original=createGame();joinGame(original,'Jogador SP','sp',tok);
 city(original,'mg-capital').ownerId='sp';
 city(original,'mg-capital').units.infantry=28;city(original,'mg-capital').troops=28;
 city(original,'mg-hub').fortLevel=2;city(original,'mg-hub').supply=45;
 issueOrder(original,tok,{type:'sector_reinforce',provinceId:'sp',sectorId:'sp-capital',composition:{infantry:10}});
 const historic=structuredClone(original);historic.version=8;historic.sectors=historic.sectors.filter(c=>c.kind!=='city');
 assert.equal(historic.sectors.length,54);
 const result=migrateGame(historic);
 assert.equal(result.sectors.length,171);assert.equal(result.version,10);
 assert.equal(city(result,'mg-capital').ownerId,'sp');assert.equal(city(result,'mg-capital').units.infantry,28);
 assert.equal(city(result,'mg-hub').name,'Uberlândia');assert.equal(city(result,'mg-hub').supply,45);
 assert.equal(city(result,'mg-hub').fortLevel,2);
 assert.equal(result.orders[0].sectorId,'sp-capital');
 assert.equal(result.players[tok].nationId,'sp');
 const before=JSON.stringify(result.sectors.map(c=>[c.id,c.ownerId,c.troops]));
 migrateGame(result);assert.equal(before,JSON.stringify(result.sectors.map(c=>[c.id,c.ownerId,c.troops])));
});

test('cidades produzem para o controlador, inclusive separadas do estado',()=>{
 const baseline=createGame(),captured=createGame();
 const c=city(captured,'mg-divinopolis');
 assert.ok(c && c.ownerId==='mg');c.ownerId='sp';
 const original0={...baseline.nations.sp.resources},original1={...captured.nations.sp.resources};
 advanceTick(baseline);advanceTick(captured);
 const extra=captured.nations.sp.resources.credits-original1.credits-(baseline.nations.sp.resources.credits-original0.credits);
 assert.ok(extra>0,`créditos adicionais = ${extra}`);
 assert.equal(captured.provinces.find(p=>p.id==='mg').ownerId,'mg');
 assert.equal(city(captured,'mg-capital').ownerId,'mg');
});

test('tropas e suprimentos de cidade inimiga não são divulgados no endpoint',()=>{
 const g=createGame();joinGame(g,'Jogador SP','sp',tok);
 const enemy=city(g,'mg-capital');enemy.units.infantry=42;enemy.troops=42;enemy.supply=36;
 const visible=publicState(g,tok);
 assert.equal(visible.sectors.length,171);
 assert.equal(visible.strategicCityCount,171);
 assert.equal(visible.sectors.find(c=>c.id==='mg-capital').units,null);
 assert.equal(visible.sectors.find(c=>c.id==='mg-capital').supply,null);
 assert.ok(!JSON.stringify(visible).includes(tok));
});

test('o mapa nacional não carrega os polígonos de milhares de municípios',()=>{
 const cityPoints=statSync(new URL('../src/city_points.json',import.meta.url)).size;
 assert.ok(cityPoints<25000,`arquivo de pontos maior que o necessário: ${cityPoints}`);
 const client=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 assert.ok(client.includes('c.provinceId===selectedProvince'));
 assert.ok(client.includes('zoom>=1.5'));
 assert.ok(!client.includes('fetch(\'/data/municipios-ms.json\')'));
});

test('ocupação real de uma nova cidade não transfere capital nem estado vizinho',()=>{
 const g=createGame();joinGame(g,'Governo SP','sp',tok);
 const origin=province(g,'sp');origin.units.infantry=220;origin.troops=220;
 const target=city(g,'mg-divinopolis');assert.ok(target&&target.kind==='city');
 const order=issueOrder(g,tok,{type:'sector_assault',provinceId:'sp',sectorId:target.id,composition:{infantry:95}});
 assert.equal(order.sectorId,target.id);
 advanceTick(g);advanceTick(g);
 assert.equal(target.ownerId,'sp');
 assert.ok(target.units.infantry>0);
 assert.equal(province(g,'mg').ownerId,'mg');
 assert.equal(city(g,'mg-capital').ownerId,'mg');
 assert.equal(g.phase,'running');
});

test('cidades ocupadas e isoladas não produzem abastecimento espontaneamente',()=>{
 const g=createGame();
 const a=city(g,'am-capital'),b=city(g,'am-hub');
 a.ownerId='sp';b.ownerId='sp';
 a.supply=45;b.supply=45;
 assert.equal(g.provinces.find(p=>p.id==='am').ownerId,'am');
 // Os estados vizinhos de AM não pertencem a SP. Ter duas cidades próprias
 // na mesma região não é uma fonte infinita de suprimentos.
 assert.ok(!g.provinces.find(p=>p.id==='am').neighbors.some(id=>province(g,id).ownerId==='sp'));
 assert.equal(urbanSupplyConnected(g,a.id),false);
 advanceTick(g);
 assert.equal(a.supply,41);
 assert.equal(b.supply,41);
});
