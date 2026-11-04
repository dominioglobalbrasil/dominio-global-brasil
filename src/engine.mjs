import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const MAP = JSON.parse(readFileSync(join(HERE, 'map.json'), 'utf8'));
export const CITY_CATALOG = JSON.parse(readFileSync(join(HERE, 'catalogo_cidades.json'), 'utf8')).localidades;
const CITY_POINTS = JSON.parse(readFileSync(join(HERE, 'city_points.json'), 'utf8'));
export const CITY_ROLES = Object.freeze({
 CAP:{credits:4,food:1}, LOG:{credits:3,fuel:1}, FRO:{credits:2,fuel:1},
 AGR:{food:5,credits:1}, POR:{credits:5,fuel:1}, IND:{steel:3,credits:2},
 ENE:{energy:4,fuel:2}, REG:{credits:3,food:2}, MIN:{steel:4,credits:1},
 TEC:{energy:2,steel:2,credits:2},
});
const REGION_PALETTE = {
  'Norte': 197,
  'Nordeste': 36,
  'Centro-Oeste': 266,
  'Sudeste': 345,
  'Sul': 146,
};
const grouped = new Map();
export const FACTIONS = MAP.map((state) => {
  const count = grouped.get(state.region) || 0;
  grouped.set(state.region, count + 1);
  const hue = REGION_PALETTE[state.region] + count * 5;
  return {
    id: state.id,
    name: state.name,
    short: state.sigla,
    region: state.region,
    color: `hsl(${hue} 67% 56%)`,
    flag: state.sigla,
    description: `Comando estadual de ${state.name}. Campanha fictícia ambientada no Brasil.`,
  };
});

// Cadastro nacional curado: 171 cidades em 27 UFs. Centros legados mantêm IDs
// *-capital e *-hub para não quebrar ordens e salvamentos da v0.9/v0.10.
export const CAPITAL_NAMES = Object.freeze(Object.fromEntries(CITY_CATALOG.filter(c=>c.capital).map(c=>[c.uf.toLowerCase(),c.nome])));
export const SECTOR_TYPES = Object.freeze({
 capital:{label:'Capital',defense:40,tax:{credits:.22,food:.10}},
 hub:{label:'Polo econômico',defense:26,tax:{credits:.15,steel:.30,energy:.25}},
 city:{label:'Cidade estratégica',defense:18,tax:{}},
});
const catalogByState = Object.groupBy(CITY_CATALOG,c=>c.uf.toLowerCase());
function distanceBetweenCities(a,b){const dx=(a.x-b.x),dy=a.y-b.y;return Math.hypot(dx,dy);}
export function createSectors(provinces){
 const all=[];
 for(const p of provinces){
   const cities=catalogByState[p.id]||[];
   if(!cities.length)throw new Error(`UF sem cidades no catálogo: ${p.id}`);
   const hub=cities.find(c=>!c.capital); // cidade real que assume o antigo polo fictício
   const byCity=cities.map(c=>{
     const pos=CITY_POINTS[c.id];if(!pos)throw new Error(`Localidade sem coordenadas: ${c.id}`);
     const kind=c.capital?'capital':c.id===hub.id?'hub':'city';
     return {id:kind==='capital'?p.id+'-capital':kind==='hub'?p.id+'-hub':c.id,
       catalogId:c.id,provinceId:p.id,kind,name:c.nome,
       role:c.funcao_principal,secondaryRole:c.funcao_secundaria,geographicType:c.tipo_geografico,
       ownerId:p.ownerId,x:pos.x,y:pos.y,lon:pos.lon,lat:pos.lat,positionPrecision:pos.precision,
       units:EMPTY_UNITS(),troops:0,supply:100,fortLevel:0,routeIds:[],
     };
   });
   // Grafo esparso de rotas abstratas: árvore mínima de proximidade + 1 conexão local.
   // Não corresponde a estradas existentes, serve ao balanceamento da campanha.
   const seen=new Set([byCity[0].id]);
   while(seen.size<byCity.length){
     let best=null;
     for(const a of byCity)if(seen.has(a.id))for(const b of byCity)if(!seen.has(b.id)){
       const d=distanceBetweenCities(a,b);
       if(!best||d<best.d)best={a,b,d};
     }
     if(!best)break;
     best.a.routeIds.push(best.b.id);best.b.routeIds.push(best.a.id);seen.add(best.b.id);
   }
   for(const c of byCity){
     const other=byCity.filter(q=>q.id!==c.id&&!c.routeIds.includes(q.id))
       .sort((a,b)=>distanceBetweenCities(c,a)-distanceBetweenCities(c,b))[0];
     if(other && distanceBetweenCities(c,other)<110){c.routeIds.push(other.id);other.routeIds.push(c.id);}
     c.routeIds=[...new Set(c.routeIds)];
   }
   all.push(...byCity);
 }
 if(all.length!==171||new Set(all.map(c=>c.id)).size!==171)throw new Error('Catálogo estratégico duplicado ou incompleto.');
 return all;
}

export const URBAN_ACTIONS = Object.freeze({siege:{ticks:4,cost:{food:18,fuel:12}},supply:{ticks:2,cost:{credits:75,food:40,fuel:12}},fortify:{ticks:3,cost:{credits:180,steel:45,energy:15}},blockade:{ticks:1,duration:6,cost:{credits:110,fuel:22,energy:12}},relieve:{ticks:2,infantry:15,cost:{credits:140,food:35,steel:15}}});
const RESOURCE_START = { credits: 1500, steel: 230, fuel: 190, food: 210, energy: 130 };
// Quantidades de cada lote e custo por ordem. Valores são de balanceamento do jogo, não dados militares reais.
export const UNIT_TYPES = Object.freeze({
  infantry: { name: 'Infantaria', short: 'INF', batch: 30, buildTicks: 2, attack: 1, defense: 1.15, speed: 2, cost: { credits: 180, steel: 35, food: 12 }, description: 'Ocupa territórios e mantém a guarnição.' },
  armor: { name: 'Blindados', short: 'BLD', batch: 5, buildTicks: 4, attack: 8, defense: 6, speed: 3, cost: { credits: 370, steel: 100, fuel: 45 }, description: 'Alta força de choque em terrenos planos.' },
  artillery: { name: 'Artilharia', short: 'ART', batch: 4, buildTicks: 3, attack: 5.5, defense: 2.5, speed: 3, cost: { credits: 310, steel: 80, fuel: 20 }, description: 'Apoio de fogo poderoso em ataques combinados.' },
  aircraft: { name: 'Aviação', short: 'AER', batch: 2, buildTicks: 5, attack: 16, defense: 7.5, speed: 1, cost: { credits: 490, steel: 65, fuel: 100, energy: 35 }, description: 'Alta mobilidade e ataque, com custo logístico elevado.' },
  drones: { name: 'Drones', short: 'DRN', batch: 8, buildTicks: 3, attack: 2.2, defense: 1.4, speed: 1, cost: { credits: 240, steel: 45, fuel: 24, energy: 20 }, description: 'Reconhecimento e vantagem tática no combate.' },
});
const UNIT_IDS = Object.keys(UNIT_TYPES);
const EMPTY_UNITS = () => Object.fromEntries(UNIT_IDS.map(k => [k, 0]));
const withInfantry = count => ({ ...EMPTY_UNITS(), infantry: count });
const PRICES = { recruit: UNIT_TYPES.infantry.cost, industry: { credits: 400, steel: 85, energy: 25 }, fort: { credits: 260, steel: 60, energy: 20 }, base: { credits: 480, steel: 110, energy: 40 }, airfield: { credits: 520, steel: 125, energy: 50 }, battery: { credits: 370, steel: 95, fuel: 28 }, recon: { fuel: 12, energy: 8 } };
export const SUPPORT_FACILITIES = Object.freeze({airfield:{name:'Aeródromo militar',max:2,buildTicks:4,cost:PRICES.airfield},battery:{name:'Bateria de artilharia',max:2,buildTicks:3,cost:PRICES.battery}});
export const SUPPORT_MISSIONS = Object.freeze({airstrike:{name:'Missão aérea',min:2,max:12,ticks:2,cost:{fuel:32,energy:18},perUnit:{fuel:8}},barrage:{name:'Bombardeio de artilharia',min:4,max:24,ticks:1,cost:{steel:22,fuel:12},perUnit:{steel:2}}});
export const BASE_COST = PRICES.base;
export const RECON_COST = PRICES.recon;
const armyTotal = army => UNIT_IDS.reduce((n, k) => n + (army[k] || 0), 0);
const syncTroops = p => { p.troops = armyTotal(p.units); return p.troops; };
const validArmy = (composition, allowEmpty=false) => isObj(composition)
  && Object.keys(composition).every(k=>UNIT_IDS.includes(k))
  && UNIT_IDS.every(k=>composition[k]===undefined || okInt(composition[k],0,100000))
  && (allowEmpty || armyTotal(composition)>0);
const normalizeArmy = composition => Object.fromEntries(UNIT_IDS.map(k => [k,composition[k] || 0]));
const travelTime = army => Math.max(...UNIT_IDS.filter(k=>army[k]>0).map(k=>UNIT_TYPES[k].speed));
const needsFor = army => ({
  food: Math.ceil((army.infantry || 0)/45),
  fuel: Math.ceil((army.armor || 0)/4) + Math.ceil((army.artillery || 0)/5) + 2*Math.ceil((army.aircraft || 0)/2) + Math.ceil((army.drones || 0)/8),
  energy: Math.ceil((army.aircraft || 0)/2) + Math.ceil((army.drones || 0)/8),
});
function sumArmies(items) {
  const total=EMPTY_UNITS();for(const units of items)for(const k of UNIT_IDS)total[k]+=units[k] || 0;return total;
}
function armyPower(army, mode, terrain, supply=100) {
  let power=UNIT_IDS.reduce((n,k)=>n+(army[k]||0)*UNIT_TYPES[k][mode],0);
  if(terrain==='montanha') power *= mode==='attack' ? .78 : 1.12;
  if(terrain==='floresta') power *= mode==='attack' ? .85 : 1.08;
  if(terrain==='planície' && (army.armor || 0)>0) power *= mode==='attack'?1.13:1.04;
  // Sinergia de armas combinadas, limitada a 20%.
  const diversity=UNIT_IDS.filter(k=>army[k]>0).length;
  power *= 1 + Math.min(.20,Math.max(0,diversity-1)*.05);
  if((army.drones||0)>0 && mode==='attack') power *= 1.06;
  return power * (0.55 + .45 * Math.max(0,Math.min(100,supply))/100);
}
function applyLosses(army, fraction, minimum=0) {
  const result=normalizeArmy(army);
  for(const k of UNIT_IDS)result[k]=Math.max(0,Math.floor(result[k]*(1-Math.max(0,Math.min(.95,fraction)))));
  if(minimum && armyTotal(result)===0) {
    const type=UNIT_IDS.find(k=>army[k]>0);
    if(type)result[type]=minimum;
  }
  return result;
}
function addArmy(province, army) { for(const k of UNIT_IDS) province.units[k] += army[k] || 0; syncTroops(province); }
function subtractArmy(province, army) { for(const k of UNIT_IDS) province.units[k] -= army[k] || 0; syncTroops(province); }
const PEACE_DURATION = 10;
const OFFER_DURATION = 12;
const NATION_IDS = new Set(FACTIONS.map((f) => f.id));
const okInt = (value, minimum, maximum) => Number.isInteger(value) && value >= minimum && value <= maximum;
const isObj = (value) => value && typeof value === 'object' && !Array.isArray(value);

export function createGame() {
  return {
    version: 10,
    tick: 0,
    phase: 'running',
    startedAt: new Date().toISOString(),
    nextOrderId: 1,
    nations: Object.fromEntries(FACTIONS.map((f) => [f.id, { ...f, resources: { ...RESOURCE_START }, supply: 100, upkeep: { food: 0, fuel: 0, energy: 0 } }])),
    provinces: MAP.map((p) => ({
      ...p,
      units: withInfantry(120),
      troops: 120,
      supply: 100,
      industry: 1,
      fort: 0,
      base: 0,
      airfield: 0,
      battery: 0,
      supplyDistance: 0,
      morale: 100,
    })),
    sectors: createSectors(MAP),
    players: {},
    intelligence: {},
    blockades: [],
    diplomacy: { wars: {}, truces: {}, proposals: [], nextProposalId: 1 },
    orders: [],
    events: [{ id: 1, tick: 0, type: 'world', message: 'Cenário alternativo: as 27 unidades federativas disputam o controle do Brasil.' }],
  };
}

export function joinGame(game, name, nationId, token) {
  if (game.phase !== 'running') throw new Error('A partida já terminou.');
  const cleanName = typeof name === 'string' ? name.trim().replace(/[<>]/g, '') : '';
  if (cleanName.length < 2 || cleanName.length > 24) throw new Error('Nome deve ter entre 2 e 24 caracteres.');
  if (!NATION_IDS.has(nationId)) throw new Error('Estado inválido.');
  if (Object.values(game.players).some((player) => player.nationId === nationId)) throw new Error('Este estado já está ocupado.');
  if (typeof token !== 'string' || token.length < 20) throw new Error('Token inválido.');
  if (game.players[token]) throw new Error('Sessão já utilizada.');
  const player = { name: cleanName, nationId, joinedTick: game.tick };
  game.players[token] = player;
  event(game, 'join', `${player.name} assumiu o comando de ${game.nations[nationId].name}.`);
  return player;
}

// Migra campanhas anteriores sem perder jogadores, tropas, recursos, ordens ou diplomacia.
export function migrateGame(game) {
  if (!game || ![2, 3, 4, 5, 6, 7, 8, 9, 10].includes(game.version)) throw new Error('Campanha incompatível.');
  if (game.version === 2) game.diplomacy = { wars: {}, truces: {}, proposals: [], nextProposalId: 1 };
  if (!game.diplomacy) throw new Error('Dados diplomáticos ausentes na campanha.');
  if (game.version < 4) {
    for(const p of game.provinces) {
      p.units = withInfantry(p.troops);
      p.supply = 100;
    }
    for(const n of Object.values(game.nations)) {
      n.supply = 100;
      n.upkeep = { food: 0, fuel: 0, energy: 0 };
    }
    for(const o of game.orders) {
      if(o.type==='move') o.composition=withInfantry(o.units);
      if(o.type==='recruit') o.unitType='infantry';
    }
    game.version = 4;
  }
  if(game.version < 5){
    for (const p of game.provinces) { p.base=0; p.supplyDistance=0; }
    game.intelligence={};
    game.version=5;
  }
  if (game.version < 6) {
    for (const p of game.provinces) { p.airfield=0; p.battery=0; }
    game.version=6;
  }
  if(game.version<7) {
    // Migrar preserva todos os exércitos estaduais; pontos novos começam sem
    // guarnição física e com defesa urbana abstrata.
    game.sectors=createSectors(game.provinces);
    game.version=7;
  }
  if(game.version<8) {
    for(const c of game.sectors){c.supply=100;c.fortLevel=0;}
    game.version=8;
  }
  if(game.version<9){
    // Os 54 centros legados são preservados em suas chaves, incluindo as unidades,
    // cercos, fortificações, controle e suprimentos. Não recriamos ordens.
    const former=new Map((game.sectors||[]).map(c=>[c.id,c]));
    const expanded=createSectors(game.provinces);
    for(const c of expanded){
      const old=former.get(c.id);
      if(old)Object.assign(c,{ownerId:old.ownerId,units:old.units,troops:old.troops,supply:old.supply,fortLevel:old.fortLevel});
    }
    game.sectors=expanded;
    game.version=9;
  }
  if(game.version<10){game.blockades=[];game.version=10;}
  if(!Array.isArray(game.blockades))game.blockades=[];
  if(!Array.isArray(game.sectors) || game.sectors.length!==171)throw new Error('Pontos estratégicos da campanha inválidos.');
  // Rotas e perfis são dados de design, não salvamentos editáveis do jogador.
  const master=new Map(createSectors(game.provinces).map(c=>[c.id,c]));
  for(const c of game.sectors){
    const meta=master.get(c.id);
    if(!meta)throw new Error('Centro estratégico desconhecido no salvamento.');
    for(const key of ['catalogId','name','kind','role','secondaryRole','geographicType','x','y','lon','lat','routeIds','positionPrecision'])c[key]=meta[key];
  }
  for(const s of game.sectors){
    if(!s.units)s.units=EMPTY_UNITS();
    s.units=normalizeArmy(s.units);syncTroops(s);
    if(!okInt(s.supply,0,100))s.supply=100;
    if(!okInt(s.fortLevel,0,3))s.fortLevel=0;
  }
  if(!isObj(game.intelligence))game.intelligence={};
  // Defensivo para campanhas de versões anteriores e v5 preliminares.
  for(const p of game.provinces) {
    if(!p.units) p.units=withInfantry(p.troops || 0);
    p.units=normalizeArmy(p.units);
    syncTroops(p);
    if(!Number.isFinite(p.supply))p.supply=100;
    if(!okInt(p.base,0,3))p.base=0;
    if(!okInt(p.airfield,0,2))p.airfield=0;
    if(!okInt(p.battery,0,2))p.battery=0;
    if(p.supplyDistance!==null&&!okInt(p.supplyDistance,0,50))p.supplyDistance=0;
  }
  for(const o of game.orders) if(o.type==='move'&&!o.composition)o.composition=withInfantry(o.units);
  for(const n of Object.values(game.nations)) {
    if(!Number.isFinite(n.supply))n.supply=100;
    if(!n.upkeep)n.upkeep={food:0,fuel:0,energy:0};
  }
  return game;
}

function pair(a, b) { return [a, b].sort().join(':'); }
function relationship(game, a, b) {
  if (a === b) return 'same';
  const key = pair(a, b);
  if ((game.diplomacy.truces[key] ?? 0) > game.tick) return 'truce';
  return game.diplomacy.wars[key] ? 'war' : 'neutral';
}
function playerControls(game, nationId) {
  return Object.values(game.players).some(p => p.nationId === nationId);
}
function declareWar(game, from, target) {
  const state = relationship(game, from, target);
  if (state === 'same') throw new Error('Não é possível declarar guerra contra si mesmo.');
  if (state === 'truce') throw new Error('Há um cessar-fogo vigente. Aguarde o prazo terminar.');
  if (state === 'war') throw new Error('Estas nações já estão em guerra.');
  game.diplomacy.wars[pair(from, target)] = true;
  game.diplomacy.proposals = game.diplomacy.proposals.filter(p => pair(p.from,p.to)!==pair(from,target));
  event(game, 'diplomacy', `${game.nations[from].short} declarou guerra contra ${game.nations[target].short}.`);
}

export function diplomaticAction(game, token, input) {
  const player = playerFromToken(game, token);
  if (!player) throw new Error('Sessão não autorizada.');
  if (game.phase !== 'running') throw new Error('A campanha terminou.');
  if (!isObj(input)) throw new Error('Ação diplomática inválida.');
  const from = player.nationId;
  const { type, targetId, proposalId } = input;
  if (type === 'declare_war') {
    if (!NATION_IDS.has(targetId)) throw new Error('Estado inválido.');
    declareWar(game, from, targetId);
    return { status: 'war', targetId };
  }
  if (type === 'offer_peace') {
    if (!NATION_IDS.has(targetId) || targetId===from) throw new Error('Destino inválido.');
    if (relationship(game, from, targetId)!=='war') throw new Error('A paz só pode ser proposta durante uma guerra.');
    if (!playerControls(game, targetId)) throw new Error('A negociação requer um comandante humano no estado destinatário.');
    if (game.diplomacy.proposals.some(p=>p.from===from&&p.to===targetId)) throw new Error('Já há uma proposta pendente para esse estado.');
    const proposal = { id: game.diplomacy.nextProposalId++, from, to: targetId, type:'peace', createdTick:game.tick, expiresTick:game.tick + OFFER_DURATION };
    game.diplomacy.proposals.push(proposal);
    event(game, 'diplomacy', `${game.nations[from].short} enviou uma proposta de paz para ${game.nations[targetId].short}.`);
    return { status: 'pending', id: proposal.id };
  }
  if (type === 'accept_peace' || type === 'reject_peace') {
    if (!okInt(proposalId,1,100000000)) throw new Error('Proposta inválida.');
    const index = game.diplomacy.proposals.findIndex(p=>p.id===proposalId&&p.to===from);
    if (index === -1) throw new Error('Proposta não encontrada para seu comando.');
    const [proposal] = game.diplomacy.proposals.splice(index,1);
    if (type === 'reject_peace') {
      event(game, 'diplomacy', `${game.nations[from].short} recusou a proposta de paz de ${game.nations[proposal.from].short}.`);
      return { status: 'rejected' };
    }
    const key = pair(proposal.from,from);
    delete game.diplomacy.wars[key];
    game.diplomacy.truces[key] = game.tick+PEACE_DURATION;
    game.diplomacy.proposals = game.diplomacy.proposals.filter(p=>pair(p.from,p.to)!==key);
    event(game, 'diplomacy', `${game.nations[from].short} e ${game.nations[proposal.from].short} assinaram cessar-fogo por ${PEACE_DURATION} horas estratégicas.`);
    return { status: 'truce', expiresTick:game.diplomacy.truces[key] };
  }
  throw new Error('Ação diplomática desconhecida.');
}

export function playerFromToken(game, token) {
  if (typeof token !== 'string') return null;
  return game.players[token] || null;
}

function event(game, type, message) {
  game.events.unshift({ id: (game.events[0]?.id || 0) + 1, tick: game.tick, type, message });
  game.events = game.events.slice(0, 70);
}

function getProvince(game, id) { return game.provinces.find((p) => p.id === id); }
function getSector(game,id){return game.sectors.find(s=>s.id===id);}
function routeKey(a,b){return [a,b].sort().join('::');}
export function liveBlockades(game){
 return (game.blockades||[]).filter(b=>b.expiresTick>game.tick &&
  getSector(game,b.sectorId)?.ownerId===b.victimId &&
  relationship(game,b.nationId,b.victimId)==='war');
}
function routeBlocked(game,a,b){return liveBlockades(game).some(v=>routeKey(v.sectorId,v.routeId)===routeKey(a,b));}
function citySieged(game,sectorId){
 const c=getSector(game,sectorId);return !!c&&game.orders.some(o=>o.type==='sector_siege'&&o.sectorId===sectorId&&
 o.nationId!==c.ownerId&&relationship(game,o.nationId,c.ownerId)==='war');
}
function cityBlockaded(game,sectorId){return liveBlockades(game).some(b=>b.sectorId===sectorId);}

function checkVictory(game,nationId){
 if(game.provinces.every(p=>p.ownerId===nationId)&&game.sectors.every(s=>s.ownerId===nationId)){
  game.phase='finished';game.winnerId=nationId;event(game,'world',`${game.nations[nationId].name} venceu a campanha: estados e centros estratégicos sob controle!`);
 }
}


// Distância abstrata em fronteiras estaduais, inclusive por regiões neutras.
// Não representa rotas aéreas reais: é um parâmetro de tabuleiro para balanceamento.
export function borderDistance(game, originId, targetId) {
  if(originId===targetId)return 0;
  const start=getProvince(game,originId),goal=getProvince(game,targetId);
  if(!start || !goal)return Infinity;
  const seen=new Set([originId]),queue=[[originId,0]];
  for(let i=0;i<queue.length;i++){
    const [id,d]=queue[i],p=getProvince(game,id);
    for(const next of p.neighbors) {
      if(next===targetId)return d+1;
      if(!seen.has(next)){seen.add(next);queue.push([next,d+1]);}
    }
  }
  return Infinity;
}
function missionPrice(kind, count) {
  const spec=SUPPORT_MISSIONS[kind];
  return Object.fromEntries(Object.entries(spec.cost).map(([resource,value])=>[resource,value+(spec.perUnit[resource]||0)*count]));
}
// Distribuição determinística de dano entre classes. Não permite perdas negativas.
function supportDamage(units, budget) {
  const weights={infantry:1,armor:1.1,artillery:1.35,aircraft:.55,drones:.8};
  const total=UNIT_IDS.reduce((n,k)=>n+(units[k]||0)*weights[k],0);
  if(!total || budget<=0)return 0;
  let remaining=Math.min(armyTotal(units),Math.max(0,Math.floor(budget))),lost=0;
  const ranked=UNIT_IDS.map(k=>({k,share:(units[k]||0)*weights[k]/total})).sort((a,b)=>b.share-a.share);
  for(const {k,share} of ranked){const take=Math.min(units[k],Math.floor(remaining*share));units[k]-=take;lost+=take;}
  let rest=remaining-lost;
  for(const {k} of ranked){if(rest<=0)break;const take=Math.min(units[k],rest);units[k]-=take;lost+=take;rest-=take;}
  return lost;
}
function pay(nation, price) {
  if (Object.keys(price).some((k) => (nation.resources[k] ?? 0) < price[k])) throw new Error('Recursos insuficientes para esta ordem.');
  for (const [k, v] of Object.entries(price)) nation.resources[k] -= v;
}

export function issueOrder(game, token, input) {
  const player = playerFromToken(game, token);
  if (!player) throw new Error('Sessão não autorizada.');
  if (game.phase !== 'running') throw new Error('A partida já terminou.');
  if (!isObj(input)) throw new Error('Ordem inválida.');
  const { type, provinceId, targetId, sectorId, routeId, units, composition, unitType, unitCount } = input;
  const province = getProvince(game, provinceId);
  if (!province || province.ownerId !== player.nationId) throw new Error('Você não controla esta província.');
  const nation = game.nations[player.nationId];
  const order = { id: game.nextOrderId, type, nationId: player.nationId, provinceId, createdTick: game.tick };
  if(['sector_assault','sector_siege','sector_reinforce','sector_withdraw'].includes(type)) {
    const sector=getSector(game,sectorId),sectorProvince=sector&&getProvince(game,sector.provinceId);
    if(!sector || !sectorProvince || !(sectorProvince.id===province.id || province.neighbors.includes(sectorProvince.id)))throw new Error('Centro estratégico fora do alcance terrestre: use estado próprio ou vizinho.');
    const isSiege=type==='sector_siege';
    const army=normalizeArmy(composition||{});
    if(isSiege && game.orders.some(o=>o.type==='sector_siege'&&o.sectorId===sectorId))throw new Error('Já existe cerco ativo neste centro.');
    if(!validArmy(composition))throw new Error('Selecione uma composição militar válida.');
    order.sectorId=sector.id;order.composition=army;order.finishTick=game.tick+(isSiege?URBAN_ACTIONS.siege.ticks:2);order.supplyAtLaunch=province.supply;
    if(type==='sector_withdraw') {
      if(sector.ownerId!==player.nationId)throw new Error('Você não controla este centro estratégico.');
      if(UNIT_IDS.some(k=>army[k]>sector.units[k]) || armyTotal(army)>=sector.troops)throw new Error('Mantenha pelo menos uma unidade na guarnição do centro.');
      subtractArmy(sector,army);
      event(game,'military',`${nation.short}: retirada de ${armyTotal(army)} unidades de ${sector.name} em direção a ${province.name}.`);
    } else {
      if((type==='sector_assault'||isSiege) && sector.ownerId===player.nationId)throw new Error('Este centro já está sob seu controle.');
      if(type==='sector_reinforce' && sector.ownerId!==player.nationId)throw new Error('Só é possível reforçar centros já controlados.');
      if((type==='sector_assault'||isSiege) && army.infantry<1)throw new Error('Ocupar centros estratégicos exige infantaria.');
      if(UNIT_IDS.some(k=>army[k]>province.units[k]) || armyTotal(army)>=province.troops)throw new Error('Tropas insuficientes. Mantenha ao menos uma unidade na origem.');
      if((type==='sector_assault'||isSiege) && relationship(game,player.nationId,sector.ownerId)==='truce')throw new Error('Cessar-fogo vigente impede o ataque a este centro.');
      if(isSiege)pay(nation,URBAN_ACTIONS.siege.cost);
      subtractArmy(province,army);
      if((type==='sector_assault'||isSiege) && relationship(game,player.nationId,sector.ownerId)==='neutral')declareWar(game,player.nationId,sector.ownerId);
      event(game,'military',`${nation.short}: ${armyTotal(army)} unidades enviadas de ${province.name} para ${sector.name}.`);
    }
  } else if(type==='sector_blockade') {
    const sector=getSector(game,sectorId),neighbor=getSector(game,routeId);
    if(!sector||!neighbor||!sector.routeIds.includes(neighbor.id))throw new Error('Rota urbana inválida: selecione duas cidades diretamente conectadas.');
    const parent=getProvince(game,sector.provinceId);
    if(!(parent.id===province.id||province.neighbors.includes(parent.id)))throw new Error('Rota fora do alcance do seu estado de origem.');
    if(sector.ownerId===player.nationId)throw new Error('Não é possível bloquear sua própria cidade.');
    if(relationship(game,player.nationId,sector.ownerId)==='truce')throw new Error('Cessar-fogo impede bloquear rotas.');
    const key=routeKey(sector.id,neighbor.id);
    if(liveBlockades(game).some(b=>routeKey(b.sectorId,b.routeId)===key)||
       game.orders.some(o=>o.type==='sector_blockade'&&routeKey(o.sectorId,o.routeId)===key))throw new Error('Esta rota já possui bloqueio ativo ou pendente.');
    pay(nation,URBAN_ACTIONS.blockade.cost);
    order.sectorId=sector.id;order.routeId=neighbor.id;order.victimId=sector.ownerId;
    order.finishTick=game.tick+URBAN_ACTIONS.blockade.ticks;
    if(relationship(game,player.nationId,sector.ownerId)==='neutral')declareWar(game,player.nationId,sector.ownerId);
    event(game,'logistics',`${nation.short}: bloqueio solicitado na rota ${sector.name}–${neighbor.name}.`);
  } else if(type==='sector_relieve') {
    const sector=getSector(game,sectorId),parent=sector&&getProvince(game,sector.provinceId);
    if(!sector||sector.ownerId!==player.nationId)throw new Error('Só é possível liberar rotas de cidade sob seu controle.');
    if(!(parent.id===province.id||province.neighbors.includes(parent.id)))throw new Error('Centro fora do alcance de socorro.');
    if(!citySieged(game,sector.id)&&!cityBlockaded(game,sector.id))throw new Error('Cidade sem cerco ou bloqueio ativo.');
    if(game.orders.some(o=>o.type==='sector_relieve'&&o.sectorId===sector.id))throw new Error('Já existe operação de socorro ativa.');
    if(province.units.infantry<=URBAN_ACTIONS.relieve.infantry)throw new Error('São necessárias 15 unidades de infantaria excedentes na origem.');
    pay(nation,URBAN_ACTIONS.relieve.cost);
    order.sectorId=sector.id;order.composition=withInfantry(URBAN_ACTIONS.relieve.infantry);
    order.finishTick=game.tick+URBAN_ACTIONS.relieve.ticks;
    subtractArmy(province,order.composition);
    event(game,'military',`${nation.short}: força de socorro enviada à cidade de ${sector.name}.`);
  } else if(type==='sector_supply'||type==='sector_fortify') {
    const sector=getSector(game,sectorId),parent=sector&&getProvince(game,sector.provinceId);
    if(!sector||!parent||sector.ownerId!==player.nationId)throw new Error('Você não controla este centro urbano.');
    if(!(parent.id===province.id||province.neighbors.includes(parent.id)))throw new Error('Centro urbano fora do alcance da origem selecionada.');
    if(type==='sector_supply' && (citySieged(game,sectorId)||cityBlockaded(game,sectorId)))throw new Error('Cidade cercada ou bloqueada: comboio convencional não consegue passar.');
    if(type==='sector_fortify' && sector.fortLevel>=3)throw new Error('Defesa urbana no nível máximo (3).');
    if(game.orders.some(o=>o.type===type&&o.sectorId===sectorId))throw new Error('Já existe uma ordem deste tipo para este centro.');
    const spec=type==='sector_supply'?URBAN_ACTIONS.supply:URBAN_ACTIONS.fortify;
    pay(nation,spec.cost);
    order.sectorId=sector.id;order.finishTick=game.tick+spec.ticks;
    event(game,'logistics',`${nation.short}: ${type==='sector_supply'?'comboio de suprimentos':'melhoria da defesa urbana'} despachado para ${sector.name}.`);
  } else if (type === 'airstrike' || type === 'barrage') {
    const spec=SUPPORT_MISSIONS[type],unitKind=type==='airstrike'?'aircraft':'artillery',facility=type==='airstrike'?'airfield':'battery';
    const destination=getProvince(game,targetId);
    if(!destination || destination.ownerId===player.nationId)throw new Error('A missão exige um território inimigo válido.');
    if(relationship(game,player.nationId,destination.ownerId)!=='war')throw new Error('A missão de apoio exige guerra declarada e não pode violar cessar-fogo.');
    if(province[facility]<1)throw new Error(type==='airstrike'?'Construa um aeródromo militar para lançar a missão.':'Instale uma bateria de artilharia para lançar a missão.');
    const limit=type==='airstrike'?province.airfield+1:1;
    if(borderDistance(game,province.id,destination.id)>limit)throw new Error('Destino fora do alcance operacional desta instalação.');
    if(!okInt(unitCount,spec.min,spec.max))throw new Error(`Quantidade inválida: de ${spec.min} a ${spec.max} unidades por missão.`);
    if(province.units[unitKind]<unitCount)throw new Error('Unidades insuficientes na origem.');
    if(game.orders.some(o=>o.type===type&&o.provinceId===provinceId))throw new Error('Já existe missão desta modalidade em andamento nesta origem.');
    // A força é destacada ao iniciar; impede usar as mesmas unidades em múltiplas missões.
    pay(nation,missionPrice(type,unitCount));
    order.targetId=destination.id;order.unitCount=unitCount;order.finishTick=game.tick+spec.ticks;
    order.supplyAtLaunch=province.supply;order.targetOwnerAtLaunch=destination.ownerId;
    subtractArmy(province,{[unitKind]:unitCount});
    event(game,'military',`${nation.short}: ${spec.name.toLowerCase()} iniciada a partir de ${province.name}.`);
  } else if (type === 'recon') {
    const target=getProvince(game,targetId);
    if(!target || !province.neighbors.includes(target.id) || target.ownerId===player.nationId)throw new Error('Reconhecimento exige estado adversário vizinho.');
    if(province.base<1)throw new Error('Construa uma base militar para lançar o reconhecimento.');
    if(province.units.drones<2)throw new Error('São necessários pelo menos 2 drones na guarnição.');
    if(game.orders.some(o=>o.type==='recon'&&o.nationId===player.nationId&&o.targetId===target.id))throw new Error('Já existe reconhecimento em curso neste destino.');
    pay(nation,PRICES.recon);
    order.targetId=target.id;order.finishTick=game.tick+2;
    event(game,'intelligence',`${nation.short}: uma missão de observação foi despachada.`);
  } else if (type === 'move') {
    const target = getProvince(game, targetId);
    if (!target || !province.neighbors.includes(target.id)) throw new Error('O destino deve ser uma província vizinha.');
    const army = composition === undefined ? withInfantry(units) : composition;
    if (!validArmy(army)) throw new Error('Composição militar inválida. Selecione quantidades inteiras positivas.');
    const normalized = normalizeArmy(army);
    if (UNIT_IDS.some(k => normalized[k] > province.units[k]) || armyTotal(normalized) >= province.troops) {
      throw new Error('Tropas inválidas. Mantenha pelo menos uma unidade na origem.');
    }
    if (target.ownerId !== player.nationId && relationship(game, player.nationId, target.ownerId) === 'truce')
      throw new Error('Cessar-fogo vigente: é proibido atacar este estado.');
    order.targetId=target.id;
    order.composition=normalized;
    order.units=armyTotal(normalized); // Mantido para leitores antigos.
    order.finishTick=game.tick + travelTime(normalized);
    order.supplyAtLaunch=province.supply;
    order.action=target.ownerId===player.nationId?'transfer':'attack';
    subtractArmy(province,normalized);
    if(order.action==='attack'&&relationship(game,player.nationId,target.ownerId)==='neutral')declareWar(game,player.nationId,target.ownerId);
    event(game,'military',`${nation.short}: coluna de ${order.units} unidades saiu de ${province.name} rumo a ${target.name}.`);
  } else if (type==='recruit' || type==='recruit_unit' || type==='industry' || type==='fort' || type==='base' || type==='airfield' || type==='battery') {
    const recruit=type==='recruit'||type==='recruit_unit';
    const kind=recruit?(type==='recruit'?'infantry':unitType):null;
    if(recruit && !Object.hasOwn(UNIT_TYPES,kind))throw new Error('Tipo de unidade militar inválido.');
    const exists=game.orders.some(o => o.provinceId===provinceId &&
      (recruit ? (o.type==='recruit'||o.type==='recruit_unit') && (o.unitType||'infantry')===kind : o.type===type));
    if(exists)throw new Error('Já existe uma ordem deste tipo em andamento aqui.');
    if(type==='industry'&&province.industry>=4)throw new Error('Indústria no nível máximo (4).');
    if(type==='fort'&&province.fort>=3)throw new Error('Fortificação no nível máximo (3).');
    if(type==='base'&&province.base>=3)throw new Error('Base militar no nível máximo (3).');
    if(type==='airfield'&&province.airfield>=2)throw new Error('Aeródromo no nível máximo (2).');
    if(type==='battery'&&province.battery>=2)throw new Error('Bateria de artilharia no nível máximo (2).');
    if(recruit && kind==='aircraft'&&province.industry<2)throw new Error('Aviação requer indústria nível 2 neste estado.');
    const cost = recruit ? UNIT_TYPES[kind].cost : PRICES[type];
    pay(nation,cost);
    if(recruit)order.unitType=kind;
    order.finishTick=game.tick + (recruit ? UNIT_TYPES[kind].buildTicks : type==='fort'||type==='battery'?3:4);
    event(game,'economy',`${nation.short}: ${recruit?'produção de '+UNIT_TYPES[kind].name.toLowerCase():type==='fort'?'fortificação':type==='base'?'base militar':type==='airfield'?'aeródromo militar':type==='battery'?'bateria de artilharia':'expansão industrial'} iniciada em ${province.name}.`);
  } else throw new Error('Tipo de ordem desconhecido.');
  game.nextOrderId+=1;
  game.orders.push(order);
  return order;
}

function returnArmy(game, order, army, reason) {
  const origin=getProvince(game,order.provinceId);
  const fallback=origin?.ownerId===order.nationId?origin:game.provinces.find(p=>p.ownerId===order.nationId);
  if(fallback)addArmy(fallback,army);
  event(game,'military',`${game.nations[order.nationId].short}: ${reason}${fallback?' e retornou a '+fallback.name:'; não havia base de retorno'}.`);
}
function resolveMove(game, order) {
  const target=getProvince(game,order.targetId);
  if(!target)return;
  const nation=game.nations[order.nationId], army=normalizeArmy(order.composition||withInfantry(order.units));
  if(target.ownerId!==order.nationId&&relationship(game,order.nationId,target.ownerId)==='truce') {
    returnArmy(game,order,army,`avanço contra ${target.name} suspenso pelo cessar-fogo; tropas`);
    event(game,'diplomacy',`${nation.short}: avanço contra ${target.name} suspenso pelo cessar-fogo.`);
    return;
  }
  if(target.ownerId!==order.nationId&&relationship(game,order.nationId,target.ownerId)==='neutral')declareWar(game,order.nationId,target.ownerId);
  if(target.ownerId===order.nationId) {
    addArmy(target,army);
    event(game,'military',`${nation.short}: ${order.units} unidades chegaram a ${target.name}.`);
    return;
  }
  const defender=game.nations[target.ownerId], defense=normalizeArmy(target.units);
  const launchSupply=Number.isFinite(order.supplyAtLaunch)?order.supplyAtLaunch:nation.supply;
  const attackPower=armyPower(army,'attack',target.terrain,Math.min(launchSupply,nation.supply));
  const defensePower=armyPower(defense,'defense',target.terrain,target.supply)*(1.15+.18*target.fort+.10*target.base);
  if(attackPower>defensePower) {
    const attackerLoss=Math.min(.86, .14 + .30*defensePower/Math.max(attackPower,1));
    const survivors=applyLosses(army,attackerLoss,1);
    if(survivors.infantry>0) {
      target.ownerId=order.nationId;
      target.units=survivors;
      syncTroops(target);
      target.supply=35;
      target.supplyDistance=null;
      target.base=Math.max(0,target.base-1);
      target.airfield=Math.max(0,target.airfield-1);
      target.battery=Math.max(0,target.battery-1);
      target.morale=60;
      target.fort=Math.max(0,target.fort-1);
      event(game,'battle',`${nation.short} conquistou ${target.name} de ${defender.short}! Sobreviveram ${target.troops} unidades atacantes.`);
      checkVictory(game,order.nationId);
    } else {
      // Blindados, artilharia, drones e aviões podem vencer um confronto, mas não ocupar sozinhos.
      target.units=applyLosses(defense,.85);
      syncTroops(target);
      returnArmy(game,order,survivors,`ataque de apoio em ${target.name} venceu o confronto, sem infantaria para ocupar`);
      event(game,'battle',`${nation.short} venceu confronto em ${target.name}, mas não ocupou: faltou infantaria.`);
    }
  } else {
    const defenseLoss=.05 + .49*attackPower/Math.max(defensePower,1);
    target.units=applyLosses(defense,Math.min(.78,defenseLoss),1);
    syncTroops(target);
    const survivors=applyLosses(army,Math.min(.90,.38+.45*defensePower/Math.max(attackPower+defensePower,1)));
    if(armyTotal(survivors)>0)returnArmy(game,order,survivors,`ataque a ${target.name} repelido; sobreviventes`);
    event(game,'battle',`${defender.short} defendeu ${target.name} contra ${nation.short}.`);
  }
}

function resolveSectorOperation(game,order){
 const sector=getSector(game,order.sectorId),origin=getProvince(game,order.provinceId);
 if(!sector || !origin)return;
 const army=normalizeArmy(order.composition),nation=game.nations[order.nationId];
 if(order.type==='sector_withdraw'){
  if(origin.ownerId===order.nationId)addArmy(origin,army);
  else returnArmy(game,order,army,`retirada de ${sector.name} redirecionada; unidades`);
  event(game,'military',`${nation.short}: transferência de ${sector.name} concluída.`);return;
 }
 if(order.type==='sector_reinforce' && sector.ownerId===order.nationId){
  addArmy(sector,army);event(game,'military',`${nation.short}: guarnição de ${sector.name} reforçada com ${armyTotal(army)} unidades.`);return;
 }
 if(order.type==='sector_reinforce' || sector.ownerId===order.nationId){
  returnArmy(game,order,army,`operação em ${sector.name} cancelada por mudança de controle; tropas`);return;
 }
 if(relationship(game,order.nationId,sector.ownerId)==='truce'){
  returnArmy(game,order,army,`ataque a ${sector.name} suspenso por cessar-fogo; tropas`);return;
 }
 if(relationship(game,order.nationId,sector.ownerId)==='neutral')declareWar(game,order.nationId,sector.ownerId);
 const parent=getProvince(game,sector.provinceId);
 const militia=sector.ownerId===parent.ownerId?SECTOR_TYPES[sector.kind].defense:0;
 const siege=order.type==='sector_siege';
 const attackers=armyPower(army,'attack',parent.terrain,Math.min(order.supplyAtLaunch??100,nation.supply))*(siege?1.14:1);
 const citySupply=(sector.supply??100)/100;
 const defenders=(armyPower(sector.units,'defense',parent.terrain,(sector.ownerId===parent.ownerId?parent.supply:70)*citySupply)+militia*(siege?citySupply:1)*(1+.08*parent.fort))*(1+.16*(sector.fortLevel||0));
 if(attackers>defenders && army.infantry>0){
  const survivors=applyLosses(army,Math.min(.8,.08+.25*defenders/Math.max(attackers,1)),1);
  if(survivors.infantry>0){
   const prior=sector.ownerId;sector.ownerId=order.nationId;sector.units=survivors;sector.supply=45;sector.fortLevel=Math.max(0,(sector.fortLevel||0)-1);syncTroops(sector);
   event(game,'battle',`${nation.short} ocupou ${sector.name} (${parent.sigla}) de ${game.nations[prior].short}. A capital estadual permanece independente da conquista da UF.`);
   checkVictory(game,order.nationId);return;
  }
 }
 // Guarnição defensora pode sofrer perdas, sem criar unidades do nada.
 sector.units=applyLosses(sector.units,Math.min(.65,attackers/Math.max(defenders,1)*.30));syncTroops(sector);
 const survivors=applyLosses(army,Math.min(.9,.18+.33*defenders/Math.max(attackers,1)));
 if(armyTotal(survivors)>0)returnArmy(game,order,survivors,`ataque ao centro ${sector.name} repelido; sobreviventes`);
 event(game,'battle',`${game.nations[sector.ownerId].short} defendeu ${sector.name} contra ${nation.short}.`);
}

function resolveRelief(game,order){
 const c=getSector(game,order.sectorId),origin=getProvince(game,order.provinceId);
 const army=normalizeArmy(order.composition);
 if(!c||c.ownerId!==order.nationId||!origin){returnArmy(game,order,army,'socorro urbano cancelado por mudança de controle; sobreviventes');return;}
 const siegeOrders=game.orders.filter(o=>o.type==='sector_siege'&&o.sectorId===c.id&&o.nationId!==c.ownerId);
 // A força de socorro tem perdas moderadas, e as forças cercantes são dispersadas.
 const survivors=applyLosses(army,siegeOrders.length?.15:.04,1);
 returnArmy(game,order,survivors,`socorro de ${c.name} concluído; tropas`);
 for(const attack of siegeOrders){
   game.orders=game.orders.filter(o=>o.id!==attack.id);
   const remaining=applyLosses(normalizeArmy(attack.composition),.18);
   if(armyTotal(remaining)>0)returnArmy(game,attack,remaining,`cerco de ${c.name} interrompido; tropas`);
 }
 const before=game.blockades.length;
 game.blockades=game.blockades.filter(b=>b.sectorId!==c.id);
 c.supply=Math.min(100,c.supply+20);
 event(game,'logistics',`${game.nations[order.nationId].short}: ${c.name} recebeu socorro. ${siegeOrders.length} cerco(s) e ${before-game.blockades.length} bloqueio(s) rompidos.`);
}

function resolveSupportMission(game,order) {
  const kind=order.type,unitKind=kind==='airstrike'?'aircraft':'artillery';
  const force={[unitKind]:order.unitCount};
  const origin=getProvince(game,order.provinceId),target=getProvince(game,order.targetId);
  const nation=game.nations[order.nationId];
  if(!target || target.ownerId===order.nationId || relationship(game,order.nationId,target.ownerId)!=='war'){
    returnArmy(game,order,force,`${kind==='airstrike'?'voo':'apoio de artilharia'} cancelado por alteração diplomática ou territorial; unidades`);
    return;
  }
  const launch=Number.isFinite(order.supplyAtLaunch)?order.supplyAtLaunch:nation.supply;
  const supply=Math.min(launch,nation.supply);
  const overhead=kind==='airstrike' ? (target.base*9+(target.units.aircraft||0)*2+(target.units.drones||0)*1.5) : target.fort*8+target.battery*6;
  const facilityBonus=kind==='airstrike'?(origin?.ownerId===order.nationId?origin.airfield:0):(origin?.ownerId===order.nationId?origin.battery:0);
  const raw=order.unitCount*(kind==='airstrike'?6:4.5)*(0.55+0.45*supply/100)*(1+facilityBonus*.08);
  const budget=Math.max(1,Math.floor(raw/(1+overhead/60)));
  const lost=supportDamage(target.units,budget);
  syncTroops(target);
  // Nenhuma missão de apoio muda a posse territorial, mesmo que elimine o defensor.
  const defense=kind==='airstrike' ? target.base*2+(target.units.aircraft||0)*2 : target.fort*2+(target.units.artillery||0)*.1;
  const losses=Math.min(order.unitCount-1,Math.floor(defense/14));
  force[unitKind]=order.unitCount-losses;
  returnArmy(game,order,force,`missão de ${kind==='airstrike'?'aviação':'artilharia'} contra ${target.name} encerrada; unidades`);
  if(kind==='barrage' && order.unitCount>=12 && target.fort>0) target.fort-=1;
  event(game,'battle',`${nation.short}: ${kind==='airstrike'?'ataque aéreo':'bombardeio de artilharia'} sobre ${target.name}; ${lost} baixas defensoras${losses?`, ${losses} perdas na força de apoio`:''}. Nenhuma ocupação territorial.`);
}

function supplyNeedsForNation(game,nationId) {
  const armies=game.provinces.filter(p=>p.ownerId===nationId).map(p=>p.units)
    .concat(game.sectors.filter(s=>s.ownerId===nationId).map(s=>s.units))
    .concat(game.orders.filter(o=>o.nationId===nationId&&(['move','airstrike','barrage','sector_assault','sector_siege','sector_reinforce','sector_withdraw'].includes(o.type))).map(o=>['move','sector_assault','sector_siege','sector_reinforce','sector_withdraw'].includes(o.type)?(o.composition||withInfantry(o.units)):{[o.type==='airstrike'?'aircraft':'artillery']:o.unitCount}));
  // Para cada coluna/grupo calcula-se o custo individual antes da soma.
  const costs=armies.map(needsFor);
  return {food:costs.reduce((a,n)=>a+n.food,0),fuel:costs.reduce((a,n)=>a+n.fuel,0),energy:costs.reduce((a,n)=>a+n.energy,0)};
}

// Infraestrutura logística: capitais ainda pertencentes à facção e bases operacionais
// abastecem províncias conectadas por territórios aliados. Sem rota, o teto é 40%.
// Abastecimento urbano: a cadeia de rotas precisa chegar a território aliado
// ou a uma cidade-porta conectada a um estado vizinho próprio. Dois centros
// isolados não geram abastecimento espontaneamente só por serem vizinhos.
export function urbanSupplyConnected(game,sectorId){
  const start=getSector(game,sectorId);if(!start)return false;
  const seen=new Set([start.id]),queue=[start.id];
  for(let i=0;i<queue.length;i++){
    const c=getSector(game,queue[i]);if(!c)continue;
    const parent=getProvince(game,c.provinceId);
    if(parent.ownerId===start.ownerId)return true;
    const gateway=['CAP','LOG','FRO','POR'].includes(c.role);
    if(gateway&&parent.neighbors.some(id=>getProvince(game,id)?.ownerId===start.ownerId))return true;
    for(const id of c.routeIds){const peer=getSector(game,id);if(!routeBlocked(game,c.id,id)&&peer?.ownerId===start.ownerId&&!seen.has(peer.id)){seen.add(peer.id);queue.push(peer.id);}}
  }
  return false;
}
export function logisticsNetwork(game,nationId) {
  const owned=game.provinces.filter(p=>p.ownerId===nationId);
  const byId=new Map(owned.map(p=>[p.id,p]));
  const distance=new Map();const queue=[];
  for(const p of owned)if((p.id===nationId && getSector(game,p.id+'-capital')?.ownerId===nationId) || p.base>=1){distance.set(p.id,0);queue.push(p.id);}
  for(let cursor=0;cursor<queue.length;cursor++){
    const current=byId.get(queue[cursor]);
    for(const neighbor of current.neighbors)if(byId.has(neighbor)&&!distance.has(neighbor)){
      distance.set(neighbor,distance.get(current.id)+1);queue.push(neighbor);
    }
  }
  return distance;
}
function resolveRecon(game,order) {
  const origin=getProvince(game,order.provinceId),target=getProvince(game,order.targetId);
  if(!origin || !target || origin.ownerId!==order.nationId || origin.base<1 || origin.units.drones<2){
    event(game,'intelligence',`${game.nations[order.nationId].short}: missão de observação abortada por indisponibilidade da base.`);return;
  }
  if(target.ownerId===order.nationId){event(game,'intelligence',`${game.nations[order.nationId].short}: reconhecimento encerrado; região já controlada.`);return;}
  const reports=game.intelligence[order.nationId] ||= [];
  const record={provinceId:target.id,ownerId:target.ownerId,units:{...target.units},fort:target.fort,base:target.base,supply:target.supply,seenTick:game.tick,expiresTick:game.tick+6};
  game.intelligence[order.nationId]=reports.filter(r=>r.provinceId!==target.id).concat(record);
  // O resultado nunca é incluído no jornal público. Apenas o comandante recebe o relatório.
  event(game,'intelligence',`${game.nations[order.nationId].short}: operação de observação concluída.`);
}

export function advanceTick(game) {
  if (game.phase !== 'running') return game;
  game.tick += 1;
  // Bloqueios encerram no prazo, após cessar-fogo ou quando o alvo muda de controle.
  game.blockades=(game.blockades||[]).filter(b=>b.expiresTick>game.tick&&
    getSector(game,b.sectorId)?.ownerId===b.victimId&&relationship(game,b.nationId,b.victimId)==='war');
  for(const id of Object.keys(game.intelligence))game.intelligence[id]=game.intelligence[id].filter(r=>r.expiresTick>game.tick);
  game.diplomacy.proposals=game.diplomacy.proposals.filter(p=>{
    if(p.expiresTick<=game.tick){event(game,'diplomacy',`Proposta de paz entre ${game.nations[p.from].short} e ${game.nations[p.to].short} expirou.`);return false;}
    return true;
  });
  for(const [key,until] of Object.entries(game.diplomacy.truces))if(until<=game.tick){delete game.diplomacy.truces[key];event(game,'diplomacy',`Cessar-fogo entre ${key.toUpperCase().replace(':',' e ')} expirou.`);}
  // Produção primeiro; consumo é calculado globalmente por facção para não depender
  // da ordem de iteração dos estados.
  for(const p of game.provinces){
    const res=game.nations[p.ownerId].resources;
    const factor=p.morale<50?.65:1;
    const income={credits:Math.floor((12+p.industry*10)*factor),steel:p.industry*3,
     fuel:p.terrain==='planície'?5:2,food:p.terrain==='floresta'?7:3,energy:p.industry*2};
    for(const center of game.sectors.filter(s=>s.provinceId===p.id && s.ownerId!==p.ownerId)){
      for(const [resource,portion] of Object.entries(SECTOR_TYPES[center.kind].tax)){
        const tribute=income[resource]>0?Math.min(income[resource],Math.max(1,Math.round(income[resource]*portion))):0;
        if(tribute){income[resource]-=tribute;game.nations[center.ownerId].resources[resource]+=tribute;}
      }
    }
    for(const [resource,amount] of Object.entries(income))res[resource]+=amount;
  }
  // Centros ocupados produzem recursos próprios conforme sua função estratégica.
  // Valores deliberadamente pequenos, sem multiplicar indevidamente a arrecadação estadual.
  for(const city of game.sectors){
    const revenue={...CITY_ROLES[city.role]};
    for(const [resource,n] of Object.entries(CITY_ROLES[city.secondaryRole]||{}))
      revenue[resource]=(revenue[resource]||0)+Math.ceil(n*.5);
    const siege=citySieged(game,city.id),blockaded=cityBlockaded(game,city.id);
    const factor=(siege?.25:blockaded?.55:1)*(.5+.5*city.supply/100);
    for(const [resource,n] of Object.entries(revenue))game.nations[city.ownerId].resources[resource]+=Math.floor(n*factor);
  }
  for(const [id,nation] of Object.entries(game.nations)){
    const cost=supplyNeedsForNation(game,id);
    let rate=1;
    for(const k of ['food','fuel','energy'])if(cost[k]>0)rate=Math.min(rate,nation.resources[k]/cost[k]);
    const previous=nation.supply;
    nation.supply=Math.max(0,Math.min(100,Math.floor(rate*100)));
    nation.upkeep=cost;
    for(const k of ['food','fuel','energy'])nation.resources[k]-=Math.min(cost[k],nation.resources[k]);
    if(previous>=75 && nation.supply<75)event(game,'logistics',`${nation.short}: crise de abastecimento; eficiência militar reduzida a ${nation.supply}%.`);
    const routes=logisticsNetwork(game,id);
    for(const p of game.provinces.filter(p=>p.ownerId===id)){
      const distance=routes.get(p.id);
      p.supplyDistance=distance===undefined?null:distance;
      const terrainCap=distance===undefined?40:Math.min(100,Math.max(45,100-distance*12+Math.min(10,p.base*4)));
      p.supply=Math.floor(nation.supply*terrainCap/100);
      if(p.supply<55)p.morale=Math.max(20,p.morale-2);
      else if(p.morale<100)p.morale+=1;
    }
  }
  // Guerra urbana: cercos ativos interrompem reabastecimento local.
  // O efeito é contínuo durante os turnos em que o cerco permanece válido.
  for(const sector of game.sectors) {
    if(citySieged(game,sector.id))sector.supply=Math.max(15,sector.supply-18);
    else if(cityBlockaded(game,sector.id))sector.supply=Math.max(20,sector.supply-11);
    else {
      sector.supply=urbanSupplyConnected(game,sector.id)?Math.min(100,sector.supply+6):Math.max(35,sector.supply-4);
    }
  }
  const ready=game.orders.filter(o=>o.finishTick<=game.tick);
  game.orders=game.orders.filter(o=>o.finishTick>game.tick);
  for(const order of ready.sort((a,b)=>a.id-b.id)){
    const p=getProvince(game,order.provinceId);
    if(order.type==='sector_blockade'){
      const c=getSector(game,order.sectorId),other=getSector(game,order.routeId);
      if(c?.ownerId===order.victimId&&other&&c.routeIds.includes(other.id)&&relationship(game,order.nationId,c.ownerId)==='war'){
        game.blockades.push({id:order.id,sectorId:c.id,routeId:other.id,nationId:order.nationId,victimId:c.ownerId,createdTick:game.tick,expiresTick:game.tick+URBAN_ACTIONS.blockade.duration});
        event(game,'logistics',`Rota entre ${c.name} e ${other.name} bloqueada por ${game.nations[order.nationId].short}.`);
      }else event(game,'logistics','Bloqueio cancelado: rota ou condições diplomáticas alteradas.');
    }
    else if(order.type==='sector_relieve')resolveRelief(game,order);
    else if(order.type==='move')resolveMove(game,order);
    else if(['sector_assault','sector_siege','sector_reinforce','sector_withdraw'].includes(order.type))resolveSectorOperation(game,order);
    else if(order.type==='sector_supply'||order.type==='sector_fortify') {
      const c=getSector(game,order.sectorId);
      if(c?.ownerId!==order.nationId)event(game,'logistics',`Projeto urbano em ${c?.name||'centro desconhecido'} cancelado: controlador alterado.`);
      else if(order.type==='sector_supply') {
        if(citySieged(game,c.id)||cityBlockaded(game,c.id))event(game,'logistics',`Comboio de ${c.name} interceptado por cerco ou bloqueio.`);
        else {c.supply=Math.min(100,c.supply+38);event(game,'logistics',`Suprimento urbano de ${c.name}: ${c.supply}%.`);}
      } else {c.fortLevel=Math.min(3,c.fortLevel+1);event(game,'military',`Defesas de ${c.name} reforçadas para nível ${c.fortLevel}.`);}
    }
    else if(order.type==='recon')resolveRecon(game,order);
    else if(order.type==='airstrike'||order.type==='barrage')resolveSupportMission(game,order);
    else if(p&&p.ownerId===order.nationId){
      if(order.type==='recruit'||order.type==='recruit_unit'){
        const kind=order.unitType||'infantry',spec=UNIT_TYPES[kind];
        if(spec){p.units[kind]+=spec.batch;syncTroops(p);event(game,'military',`${game.nations[order.nationId].short}: ${spec.batch} ${spec.name.toLowerCase()} entregues em ${p.name}.`);}
      }
      if(order.type==='industry'){p.industry+=1;event(game,'economy',`Nova indústria concluída em ${p.name}. Nível ${p.industry}.`);}
      if(order.type==='fort'){p.fort+=1;event(game,'military',`Defesas de ${p.name} ampliadas para o nível ${p.fort}.`);}
      if(order.type==='base'){p.base+=1;event(game,'logistics',`Base militar em ${p.name} alcançou o nível ${p.base}.`);}
      if(order.type==='airfield'){p.airfield+=1;event(game,'military',`Aeródromo militar em ${p.name} alcançou o nível ${p.airfield}.`);}
      if(order.type==='battery'){p.battery+=1;event(game,'military',`Bateria de artilharia em ${p.name} alcançou o nível ${p.battery}.`);}
    } else if(p)event(game,'world',`Projeto em ${p.name} interrompido após mudança de controle territorial.`);
  }
  return game;
}

export function publicState(game, token) {
  const player=playerFromToken(game,token);
  const nation=player?game.nations[player.nationId]:null;
  const counts=Object.fromEntries(FACTIONS.map(f=>[f.id,game.provinces.filter(p=>p.ownerId===f.id).length]));
  const cityCounts=Object.fromEntries(FACTIONS.map(f=>[f.id,game.sectors.filter(s=>s.ownerId===f.id).length]));
  return {
    tick:game.tick,phase:game.phase,winnerId:game.winnerId??null,cityRoleYields:CITY_ROLES,strategicCityCount:game.sectors.length,
    blockades:liveBlockades(game).map(({id,sectorId,routeId,nationId,expiresTick})=>({id,sectorId,routeId,nationId,expiresTick})),
    unitTypes:UNIT_TYPES, supportFacilities:SUPPORT_FACILITIES, supportMissions:SUPPORT_MISSIONS, urbanActions:URBAN_ACTIONS,
    factions:FACTIONS.map(f=>({...f,player:Object.values(game.players).find(p=>p.nationId===f.id)?.name||null,provinces:counts[f.id],centers:cityCounts[f.id]})),
    sectors:game.sectors.map(s=>({...s,units:s.ownerId===player?.nationId?{...s.units}:null,
      supply:s.ownerId===player?.nationId?s.supply:null,
      connected:s.ownerId===player?.nationId?urbanSupplyConnected(game,s.id):null,
      underSiege:citySieged(game,s.id),underBlockade:cityBlockaded(game,s.id)})),
    provinces:game.provinces.map(p=>({
      id:p.id,sigla:p.sigla,name:p.name,region:p.region,ownerId:p.ownerId,troops:p.troops,
      // Sem espionagem: a composição dos adversários não é revelada pelo servidor.
      units:p.ownerId===player?.nationId?{...p.units}:null,
      supply:p.ownerId===player?.nationId?p.supply:null,
      industry:p.industry,fort:p.fort,base:p.base,airfield:p.airfield,battery:p.battery,morale:p.morale,terrain:p.terrain,neighbors:p.neighbors,
      supplyDistance:p.ownerId===player?.nationId?p.supplyDistance:null,
      x:p.x,y:p.y,path:p.path,capital:p.capital,port:p.port,
    })),
    orders:player?game.orders.filter(o=>o.nationId===player.nationId):[],
    diplomacy:{wars:Object.keys(game.diplomacy.wars),truces:Object.entries(game.diplomacy.truces).map(([key,expiresTick])=>({key,expiresTick})),proposals:player?game.diplomacy.proposals.filter(p=>p.from===player.nationId||p.to===player.nationId):[]},
    events:game.events.slice(0,20),
    intelligence:player?(game.intelligence[player.nationId]||[]).filter(r=>r.expiresTick>game.tick).map(r=>({...r,units:{...r.units}})):[],
    me:player?{...player,resources:{...nation.resources},supply:nation.supply,upkeep:{...nation.upkeep}}:null,
  };
}
