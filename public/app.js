const $ = (selector) => document.querySelector(selector);
const SVG = 'http://www.w3.org/2000/svg';
const RESOURCES = [
  ['credits', 'Orçamento', '＄'], ['steel', 'Aço', '▰'], ['fuel', 'Combustível', '◉'],
  ['food', 'Alimentos', '❖'], ['energy', 'Energia', 'ϟ'],
];
const PRICES = { industry: { credits: 400, steel: 85, energy: 25 }, fort: { credits: 260, steel: 60, energy: 20 }, base: { credits: 480, steel: 110, energy: 40 }, airfield: { credits: 520, steel: 125, energy: 50 }, battery: { credits: 370, steel: 95, fuel: 28 } };
const UNIT_ORDER = ['infantry','armor','artillery','aircraft','drones'];
const unit = type => state?.unitTypes?.[type];
const armyLine = army => UNIT_ORDER.filter(k=>(army?.[k]||0)>0).map(k=>`${unit(k)?.short||k}: ${money(army[k])}`).join('  ·  ') || 'Sem unidades';
const PAGES = {
  map: ['Mapa estratégico', 'BRASIL / TEATRO DE OPERAÇÕES', 'Toque em um estado para abrir sua janela de comando.'],
  centers: ['Cidades estratégicas', 'BRASIL / 171 CENTROS', 'Cidades reais com funções próprias, controladas independentemente dos estados.'],
  military: ['Exército e operações', 'ESTADO-MAIOR / FORÇAS MODERNAS', 'Infantaria, blindados, artilharia, aviação e drones em comandos separados.'],
  economy: ['Economia estadual', 'GESTÃO / RECURSOS E PRODUÇÃO', 'Acompanhe o abastecimento, a arrecadação e a produção de seus territórios.'],
  construction: ['Construções', 'INDÚSTRIA / INFRAESTRUTURA', 'Gerencie obras e expanda o parque industrial dos estados controlados.'],
  diplomacy: ['Diplomacia', 'RELAÇÕES INTERESTADUAIS', 'Declare guerra, negocie propostas de paz e acompanhe os cessar-fogos.'],
  intelligence: ['Inteligência', 'RECONHECIMENTO POR DRONES', 'Envie drones de bases militares e receba relatórios privados sobre os adversários.'],
  news: ['Jornal da guerra', 'CENTRAL DE NOTÍCIAS', 'Histórico oficial da campanha atualizado pelo servidor.'],
  ranking: ['Classificação', 'CONTROLE DO BRASIL', 'Ranking de territórios controlados por cada estado.'],
};

let state = null;
let authMode = false;
let inviteRequired = false;
let authPage = 'login';
let matchId = localStorage.getItem('dg-match-id') || 'brasil-01';
let token = localStorage.getItem('dg-token-'+matchId) || (matchId==='brasil-01'?localStorage.getItem('dg-token'):null);
let chosenFaction = null;
let selectedProvince = null;
let dialogState = null;
let live = null;
let zoom = 1;
let municipalityData = null;
let citiesViewUF = null;
let municipalityLoadPromise = null;
let toastTimer;
let currentPage = 'map';
let showCenters = true;
let tabByPage = { centers: 'all', military: 'garrisons', economy: 'resources', construction: 'facilities', diplomacy: 'relations', intelligence: 'borders' };
const money = (n) => (Number(n) || 0).toLocaleString('pt-BR');
// Cria chave de ordem segura também nos navegadores sem crypto.randomUUID.
function newRequestId(){
 if(globalThis.crypto?.randomUUID)return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
 const h=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');
 return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
const elem = (tag, cls = '', txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const svgEl = (tag, attributes = {}, text) => { const e = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attributes)) e.setAttribute(k, String(v)); if (text !== undefined) e.textContent = text; return e; };
const province = (id) => state?.provinces.find(p => p.id === id);
const center = id => state?.sectors?.find(s=>s.id===id);
const ROLE_LABELS = {CAP:'Capital',LOG:'Logística',FRO:'Fronteira',AGR:'Agroalimentar',POR:'Porto',IND:'Indústria',ENE:'Energia',REG:'Centro regional',MIN:'Mineração',TEC:'Tecnologia'};
const roleLabel = role=>ROLE_LABELS[role]||role;
const blockadeList = c => (state?.blockades||[]).filter(b=>b.sectorId===c.id || b.routeId===c.id);
const roleIncome = c => {const primary=state?.cityRoleYields?.[c.role]||{};const secondary=state?.cityRoleYields?.[c.secondaryRole]||{};return RESOURCES.filter(([k])=>(primary[k]||0)+Math.ceil((secondary[k]||0)/2)>0).map(([k,label])=>`${label}: +${(primary[k]||0)+Math.ceil((secondary[k]||0)/2)}`).join(' · ')};
const ownCenter = c => Boolean(state?.me && c?.ownerId===state.me.nationId);
const faction = (id) => state?.factions.find(f => f.id === id);
const mine = () => state?.provinces.filter(p => p.ownerId === state.me?.nationId) ?? [];
const own = (p) => Boolean(state?.me && p?.ownerId === state.me.nationId);
const pending = (p, type, unitType) => state.orders.some(o => o.provinceId === p.id && (type==='recruit' ? ['recruit','recruit_unit'].includes(o.type) && (!unitType || (o.unitType||'infantry')===unitType) : o.type === type));
const relationKey = (a,b) => [a,b].sort().join(':');
function relation(targetId) {
  if(!state?.me) return 'neutral';
  if(targetId === state.me.nationId) return 'same';
  const key=relationKey(state.me.nationId,targetId);
  if(state.diplomacy?.truces.some(t=>t.key===key&&t.expiresTick>state.tick))return 'truce';
  return state.diplomacy?.wars.includes(key) ? 'war' : 'neutral';
}
function relationLabel(targetId) {
  const kind=relation(targetId);
  if(kind==='same')return 'SEU ESTADO';
  if(kind==='war')return 'EM GUERRA';
  if(kind==='truce')return 'CESSAR-FOGO';
  return 'NEUTRO';
}


function notice(message, isError = false) {
  const t = $('#toast'); clearTimeout(toastTimer);
  t.textContent = message; t.classList.toggle('error', isError); t.classList.remove('hidden');
  toastTimer = setTimeout(() => t.classList.add('hidden'), 4400);
}
async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: {'Content-Type': 'application/json','X-DG-Client': '1'}, credentials: 'same-origin',body: JSON.stringify(body) });
  let data;
  try { data = await res.json(); } catch { throw Error('O servidor enviou uma resposta inválida.'); }
  if (!res.ok) throw Error(data.error || 'Não foi possível executar a solicitação.');
  return data;
}
async function fetchState() {
  try {
    const res = await fetch('/api/state?matchId='+encodeURIComponent(matchId)+(!authMode&&token?'&token='+encodeURIComponent(token):''), {cache:'no-store',credentials:'same-origin'});
    if (!res.ok) throw Error('O servidor está indisponível.');
    const data = await res.json();
    if (!data.authRequired && token && !data.me) {
      token = null;localStorage.removeItem('dg-token-'+matchId);if(matchId==='brasil-01')localStorage.removeItem('dg-token'); live?.close(); live = null;
      closeDialog(); notice('Sua sessão de testes não está mais disponível.', true);
    }
    update(data);
  } catch (e) { notice(e.message || 'Erro de conexão.', true); }
}
function connectLive() {
  live?.close(); if (!token || (authMode && !state?.me)) return;
  live = new EventSource('/api/events?matchId='+encodeURIComponent(matchId)+(authMode?'':'&token='+encodeURIComponent(token)));
  live.addEventListener('update', (ev) => { try { update(JSON.parse(ev.data)); } catch { /* polling fallback */ } });
}
function update(data) {
  if(data.matchId && data.matchId!==matchId)return;
  state = data;
  authMode = data.authRequired === true;
  if(authMode){token = data.account ? 'AUTH_COOKIE' : null;$('#authModal').classList.toggle('hidden', Boolean(data.account));$('#logoutButton').classList.toggle('hidden', !data.account);$('#commanderName').value=data.account?.displayName||'';}
  else{$('#authModal').classList.add('hidden');$('#logoutButton').classList.add('hidden');}
  if (selectedProvince && !province(selectedProvince)) selectedProvince = null;
  if (!selectedProvince && data.me?.nationId && province(data.me.nationId)) selectedProvince = data.me.nationId;
  $('#tickLabel').textContent = 'HORA ' + String(data.tick).padStart(3, '0');
  $('#joinModal').classList.toggle('hidden', Boolean(data.me) || (authMode && !data.account));
  document.title='Domínio Global • '+(data.matchName||'Campanha Brasil');
  renderResources(); renderIdentity(); renderPicker(); renderMap(); renderTactical(); renderSelectionBanner(); renderTicker(); renderPage();
  // Não reconstruímos formulários enquanto o jogador preenche uma ordem.
  if (dialogState && ['province','faction'].includes(dialogState.kind)) renderDialog();
}

function renderResources() {
  const host = $('#resbar'); host.replaceChildren();
  if (!state?.me) { host.append(elem('span', 'hint', 'Assuma um estado para consultar os recursos.')); return; }
  for (const [key, label, symbol] of RESOURCES) {
    const item = elem('div', 'resource-item');
    item.append(elem('span','resource-symbol',symbol));
    const body = elem('div','resource-text');body.append(elem('small','',label), elem('strong','',money(state.me.resources[key])));item.append(body);
    host.append(item);
  }
}
function renderIdentity() {
  const f = state?.me ? faction(state.me.nationId) : null;
  $('#nationFlag').textContent = f?.flag || '◇'; $('#nationFlag').style.color = f?.color || '';
  $('#nationName').textContent = f?.name || 'Sem comando';
  $('#nationCommander').textContent = state?.me ? state.me.name : 'Selecione uma unidade federativa';
}
function renderPicker() {
  if (!state) return;
  const host = $('#factionPicker'); const term = ($('#stateSearch').value || '').trim().toLocaleLowerCase('pt-BR');
  host.replaceChildren();
  for (const f of state.factions.filter(f => !term || (f.name+' '+f.short).toLocaleLowerCase('pt-BR').includes(term))) {
    const b = elem('button','faction-choice'+(chosenFaction===f.id?' selected':'')+(f.player?' occupied':'')); b.type='button'; b.disabled=!!f.player;
    b.style.setProperty('--faction-color', f.color);
    b.append(elem('strong','',f.flag+' · '+f.name),elem('small','',f.player ? 'Ocupado: '+f.player : f.region+' · Disponível'));
    b.addEventListener('click', () => { chosenFaction=f.id; renderPicker(); });host.append(b);
  }
  $('#joinButton').disabled = !chosenFaction || Boolean(faction(chosenFaction)?.player);
}

function readPage() {
  const key = location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return Object.hasOwn(PAGES,key) ? key : 'map';
}
function navigate(page) {
  closeMoreMenu();
  if(page!=='map'&&document.body.classList.contains('map-fullscreen'))toggleExpandedMap(false);
  if (!Object.hasOwn(PAGES,page)) return;
  if (readPage() !== page || !location.hash) location.hash = '/'+page;
  else renderPage();
}
function renderPage() {
  if (!state) return;
  currentPage = readPage();
  $('#mainArea').dataset.page = currentPage;
  const [title, eyebrow, description] = PAGES[currentPage];
  $('#pageTitle').textContent = title; $('#pageEyebrow').textContent = eyebrow; $('#pageSummary').textContent = description;
  $('#pageMeta').textContent = currentPage === 'map' ? '27 UNIDADES FEDERATIVAS' : 'HORA ' + String(state.tick).padStart(3,'0');
  $('#mapView').classList.toggle('hidden', currentPage !== 'map');
  $('#moduleView').classList.toggle('hidden',currentPage === 'map');
  for (const b of document.querySelectorAll('[data-page]')) {
    const active = b.dataset.page === currentPage;
    b.classList.toggle('active', active); if (active) b.setAttribute('aria-current','page'); else b.removeAttribute('aria-current');
  }
  $('#moreButton').classList.toggle('active', ['centers','diplomacy','intelligence','news','ranking'].includes(currentPage));
  if (currentPage !== 'map') renderModule();
}
function renderMap() {
  if (!state) return;
  const quick = $('#quickState'); const previous = quick.value;
  quick.replaceChildren(); const placeholder=elem('option','', 'Localizar estado...'); placeholder.value=''; quick.append(placeholder);
  for (const p of [...state.provinces].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))) {
    const option=elem('option','',p.name+' ('+p.sigla+')');option.value=p.id;quick.append(option);
  }
  quick.value=selectedProvince||previous||'';
  const paths=$('#provincePaths'), labels=$('#provinceLabels'), movement=$('#movements'), terrain=$('#terrainOverlay'), maskPaths=$('#landMaskPaths'), targetSelection=$('#targetSelection'), sectors=$('#sectorMarkers');paths.replaceChildren();labels.replaceChildren();movement.replaceChildren();terrain.replaceChildren();maskPaths.replaceChildren();targetSelection.replaceChildren();sectors.replaceChildren();
  $('#sectorToggle').setAttribute('aria-pressed',String(showCenters));
  $('#sectorToggle').classList.toggle('active',showCenters);
  for (const p of state.provinces) {
    const f=faction(p.ownerId);
    const shape=svgEl('path',{d:p.path,fill:f.color,'fill-opacity':'.82','data-id':p.id,tabindex:0,role:'button','aria-label':`${p.name}, controlado por ${f.name}. Abrir detalhes`,class:'province'+(own(p)?' friendly':' hostile')+(p.id===selectedProvince?' selected':'')});
    shape.addEventListener('click',()=>openProvince(p.id));
    shape.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openProvince(p.id);}});
    paths.append(shape);
    maskPaths.append(svgEl('path',{d:p.path,fill:'#fff'}));
    terrain.append(svgEl('path',{d:p.path,fill:'url(#terrainLines)',class:'terrain-cover'}));
    const tiny=['df','se','al','pb','rn','es','rj'].includes(p.id);
    if(!tiny) labels.append(svgEl('rect',{x:p.x-20,y:p.y-1,width:40,height:19,rx:3,class:'troop-plate'}));
    labels.append(svgEl('text',{x:p.x,y:p.y-(tiny?0:8),class:'province-name'+(p.id===selectedProvince?' current':'')},p.sigla));
    if (!tiny) labels.append(svgEl('text',{x:p.x,y:p.y+13,class:'province-count'},String(p.troops)));
    if(p.id===selectedProvince) targetSelection.append(svgEl('circle',{cx:p.x,cy:p.y,r:23,class:'target-ring','pointer-events':'none'}));
    if(p.id==='df'){
      const hit=svgEl('circle',{cx:p.x,cy:p.y,r:10,fill:'transparent',stroke:'#fff2c0','stroke-width':2,class:'capital-hit',tabindex:0,role:'button','aria-label':'Distrito Federal, abrir detalhes'});
      hit.addEventListener('click',()=>openProvince(p.id));
      hit.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();openProvince(p.id);}});
      labels.append(hit);
    }
  }
  // Nunca renderizar os 171 pontos simultaneamente no mapa nacional.
  // Mostra apenas os pontos da UF selecionada ao ampliar (zoom >= 1,5).
  if(showCenters && selectedProvince && zoom>=1.5){
    const visible=state.sectors.filter(c=>c.provinceId===selectedProvince);
    const added=new Set();
    for(const c of visible)for(const id of c.routeIds||[]){
      const target=center(id);if(!target||target.provinceId!==selectedProvince)continue;
      const pair=[c.id,target.id].sort().join(':');if(added.has(pair))continue;added.add(pair);
      sectors.append(svgEl('line',{x1:c.x,y1:c.y,x2:target.x,y2:target.y,class:'strategic-route','pointer-events':'none'}));
    }
    for(const c of visible){
      const owner=faction(c.ownerId);if(!owner)continue;
      const node=svgEl('g',{class:'sector-marker strategic-city',role:'button',tabindex:0,'data-sector':c.id,
        'aria-label':`${c.name}, ${roleLabel(c.role)}, controlado por ${owner.name}`});
      node.append(svgEl('circle',{cx:c.x,cy:c.y,r:c.kind==='capital'?5.2:4.4,
        fill:'#071a20',stroke:owner.color,'stroke-width':2.1}));
      node.append(svgEl('circle',{cx:c.x,cy:c.y,r:1.5,fill:'#f9f0c3','pointer-events':'none'}));
      // Área de toque maior que a decoração: acessível no mobile.
      node.append(svgEl('circle',{cx:c.x,cy:c.y,r:9,fill:'transparent',class:'city-hit'}));
      node.append(svgEl('title',{},`${c.name} · ${roleLabel(c.role)} · ${owner.name}`));
      node.addEventListener('click',ev=>{ev.stopPropagation();showDialog('sector',c.id);});
      node.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();showDialog('sector',c.id);}});
      sectors.append(node);
    }
  }
  renderMunicipalities();
  for (const o of state.orders) {
    if (o.type !== 'move') continue;
    const origin=province(o.provinceId), target=province(o.targetId);
    if (!origin || !target) continue;
    movement.append(svgEl('line',{x1:origin.x,y1:origin.y,x2:target.x,y2:target.y,stroke:'#f3e8ac','stroke-width':3,'stroke-dasharray':'8 7','pointer-events':'none'}));
    movement.append(svgEl('circle',{cx:target.x,cy:target.y,r:7,fill:'none',stroke:'#f3e8ac','stroke-width':2,'pointer-events':'none'}));
  }
  const legend=$('#mapLegend');legend.replaceChildren();
  $('#operationCount').textContent = state.orders.filter(o=>o.type==='move').length + ' OPERAÇÕES EM TRÂNSITO';
  for (const region of ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul']) {
    const f=state.factions.find(f=>f.region===region);
    const item=elem('span','legend-item'), dot=elem('i','');dot.style.background=f.color;
    item.append(dot,elem('span','',region));legend.append(item);
  }
}
// Mapa leve: os municípios são uma camada opcional de zoom, não 79 territórios jogáveis.
function renderMunicipalities() {
  // Os 8 municípios da v0.10 foram incorporados ao cadastro de 171 centros.
  // A antiga camada de contornos foi desativada para não duplicar seus marcadores.
  $('#municipalityOutlines')?.replaceChildren();
  $('#municipalityMarkers')?.replaceChildren();
}
function setZoom(delta=0) {
  zoom = Math.max(1,Math.min(3,Math.round((zoom+delta)*2)/2));
  const svg = $('#worldMap'); svg.style.width=window.innerWidth<=760 ? Math.round(560*zoom)+'px' : (zoom*100)+'%';
  $('#zoomOut').disabled=zoom===1; $('#zoomIn').disabled=zoom===3;
  renderMap();
  if (selectedProvince && province(selectedProvince)) centerOnProvince(selectedProvince,'instant');
}

function button(txt, fn, cls='line-btn') {
  const b=elem('button',cls,txt);b.type='button';b.addEventListener('click',fn);return b;
}
function stat(label, value, detail='') {
  const box=elem('div','stat-card');box.append(elem('small','',label),elem('strong','',String(value)));
  if(detail)box.append(elem('span','',detail));return box;
}
function statGrid(stats) {const box=elem('div','stats-grid');for(const [a,b,c] of stats)box.append(stat(a,b,c));return box;}
function groupTitle(title,subtitle='') {
  const div=elem('div','group-title');div.append(elem('h2','',title));if(subtitle)div.append(elem('span','',subtitle));return div;
}
function empty(title, desc) {const div=elem('div','empty-state');div.append(elem('strong','',title),elem('p','',desc));return div;}
function itemRow(title,detail,tag,actions=[],color) {
  const row=elem('article','data-row');const inner=elem('div','row-main');inner.append(elem('strong','',title),elem('small','',detail));row.append(inner);
  if(tag){const badge=elem('span','row-tag',tag);if(color)badge.style.setProperty('--tag-color',color);row.append(badge);}
  if(actions.length){const holder=elem('div','row-actions');for(const action of actions)holder.append(button(action.label,action.onClick,'mini-btn'));row.append(holder);}
  return row;
}
function tabs(host, options) {
  const bar=elem('div','tabs');bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Áreas do módulo');
  for(const [id,label] of options){const active=tabByPage[currentPage]===id;const b=elem('button','tab-btn'+(active?' active':''),label);
    b.type='button'; b.setAttribute('role','tab'); b.setAttribute('aria-selected',String(active));
    b.addEventListener('click',()=>{tabByPage[currentPage]=id;renderModule();});bar.append(b);}
  host.append(bar);
}
function shell() { const host=$('#moduleView');host.replaceChildren();return host; }
function needCommand(host) { if(!state.me){host.append(empty('Comando indisponível','Assuma um estado para visualizar e utilizar este módulo.'));return false;}return true; }
function grossProduction(p) {
  const factor = p.morale<50 ? .65 : 1;
  return {credits:Math.floor((12+p.industry*10)*factor),steel:p.industry*3,fuel:p.terrain==='planície'?5:2,food:p.terrain==='floresta'?7:3,energy:p.industry*2};
}
function provinceIncomeSplit(p){
  const local=grossProduction(p),tribute={};
  for(const c of state.sectors.filter(s=>s.provinceId===p.id && s.ownerId!==p.ownerId)){
    const fractions=c.kind==='capital'?{credits:.22,food:.10}:{credits:.15,steel:.30,energy:.25};
    for(const [k,portion] of Object.entries(fractions)){
      const amount=local[k]>0?Math.min(local[k],Math.max(1,Math.round(local[k]*portion))):0;
      local[k]-=amount;
      if(c.ownerId===state.me?.nationId)tribute[k]=(tribute[k]||0)+amount;
    }
  }
  return {local,tribute};
}
function production(p){return provinceIncomeSplit(p).local;}

function renderModule() {
  if (currentPage==='map'||!state)return;
  const host=shell();
  if (!needCommand(host))return;
  if (currentPage==='centers')renderCenters(host);
  if (currentPage==='military')renderMilitary(host);
  if (currentPage==='economy')renderEconomy(host);
  if (currentPage==='construction')renderConstruction(host);
  if (currentPage==='diplomacy')renderDiplomacy(host);
  if (currentPage==='intelligence')renderIntelligence(host);
  if (currentPage==='news')renderNews(host);
  if (currentPage==='ranking')renderRanking(host);
}
function renderCenters(host) {
 const sectors=state.sectors||[],my=sectors.filter(ownCenter),taken=sectors.filter(s=>s.ownerId!==province(s.provinceId)?.ownerId);
 host.append(statGrid([['CIDADES DO BRASIL',sectors.length,'171 nós em 27 UFs'],['SOB SEU CONTROLE',my.length,'Guarnições independentes'],['OCUPAÇÕES',taken.length,'Controle parcial dos estados'],['ORDENS ATIVAS',state.orders.filter(o=>o.type.startsWith('sector_')).length,'Operações em andamento']]));
 const selector=elem('select');selector.id='cityStateFilter';selector.setAttribute('aria-label','Filtrar cidades por estado');
 const all=elem('option','','Mostrar todo o Brasil (171)');all.value='all';selector.append(all);
 for(const p of [...state.provinces].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){const o=elem('option','',`${p.sigla} · ${p.name}`);o.value=p.id;selector.append(o);}
 const preferred=citiesViewUF||selectedProvince||state.me?.nationId||'all';selector.value=preferred;
 selector.addEventListener('change',()=>{citiesViewUF=selector.value;renderModule();});
 addField(host,'ESTADO A INSPECIONAR',selector);
 tabs(host,[['all','Todas as cidades'],['owned','Sob meu controle'],['contested','Ocupadas']]);
 const filter=tabByPage.centers,uf=selector.value;
 const shown=sectors.filter(s=>(uf==='all'||s.provinceId===uf)&&
   (filter==='all'||(filter==='owned'&&ownCenter(s))||(filter==='contested'&&s.ownerId!==province(s.provinceId)?.ownerId)))
   .sort((a,b)=>a.provinceId.localeCompare(b.provinceId)||Number(b.kind==='capital')-Number(a.kind==='capital')||a.name.localeCompare(b.name,'pt-BR'));
 host.append(groupTitle('Cidades com controle independente',`${shown.length} localidades · Os ícones de uma UF são exibidos apenas ao ampliar o estado no mapa.`));
 const list=elem('div','row-list');
 for(const c of shown){const p=province(c.provinceId),owner=faction(c.ownerId);
  list.append(itemRow(`${c.kind==='capital'?'★':'◆'} ${c.name}`,
   `${p?.sigla||'?'} · ${roleLabel(c.role)} / ${roleLabel(c.secondaryRole)} · Controlador: ${owner?.name||'?'}`,
   c.underSiege?'SOB CERCO':c.underBlockade?'ROTA BLOQUEADA':ownCenter(c)?'SEU CONTROLE':c.ownerId!==p?.ownerId?'OCUPADA':'ADVERSÁRIO',
   [{label:'Inspecionar',onClick:()=>showDialog('sector',c.id)}],owner?.color));
 }
 if(!shown.length)list.append(empty('Nenhuma cidade nesta categoria','Selecione outro estado ou filtro.'));
 host.append(list);
 host.append(elem('p','module-footnote','A conquista urbana não transfere automaticamente o estado. As rotas representadas são conexões estratégicas abstratas, não estradas reais.'));
}

function renderMilitary(host) {
  const provinces=mine(),total=provinces.reduce((a,p)=>a+p.troops,0)+(state.sectors||[]).filter(ownCenter).reduce((a,c)=>a+c.troops,0),moves=state.orders.filter(o=>o.type==='move'||o.type.startsWith('sector_'));
  host.append(statGrid([['EFETIVO TOTAL',money(total),'Infantaria e equipamentos'],['ESTADOS CONTROLADOS',provinces.length,'Guarnições existentes'],['SUPRIMENTOS',state.me.supply+'%','Eficiência do abastecimento'],['EM TRÂNSITO',moves.length,'Operações em andamento']]));
  tabs(host,[['garrisons','Guarnições'],['support','Missões especiais'],['orders','Ordens ativas'],['recruitment','Produção militar'],['logistics','Logística']]);
  const tab=tabByPage.military;
  if(tab==='garrisons') {
    host.append(groupTitle('Guarnições e composições','Uma janela individual para comandar cada estado.'));
    const list=elem('div','row-list');
    for(const p of provinces.sort((a,b)=>b.troops-a.troops))list.append(itemRow(p.name,armyLine(p.units),money(p.troops)+' UN.',[
      {label:'Detalhes',onClick:()=>openProvince(p.id)}, {label:'Mover',onClick:()=>showDialog('move',p.id)},
    ]));
    host.append(list);
  } else if(tab==='support') {
    const owned=mine();
    host.append(groupTitle('Centro de operações de apoio','Aeronaves e artilharia executam missões com alcance limitado. Não capturam estados: a ocupação continua exigindo infantaria.'));
    host.append(statGrid([['AERÓDROMOS',owned.filter(p=>p.airfield>0).length,'Instalações aéreas'],['BATERIAS',owned.filter(p=>p.battery>0).length,'Apoio de artilharia'],['EM OPERAÇÃO',state.orders.filter(o=>['airstrike','barrage'].includes(o.type)).length,'Missões em andamento']]));
    const list=elem('div','row-list');
    for(const p of owned.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))) {
      const buttons=[];
      if(p.airfield>0)buttons.push({label:'Missão aérea',onClick:()=>showDialog('airstrike',p.id)});
      if(p.battery>0)buttons.push({label:'Bombardeio',onClick:()=>showDialog('barrage',p.id)});
      buttons.push({label:'Instalações',onClick:()=>showDialog(p.airfield===0?'airfield':'battery',p.id)});
      list.append(itemRow(p.name,`Aeródromo ${p.airfield}/2 · Bateria ${p.battery}/2 · AER ${p.units?.aircraft||0} · ART ${p.units?.artillery||0}`,buttons.length>1?'APOIO DISPONÍVEL':'SEM INSTALAÇÕES',buttons));
    }
    host.append(list);
  } else if(tab==='orders') {
    host.append(groupTitle('Operações em andamento','Cada classe de unidade tem seu próprio tempo de produção e marcha.'));
    renderOrderList(host,state.orders);
  } else if(tab==='recruitment') {
    host.append(groupTitle('Centro de produção militar','Escolha o estado e, na janela exclusiva, o tipo de unidade que deseja produzir.'));
    const list=elem('div','row-list');
    for(const p of provinces.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
      const busy=state.orders.filter(o=>o.provinceId===p.id && ['recruit','recruit_unit'].includes(o.type)).length;
      list.append(itemRow(p.name,`Indústria ${p.industry}/4 · ${busy} lotes em produção · ${armyLine(p.units)}`,
        busy?'PRODUÇÃO ATIVA':'DISPONÍVEL',[{label:'Produzir',onClick:()=>showDialog('recruit',p.id)}]));
    }
    host.append(list);
  } else {
    const upkeep=state.me.upkeep||{food:0,fuel:0,energy:0};
    host.append(groupTitle('Rede territorial de abastecimento','A capital e bases militares abastecem territórios ligados por fronteiras amigas. Regiões isoladas sofrem penalidade.'));
    host.append(statGrid([['EFICIÊNCIA',state.me.supply+'%','Abastecimento nacional'],['ALIMENTOS',money(upkeep.food)+'/H','Consumo da infantaria'],['COMBUSTÍVEL',money(upkeep.fuel)+'/H','Blindados, artilharia, aviação e drones'],['ENERGIA',money(upkeep.energy)+'/H','Aviação e drones']]));
    const list=elem('div','row-list');
    for(const p of provinces.sort((a,b)=>(a.supply||0)-(b.supply||0)))list.append(itemRow(p.name,`${p.supplyDistance===null?'ISOLADO':p.supplyDistance===0?'CENTRO LOGÍSTICO':p.supplyDistance+' FRONTEIRA(S) DA BASE'} · Base ${p.base}/3 · ${armyLine(p.units)}`,p.supply+'% SUPRIMENTO',[
      {label:'Inspecionar',onClick:()=>openProvince(p.id)},
    ],p.supply<55?'#ed7c62':null));
    host.append(list);
    host.append(elem('p','module-footnote','Abastecimento efetivo = suprimento nacional limitado pela conexão territorial. Bases operacionais funcionam como novos centros logísticos e aumentam a defesa local.'));
  }
}
function renderOrderList(host, orders) {
  if(!orders.length){host.append(empty('Nenhuma ordem ativa','As ordens militares e as construções aparecerão aqui assim que forem confirmadas.'));return;}
  const list=elem('div','row-list');for(const o of [...orders].sort((a,b)=>a.finishTick-b.finishTick)){
    const src=province(o.provinceId), target=province(o.targetId);
    const name={sector_siege:'Cerco urbano',sector_blockade:'Bloqueio de rota',sector_relieve:'Socorro urbano',sector_supply:'Comboio urbano',sector_fortify:'Defesa urbana',sector_assault:'Ocupação de centro',sector_reinforce:'Reforço de guarnição',sector_withdraw:'Retirada de centro',move:'Movimentação militar',recruit:'Infantaria',recruit_unit:unit(o.unitType)?.name||'Produção militar',industry:'Indústria',fort:'Defesa territorial',base:'Base militar',airfield:'Aeródromo militar',battery:'Bateria de artilharia',airstrike:'Missão aérea',barrage:'Bombardeio de artilharia',recon:'Reconhecimento por drones'}[o.type]||'Ordem';
    const detail=o.type.startsWith('sector_')?`${src?.name||'?'} → ${center(o.sectorId)?.name||'?'} · ${armyLine(o.composition)}`:o.type==='move'?`${armyLine(o.composition||{infantry:o.units})} · ${src?.name||'?'} → ${target?.name||'?'}`:['recon','airstrike','barrage'].includes(o.type)?`${src?.name||'?'} → ${target?.name||'?'}${o.unitCount?' · '+o.unitCount+' unidades destacadas':''}`:src?.name||'?';
    list.append(itemRow(name,detail,'H +'+Math.max(0,o.finishTick-state.tick)));
  }host.append(list);
}
function renderEconomy(host) {
  const territory=mine();const income=Object.fromEntries(RESOURCES.map(([k])=>[k,0]));
  for(const p of territory){const prod=production(p);for(const [k] of RESOURCES)income[k]+=prod[k];}
  let tributeCenters=0;
  for(const p of state.provinces.filter(p=>!own(p))){
    const split=provinceIncomeSplit(p);for(const [k,v] of Object.entries(split.tribute)){income[k]+=v;tributeCenters++;}
  }
  host.append(statGrid(RESOURCES.map(([k,label])=>[label.toUpperCase(),money(state.me.resources[k]),'+'+money(income[k])+' / hora'])));
  tabs(host,[['resources','Produção total'],['territories','Produção por estado']]);
  if(tabByPage.economy==='resources'){
    host.append(groupTitle('Balanço de recursos','Receita líquida de estados + centros ocupados; consumo logístico ocorre depois.')); 
    const list=elem('div','row-list');for(const [k,label,icon] of RESOURCES){list.append(itemRow(icon+' '+label,`Estoque: ${money(state.me.resources[k])}`,'+'+money(income[k])+' / H'));}host.append(list);
  } else {
    host.append(groupTitle('Economia territorial','Receitas estaduais já refletem cidades sob ocupação de outras facções.'));
    const list=elem('div','row-list');for(const p of territory.sort((a,b)=>b.industry-a.industry)){
      const prod=production(p);
      list.append(itemRow(p.name,`Indústria ${p.industry}/4 · +${prod.credits} créditos · +${prod.steel} aço/h`,p.morale+'% MORAL',[
        {label:'Detalhes',onClick:()=>openProvince(p.id)},{label:'Construir',onClick:()=>showDialog('build',p.id)}
      ]));
    }host.append(list);
  }
  const occupied=state.sectors.filter(c=>ownCenter(c)&&!own(province(c.provinceId)));
  if(occupied.length){host.append(groupTitle('Receita de centros ocupados','Produção desviada de estados controlados por outras facções.'));
    const cityList=elem('div','row-list');for(const c of occupied)cityList.append(itemRow(c.name,province(c.provinceId)?.name||c.provinceId,'RECEITA LOCAL',[{label:'Abrir',onClick:()=>showDialog('sector',c.id)}]));host.append(cityList);}
}
function renderConstruction(host) {
  const territory=mine(), total=territory.reduce((sum,p)=>sum+p.industry,0), running=state.orders.filter(o=>['industry','fort','base','airfield','battery'].includes(o.type)).length;
  host.append(statGrid([['NÍVEIS INDUSTRIAIS',total,'Somatório de todas as instalações'],['OBRAS EM ANDAMENTO',running,'Instalações e defesas'],['BASES MILITARES',territory.reduce((s,p)=>s+(p.base>0?1:0),0),'Centros logísticos ativos']]));
  tabs(host,[['facilities','Indústrias'],['defenses','Fortificações'],['bases','Bases militares'],['airfields','Aeródromos'],['batteries','Baterias'],['queue','Obras ativas']]);
  if(tabByPage.construction==='queue'){
    host.append(groupTitle('Fila de construções','Obras processadas por turnos no servidor.'));
    renderOrderList(host,state.orders.filter(o=>['industry','fort','base','airfield','battery'].includes(o.type)));return;
  }
  if(tabByPage.construction==='airfields'||tabByPage.construction==='batteries'){
    const isAir=tabByPage.construction==='airfields',kind=isAir?'airfield':'battery';
    const label=isAir?'Aeródromos militares':'Baterias de artilharia';
    host.append(groupTitle(label,isAir?'Nível 1 permite alcance de até 2 fronteiras; nível 2 permite até 3.':'Bombardeios de apoio a estados inimigos vizinhos. Instalação até nível 2.'));
    const list=elem('div','row-list');
    for(const p of territory.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
      const full=p[kind]>=2,busy=pending(p,kind),tag=full?'NÍVEL MÁX.':busy?'EM OBRAS':'DISPONÍVEL';
      list.append(itemRow(p.name,`${label.slice(0,-1)} ${p[kind]}/2 · ${isAir?'Aeronaves '+(p.units?.aircraft||0):'Artilharia '+(p.units?.artillery||0)}`,tag,full||busy?[]:[{label:'Instalar / ampliar',onClick:()=>showDialog(kind,p.id)}]));
    }host.append(list);return;
  }
  if(tabByPage.construction==='bases'){
    host.append(groupTitle('Bases militares e rede logística','Níveis 1 a 3 · 480 créditos, 110 aço, 40 energia · 4 horas estratégicas por nível.'));
    const list=elem('div','row-list');for(const p of territory.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
      const full=p.base>=3,busy=pending(p,'base');
      list.append(itemRow(p.name,`Base ${p.base}/3 · ${p.supplyDistance===null?'Região isolada':p.supplyDistance+' fronteira(s) até centro logístico'} · Suprimento ${p.supply}%`,full?'NÍVEL MÁX.':busy?'EM OBRAS':'DISPONÍVEL',full||busy?[]:[{label:'Instalar / ampliar',onClick:()=>showDialog('base',p.id)}]));
    }host.append(list);return;
  }
  if(tabByPage.construction==='defenses'){
    host.append(groupTitle('Defesa territorial','260 créditos, 60 aço e 20 energia por nível · 3 horas estratégicas · máximo nível 3.'));
    const list=elem('div','row-list');for(const p of territory.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
      const full=p.fort>=3,busy=pending(p,'fort');
      list.append(itemRow(p.name,`Fortificação ${p.fort}/3 · bônus de defesa de ${Math.round(p.fort*.18*100)}%`,full?'NÍVEL MÁX.':busy?'EM OBRAS':'DISPONÍVEL',full||busy?[]:[{label:'Fortificar',onClick:()=>showDialog('fort',p.id)}]));
    }host.append(list);return;
  }
  host.append(groupTitle('Administração de indústrias','400 créditos, 85 aço e 25 energia por expansão · conclusão em 4 horas de jogo.'));
  const list=elem('div','row-list');for(const p of territory.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
    const full=p.industry>=4, busy=pending(p,'industry');
    list.append(itemRow(p.name,`Nível ${p.industry} de 4 · ${p.terrain}`,full?'NÍVEL MÁX.':busy?'EM OBRAS':'DISPONÍVEL',full||busy?[]:[{label:'Expandir',onClick:()=>showDialog('build',p.id)}]));
  }host.append(list);
}
function renderDiplomacy(host) {
  const incoming=(state.diplomacy?.proposals||[]).filter(p=>p.to===state.me.nationId);
  const outgoing=(state.diplomacy?.proposals||[]).filter(p=>p.from===state.me.nationId);
  const warCount=state.factions.filter(f=>relation(f.id)==='war').length;
  host.append(statGrid([['GUERRAS ATIVAS',warCount,'Conflitos registrados'],['PROPOSTAS RECEBIDAS',incoming.length,'Exigem sua decisão'],['CESSAR-FOGOS',state.diplomacy?.truces.filter(t=>t.key.split(':').includes(state.me.nationId)).length||0,'Com prazo de expiração']]));
  tabs(host,[['relations','Relações'],['proposals','Propostas de paz'],['treaties','Cessar-fogos']]);
  const tab=tabByPage.diplomacy;
  if(tab==='proposals'){
    host.append(groupTitle('Propostas recebidas','A paz só é firmada quando ambos os comandantes concordam.'));
    const list=elem('div','row-list');
    for(const p of incoming) list.append(itemRow(faction(p.from)?.name||p.from,`Recebida na hora ${p.createdTick} · expira em H +${p.expiresTick}`,'DECISÃO PENDENTE',[{label:'Responder',onClick:()=>showDialog('proposal',String(p.id))}]));
    if(!incoming.length)list.append(empty('Nenhuma proposta recebida','As mensagens de paz dos adversários chegarão aqui.'));
    host.append(list);
    host.append(groupTitle('Propostas enviadas'));
    const sent=elem('div','row-list');
    for(const p of outgoing)sent.append(itemRow(faction(p.to)?.name||p.to,`Enviada na hora ${p.createdTick} · expira em H +${p.expiresTick}`,'AGUARDANDO'));
    if(!outgoing.length)sent.append(empty('Nenhuma proposta enviada','Abra um estado em guerra para oferecer paz.'));
    host.append(sent);return;
  }
  if(tab==='treaties'){
    host.append(groupTitle('Acordos de cessar-fogo','Durante um cessar-fogo não é permitido iniciar ataques, e ofensivas pendentes são suspensas.'));
    const list=elem('div','row-list');const agreements=(state.diplomacy?.truces||[]).filter(t=>t.key.split(':').includes(state.me.nationId));
    for(const t of agreements){const target=t.key.split(':').find(id=>id!==state.me.nationId);list.append(itemRow(faction(target)?.name||target,`Validade até a hora estratégica ${t.expiresTick}`,'FALTAM '+Math.max(0,t.expiresTick-state.tick)+' H'));}
    if(!agreements.length)list.append(empty('Nenhum cessar-fogo ativo','Acordos aceitos serão registrados aqui.'));host.append(list);return;
  }
  host.append(groupTitle('Comandos estaduais','Abra o perfil para declarar guerra ou oferecer paz.'));
  const list=elem('div','row-list');for(const f of [...state.factions].filter(f=>f.id!==state.me.nationId).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'))){
    const detail=f.player?'Governante: '+f.player:'Sem comandante humano · '+f.region;
    const row=itemRow(f.name,detail,relationLabel(f.id),[{label:'Negociar',onClick:()=>showDialog('faction',f.id)}],f.color);
    row.style.setProperty('--row-accent',f.color);list.append(row);
  }host.append(list);
}
function renderIntelligence(host) {
  const border=[...new Set(mine().flatMap(p=>p.neighbors))].map(province).filter(p=>p&&!own(p));
  const reports=state.intelligence||[];
  const reconnaissance=state.orders.filter(o=>o.type==='recon');
  host.append(statGrid([['FRONTEIRAS',border.length,'Territórios vizinhos adversários'],['RELATÓRIOS ATIVOS',reports.length,'Informações privadas temporárias'],['MISSÕES EM VOO',reconnaissance.length,'Reconhecimento em andamento']]));
  tabs(host,[['borders','Fronteiras'],['reports','Relatórios privados'],['missions','Missões em andamento']]);
  const tab=tabByPage.intelligence||'borders';
  if(tab==='reports'){
    host.append(groupTitle('Inteligência confirmada por drones','Composição observada no momento da missão; pode mudar depois. Cada relatório expira 6 turnos após a conclusão.'));
    const list=elem('div','row-list');
    for(const r of [...reports].sort((a,b)=>b.seenTick-a.seenTick)){
      const target=province(r.provinceId);
      const desc=`H+${r.seenTick} · ${armyLine(r.units)} · DEF ${r.fort}/3 · Base ${r.base}/3 · Supr. ${r.supply}%`;
      list.append(itemRow(target?.name||r.provinceId,desc,'EXPIRA H+'+r.expiresTick,[{label:'Mapa',onClick:()=>openProvince(r.provinceId)}]));
    }
    if(!reports.length)list.append(empty('Nenhum relatório ativo','Construa uma base militar, mantenha dois drones e envie uma missão de reconhecimento a uma fronteira.'));
    host.append(list);return;
  }
  if(tab==='missions'){
    host.append(groupTitle('Reconhecimento em andamento','O relatório é gerado no servidor após dois turnos.'));
    renderOrderList(host,reconnaissance);return;
  }
  host.append(groupTitle('Fronteiras expostas','Envie drones a partir de uma base militar sua adjacente ao alvo.'));
  if(!border.length){host.append(empty('Sem fronteiras adversárias','Você não possui fronteiras expostas nesta rodada.'));return;}
  const list=elem('div','row-list');
  for(const p of border.sort((a,b)=>b.troops-a.troops)){
    const origin=mine().find(src=>src.neighbors.includes(p.id)&&src.base>=1&&(src.units?.drones||0)>=2);
    const actions=[{label:'Inspecionar',onClick:()=>openProvince(p.id)}];
    if(origin)actions.push({label:'Enviar drones',onClick:()=>showDialog('recon',origin.id)});
    list.append(itemRow(p.name,`Governo: ${faction(p.ownerId)?.name||'—'} · ${p.terrain}`,money(p.troops)+' UN.',actions));
  }
  host.append(list);
  host.append(elem('p','module-footnote','Exércitos adversários não são revelados na API antes de um reconhecimento bem-sucedido. Não existem agentes secretos ou sabotagem nesta versão.'));
}
function renderNews(host) {
  host.append(groupTitle('Boletim da campanha','Eventos registrados pelo servidor, do mais recente para o mais antigo.'));
  const feed=elem('div','news-feed');if(!state.events.length)feed.append(empty('Sem notícias','Os acontecimentos da campanha aparecerão aqui.'));
  for(const ev of state.events){const article=elem('article','news-item '+ev.type);article.append(elem('time','',`H +${String(ev.tick).padStart(3,'0')}`),elem('p','',ev.message));feed.append(article);}host.append(feed);
}
function renderRanking(host) {
  const sorted=[...state.factions].sort((a,b)=>b.provinces-a.provinces||b.centers-a.centers||a.name.localeCompare(b.name,'pt-BR'));
  host.append(groupTitle('Disputa pelo controle nacional','Classificação atualizada pelas conquistas territoriais.'));
  const list=elem('div','row-list');sorted.forEach((f,i)=>{
    const row=itemRow(`${String(i+1).padStart(2,'0')} · ${f.name}`,f.player?'Jogador: '+f.player:'Sem jogador',f.provinces+' UF · '+(f.centers||0)+' centros', [{label:'Perfil',onClick:()=>showDialog('faction',f.id)}],f.color);
    row.style.setProperty('--row-accent',f.color);list.append(row);
  });host.append(list);
}


// Painel tático é apenas consulta e atalhos. Ordens continuam em janelas dedicadas.
function renderTactical() {
  const host=$('#tacticalContent'); if(!host || !state) return;
  host.replaceChildren();
  const p=province(selectedProvince || state.me?.nationId || 'ms');
  if(!p) {host.append(elem('p','tactical-empty','Assuma um estado ou selecione um território no mapa.'));return;}
  const f=faction(p.ownerId), friendly=own(p);
  const title=elem('div','tactical-title');
  const emblem=elem('span','tactical-emblem',p.sigla);emblem.style.setProperty('--state-color',f?.color||'#56bcb2');
  const identity=elem('div','tactical-identity'); identity.append(elem('small','',friendly?'◉ SEU COMANDO':'◉ TERRITÓRIO INSPECIONADO'),elem('strong','',p.name),elem('span','',`Governo: ${f?.name||'Não identificado'}`));
  title.append(emblem,identity);host.append(title);
  const visual=elem('div','tactical-visual');visual.append(elem('span','','✦ REDE DE DEFESA TERRITORIAL'));host.append(visual);
  const status=elem('div','tactical-relation',friendly?'● TERRITÓRIO SOB SEU CONTROLE':'◇ ESTADO NÃO CONTROLADO');host.append(status);
  const grid=elem('div','tactical-metrics');
  for(const [label,value,accent] of [['EFETIVO',money(p.troops)+' UN.',false],['INDÚSTRIA','NÍVEL '+p.industry+'/4',false],['SUPRIMENTO',friendly?p.supply+'%':'SIGILOSO',friendly&&p.supply>=70],['BASE MILITAR','NÍVEL '+p.base+'/3',false]]) {
    const card=elem('div','tactical-metric');card.append(elem('small','',label),elem('strong',accent?'green':'',value));grid.append(card);
  }
  host.append(grid);
  if(friendly)host.append(elem('p','tactical-note',armyLine(p.units)));
  host.append(elem('p','tactical-note',`${state.sectors.filter(c=>c.provinceId===p.id).length} cidades estratégicas. Amplie o mapa para exibir pontos e rotas locais.`));
  const sec=elem('div','tactical-subhead','◈ AÇÕES DO TERRITÓRIO');host.append(sec);
  const commands=elem('div','tactical-actions');
  if(friendly){
    commands.append(button('➜ Mover / atacar',()=>showDialog('move',p.id),'tactical-action attack'));
    commands.append(button('♟ Recrutar',()=>showDialog('recruit',p.id),'tactical-action'));
    commands.append(button('▥ Construir',()=>showDialog('build',p.id),'tactical-action'));
    commands.append(button('▣ Fortificar',()=>showDialog('fort',p.id),'tactical-action'));
  }
  commands.append(button('⌖ Cidades estratégicas',()=>{citiesViewUF=p.id;navigate('centers');},'tactical-action details'));
  commands.append(button('◇ Detalhes completos',()=>showDialog('province',p.id),'tactical-action details'));
  host.append(commands);
  const hint=elem('p','tactical-note',friendly?'Emita ordens nas janelas de comando. A simulação processa as ações no servidor.':'Para atacar, selecione primeiro uma guarnição própria em um estado vizinho.');
  host.append(hint);
}
function renderSelectionBanner(){
  const bar=$('#selectionBanner');if(!bar||!state)return;
  const p=province(selectedProvince||state.me?.nationId);
  if(!p){
    $('#selectionOverline').textContent='AGUARDANDO COMANDO';
    $('#selectionName').textContent='Selecione um território';
    $('#selectionDetails').textContent='Toque no mapa ou escolha um estado no seletor.';
    bar.classList.remove('friendly','hostile');
    $('#selectionInspect').disabled=true;return;
  }
  const f=faction(p.ownerId),controlled=own(p);
  $('#selectionOverline').textContent=controlled?'TERRITÓRIO SOB SEU COMANDO':'TERRITÓRIO EM OBSERVAÇÃO';
  $('#selectionName').textContent=p.name+' · '+p.sigla.toUpperCase();
  $('#selectionDetails').textContent=(f?.name||'Controle desconhecido')+' · '+(state.sectors?.filter(c=>c.provinceId===p.id).length||0)+' cidades estratégicas';
  bar.classList.toggle('friendly',controlled);bar.classList.toggle('hostile',!controlled);
  $('#selectionInspect').disabled=false;
}
function toggleExpandedMap(force){
  const expanded=typeof force==='boolean'?force:!document.body.classList.contains('map-fullscreen');
  document.body.classList.toggle('map-fullscreen',expanded);
  $('#mapExpand').setAttribute('aria-pressed',String(expanded));
  $('#mapExpand').setAttribute('aria-label',expanded?'Fechar mapa expandido':'Expandir mapa');
  $('#mapExpand').title=expanded?'Fechar mapa':'Expandir mapa';
  $('#mapExpand').textContent=expanded?'✕':'⛶';
}
function renderTicker() {
  const host=$('#tickerEvents'); if(!host||!state)return;
  host.replaceChildren();
  const recent=state.events.slice(0,3);
  if(!recent.length){host.append(elem('span','ticker-message','◈ Sem eventos registrados. Aguardando ordens dos comandantes.'));return;}
  for(const ev of recent)host.append(elem('span','ticker-message',`H+${String(ev.tick).padStart(3,'0')}  ·  ${ev.message}`));
}
function selectedForOrder(){return province(selectedProvince||state.me?.nationId);}
function commandQuick(kind){
  if(!state?.me){notice('Assuma um estado para acessar o comando.',true);return;}
  const p=selectedForOrder();
  if(!p){notice('Selecione um estado no mapa.',true);return;}
  if(kind==='inspect'){showDialog('province',p.id);return;}
  if(!own(p)){notice('Para emitir ordens, selecione um território sob seu controle.',true);showDialog('province',p.id);return;}
  showDialog(kind,p.id);
}

function centerOnProvince(id,behavior='smooth') {
  const p=province(id),frame=$('#mapFrame'),svg=$('#worldMap');if(!p||!frame||!svg)return;
  const rect=svg.getBoundingClientRect();
  const left=Math.max(0,rect.width*(p.x/1050)-frame.clientWidth/2);
  const top=Math.max(0,rect.height*(p.y/680)-frame.clientHeight/2);
  frame.scrollTo({left,top,behavior});
}
function openProvince(id) { selectedProvince=id;renderMap();renderTactical();renderSelectionBanner();centerOnProvince(id);showDialog('province',id); }
function showDialog(kind,id,fromProvince=false) {
  if (!state) return;
  dialogState = { kind, id, fromProvince };
  renderDialog();
  const d=$('#gameDialog');if (!d.open) d.showModal();
}
function closeDialog() { const d=$('#gameDialog'); if(d.open)d.close();dialogState=null; }
function dialogIntro(label,title) { $('#dialogEyebrow').textContent=label;$('#dialogTitle').textContent=title;const host=$('#dialogBody');host.replaceChildren();$('#dialogBack').classList.toggle('hidden',!dialogState?.fromProvince);return host; }
function modalButtonRow(host,actions){const footer=elem('div','dialog-actions');for(const [title,handler,primary] of actions)footer.append(button(title,handler,primary?'primary-btn':'secondary-btn'));host.append(footer);}
function renderDialog() {
  if (!state||!dialogState)return;
  const {kind,id}=dialogState;
  if(kind==='municipality'){
    const place=municipalityData?.find(c=>c.id===id);
    if(!place){closeDialog();return;}
    const host=dialogIntro('MAPA / MUNICÍPIO-CHAVE',place.name);
    host.append(elem('p','dialog-lead',place.role+'. O mapa mostra apenas municípios relevantes para facilitar a leitura no celular.'));
    host.append(elem('p','module-footnote','Camada geográfica de referência. Nesta versão, municípios não são territórios conquistáveis separados; combates e cercos urbanos continuam ligados aos centros estratégicos.'));
    host.append(button('VER ESTADO DE MATO GROSSO DO SUL',()=>showDialog('province','ms'),'primary-btn'));
    return;
  }
  if(kind==='sector'){renderSectorDialog(id);return;}
  if(['sector_assault','sector_siege','sector_reinforce','sector_withdraw'].includes(kind)){renderSectorOrderDialog(id,kind);return;}
  if(kind==='sector_blockade'){renderSectorBlockadeDialog(id);return;}
  if(kind==='sector_relieve'){renderSectorReliefDialog(id);return;}
  if(kind==='sector_supply'||kind==='sector_fortify'){renderSectorMaintenanceDialog(id,kind);return;}
  if(kind==='proposal'){
    const proposal=state.diplomacy?.proposals.find(p=>p.id===Number(id)&&p.to===state.me?.nationId);
    if(!proposal){closeDialog();return;}
    const source=faction(proposal.from);
    const host=dialogIntro('DIPLOMACIA / PROPOSTA RECEBIDA','Proposta de paz');
    host.append(elem('p','dialog-lead',`${source?.name||proposal.from} oferece paz e cessar-fogo por 10 horas estratégicas. Você pode aceitar ou recusar.`));
    host.append(statGrid([['PRAZO','H +'+proposal.expiresTick,'Expiração da oferta'],['SITUAÇÃO',relationLabel(proposal.from),'Entre as facções']]));
    const accept=button('ACEITAR PAZ',()=>submitDiplomacy(accept,{type:'accept_peace',proposalId:proposal.id}),'primary-btn');
    const reject=button('RECUSAR OFERTA',()=>submitDiplomacy(reject,{type:'reject_peace',proposalId:proposal.id}),'secondary-btn');
    const row=elem('div','dialog-actions');row.append(accept,reject);host.append(row);return;
  }
  if(kind==='diplomatic-action'){
    const f=faction(id);if(!f){closeDialog();return;}
    const kindRelation=relation(id);
    const host=dialogIntro('DIPLOMACIA / CONFIRMAÇÃO',f.name);
    host.append(elem('p','dialog-lead',kindRelation==='war' ? `Você está em guerra contra ${f.name}. Uma proposta aceita estabelece cessar-fogo por 10 horas estratégicas.` : kindRelation==='truce' ? 'Existe cessar-fogo vigente. Não é possível iniciar novas ofensivas antes do término.' : `Declarar guerra contra ${f.name} torna o conflito público. Ao ordenar o primeiro ataque a um estado neutro, a guerra também é declarada automaticamente.`));
    if(kindRelation==='war' && f.player){const confirm=button('ENVIAR PROPOSTA DE PAZ',()=>submitDiplomacy(confirm,{type:'offer_peace',targetId:id}),'primary-btn');host.append(confirm);}
    else if(kindRelation==='war')host.append(elem('p','module-footnote','Este estado não tem um comandante humano para receber propostas de paz.'));
    else if(kindRelation==='neutral'){const confirm=button('CONFIRMAR DECLARAÇÃO DE GUERRA',()=>submitDiplomacy(confirm,{type:'declare_war',targetId:id}),'primary-btn');host.append(confirm);}
    else host.append(elem('p','module-footnote','Nenhuma ação disponível neste momento.'));
    return;
  }
  if(kind==='faction'){
    const f=faction(id);if(!f){closeDialog();return;}
    const host=dialogIntro('PERFIL DIPLOMÁTICO','Estado de '+f.name);
    host.append(elem('p','dialog-lead',f.player ? 'Comandado por '+f.player : 'Estado sem jogador atualmente.'));
    host.append(statGrid([['TERRITÓRIOS',f.provinces,'Controlados'],['REGIÃO',f.region,'Brasil fictício'],['RELAÇÃO',relationLabel(f.id),'Situação atual']]));
    if(f.id!==state.me?.nationId){host.append(groupTitle('Ações diplomáticas','A decisão será confirmada em uma janela separada.'));host.append(button(relation(f.id)==='war'?'NEGOCIAR PAZ':'GERENCIAR RELAÇÃO',()=>showDialog('diplomatic-action',id),'primary-btn'));}
    return;
  }
  const p=province(id);if(!p){closeDialog();return;}
  const f=faction(p.ownerId);
  if(kind==='province'){
    const host=dialogIntro(`${p.region.toUpperCase()} / ${p.sigla}`,p.name);
    host.append(elem('p','dialog-lead',`Controlado por ${f.name} · ${p.terrain} · ${p.port?'Com litoral ou porto':'Território interno'}.`));
    host.append(statGrid([['TROPAS',money(p.troops),'Efetivo estacionado'],['INDÚSTRIA',p.industry+'/4','Nível instalado'],['SUPRIMENTOS',own(p)?p.supply+'%':'Sigiloso','Situação logística'],['DEFESA',p.fort+'/3','Fortificações'],['BASE',p.base+'/3','Centro logístico'],['AERÓDROMO',p.airfield+'/2','Alcance aéreo'],['BATERIA',p.battery+'/2','Apoio de fogo']]));
    if(own(p)){host.append(elem('p','module-footnote',p.supplyDistance===null?'ISOLADO DA REDE: sem capital nem base conectada.':p.supplyDistance===0?'CENTRO LOGÍSTICO: capital ou base operacional.':'REDE LOGÍSTICA: '+p.supplyDistance+' fronteira(s) até centro logístico.'));}
    if(own(p)){host.append(groupTitle('Composição da guarnição','Unidades distribuídas por classe militar.'));host.append(statGrid(UNIT_ORDER.map(k=>[unit(k)?.name.toUpperCase()||k,money(p.units?.[k]||0),unit(k)?.short||k])));}
    const localCenters=state.sectors.filter(s=>s.provinceId===p.id);
    host.append(groupTitle('Cidades estratégicas',`${localCenters.length} localidades reais com guarnições e produção independentes.`));
    host.append(elem('p','module-footnote',`Sob controle do estado: ${localCenters.filter(c=>c.ownerId===p.ownerId).length}/${localCenters.length}. Abra a área exclusiva para ver cada cidade, guarnição e rota.`));
    host.append(button('VER CIDADES DO ESTADO',()=>{citiesViewUF=p.id;closeDialog();navigate('centers');},'primary-btn'));
    host.append(groupTitle('Territórios vizinhos','Os deslocamentos só podem ocorrer entre estados adjacentes.'));
    const chips=elem('div','neighbor-chips');for(const n of p.neighbors){const target=province(n);chips.append(elem('span',own(target)?'neighbor-chip ally':'neighbor-chip',target.sigla+' · '+target.name));}host.append(chips);
    if(own(p)){
      host.append(groupTitle('Ordens disponíveis','Cada ação tem sua própria janela, sem sobreposição.'));
      modalButtonRow(host,[['Mover / Atacar',()=>showDialog('move',id,true),true],['Recrutar',()=>showDialog('recruit',id,true),false],['Construir',()=>showDialog('build',id,true),false],['Fortificar',()=>showDialog('fort',id,true),false]]);
      host.append(groupTitle('Instalações e inteligência','Operações em janelas separadas.'));
      modalButtonRow(host,[['Base militar',()=>showDialog('base',id,true),false],['Aeródromo',()=>showDialog('airfield',id,true),false],['Bateria',()=>showDialog('battery',id,true),false],['Reconhecimento',()=>showDialog('recon',id,true),false]]);
      host.append(groupTitle('Missões de apoio','Ações com alcance próprio, sem ocupação territorial.'));
      modalButtonRow(host,[['Missão aérea',()=>showDialog('airstrike',id,true),true],['Bombardeio',()=>showDialog('barrage',id,true),false]]);
    }else{host.append(elem('p','module-footnote','Este estado não está sob seu comando. Para atacar, escolha uma guarnição própria adjacente.'));}
    return;
  }
  if (!own(p)){closeDialog();notice('Você não controla mais este território.',true);return;}
  if(kind==='move') renderMoveDialog(p);
  if(kind==='recruit') renderProductionDialog(p,'recruit');
  if(kind==='build') renderProductionDialog(p,'industry');
  if(kind==='fort') renderProductionDialog(p,'fort');
  if(kind==='base') renderProductionDialog(p,'base');
  if(kind==='airfield') renderProductionDialog(p,'airfield');
  if(kind==='battery') renderProductionDialog(p,'battery');
  if(kind==='airstrike'||kind==='barrage')renderSupportDialog(p,kind);
  if(kind==='recon') renderReconDialog(p);
}
function availableSectorOrigins(c,includeEnemy=false){
 const target=province(c.provinceId);
 return mine().filter(p=>p.id===c.provinceId||p.neighbors.includes(c.provinceId))
  .sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
}
function renderSectorDialog(id){
 const c=center(id);if(!c){closeDialog();return;}
 const p=province(c.provinceId),owner=faction(c.ownerId),mineCenter=ownCenter(c);
 const host=dialogIntro('CAMPANHA / CENTRO ESTRATÉGICO',c.name);
 host.append(elem('p','dialog-lead',`${c.geographicType==='regiao_administrativa'?'Região administrativa':'Cidade estratégica'} de ${p.name}. Controlada por ${owner?.name}. ${mineCenter?'Guarnição sob seu comando.':'Composição militar do adversário confidencial.'}`));
 host.append(statGrid([['POSSE',owner?.short||'?','Controle local'],['GUARNIÇÃO',c.troops+' UN.','Total público'],['FUNÇÃO',roleLabel(c.role),'Especialização regional'],['SUPRIMENTO',mineCenter?c.supply+'%':'SIGILOSO',mineCenter?(c.connected?'Ligada à rede':'Região isolada'):'Logística urbana']]));
 if(mineCenter){
  host.append(groupTitle('Composição da guarnição'));
  host.append(statGrid(UNIT_ORDER.map(k=>[unit(k)?.short||k,money(c.units?.[k]||0),unit(k)?.name||k])));
 }
 host.append(groupTitle('Economia local',`${roleLabel(c.role)} + função complementar: ${roleLabel(c.secondaryRole)}`));
 host.append(elem('p','module-footnote',`Receita base por turno em abastecimento pleno: ${roleIncome(c)}. Cerco e isolamento reduzem a produção. Os centros históricos também mantêm os tributos estaduais legados.`));
 host.append(groupTitle('Rotas táticas', 'Conexões fictícias entre centros. Bloqueios interrompem trânsito e receita.'));
 const connections=elem('div','neighbor-chips');for(const id of c.routeIds||[]){const other=center(id);if(other){const isBlock=(state.blockades||[]).some(b=>(b.sectorId===c.id&&b.routeId===id)||(b.routeId===c.id&&b.sectorId===id));connections.append(elem('span','neighbor-chip',other.name+(isBlock?' • BLOQUEADA':'')));}}host.append(connections);
 if(c.underSiege||c.underBlockade){host.append(elem('div','order-note',c.underSiege?'⚠ CIDADE SOB CERCO: o abastecimento cai enquanto a operação durar.':'⚠ ROTA BLOQUEADA: a produção e os suprimentos urbanos sofrem redução.'));}
 if(blockadeList(c).length)host.append(elem('p','module-footnote',blockadeList(c).map(b=>`Bloqueio: ${center(b.sectorId)?.name||'?'} ↔ ${center(b.routeId)?.name||'?'} · termina no turno ${b.expiresTick}`).join(' | ')));
 host.append(elem('p','module-footnote','Conquistar esta cidade não conquista automaticamente a unidade federativa.'));
 const origin=availableSectorOrigins(c),options=elem('div','dialog-actions');
 if(!mineCenter){
  if(origin.length){
    options.append(button(relation(c.ownerId)==='truce'?'CESSAR-FOGO ATIVO':'PLANEJAR OCUPAÇÃO',()=>showDialog('sector_assault',c.id,'sector'),'primary-btn'));
    if(relation(c.ownerId)!=='truce')options.append(button('INICIAR CERCO',()=>showDialog('sector_siege',c.id,'sector'),'secondary-btn'));
    if(relation(c.ownerId)!=='truce'&&c.routeIds.length)options.append(button('BLOQUEAR ROTA',()=>showDialog('sector_blockade',c.id,'sector'),'secondary-btn'));
  }
  else host.append(elem('p','module-footnote','Para atacar, controle um estado adjacente ou o próprio estado deste centro.'));
 }else if(origin.length){
  options.append(button('REFORÇAR GUARNIÇÃO',()=>showDialog('sector_reinforce',c.id,'sector'),'primary-btn'));
  if(c.troops>1)options.append(button('RETIRAR TROPAS',()=>showDialog('sector_withdraw',c.id,'sector'),'secondary-btn'));
  if(c.underSiege||c.underBlockade)options.append(button('ENVIAR SOCORRO',()=>showDialog('sector_relieve',c.id,'sector'),'primary-btn'));
  options.append(button('ENVIAR SUPRIMENTOS',()=>showDialog('sector_supply',c.id,'sector'),'secondary-btn'));
  if(c.fortLevel<3)options.append(button('FORTIFICAR CIDADE',()=>showDialog('sector_fortify',c.id,'sector'),'secondary-btn'));
 }
 if(options.childElementCount)host.append(options);
}
function renderSectorOrderDialog(id,kind){
 const c=center(id);if(!c){closeDialog();return;}
 const isWithdraw=kind==='sector_withdraw',isAttack=kind==='sector_assault'||kind==='sector_siege',isSiege=kind==='sector_siege';
 const host=dialogIntro('ESTADO-MAIOR / OPERAÇÃO LOCAL',isSiege?'Cercar centro estratégico':isAttack?'Ocupar centro estratégico':isWithdraw?'Retirar guarnição':'Reforçar centro estratégico');
 const origins=availableSectorOrigins(c).filter(p=>isWithdraw?true:p.troops>1);
 if((isAttack&&ownCenter(c))||(!isAttack&&!ownCenter(c))){host.append(empty('Ordem indisponível','A posse deste centro mudou. Atualize a campanha.'));return;}
 if(isAttack&&relation(c.ownerId)==='truce'){host.append(empty('Cessar-fogo vigente','Não é possível ordenar um ataque durante um acordo vigente.'));return;}
 if(!origins.length){host.append(empty('Sem origem elegível','Controle um estado vizinho com tropas disponíveis.'));return;}
 host.append(elem('p','dialog-lead',`${c.name} (${province(c.provinceId).sigla}) · ação em ${isSiege?'4':'2'} turnos. ${isSiege?'O cerco corta gradualmente o abastecimento até o confronto final. A defesa pode enviar socorro.':isAttack?'A ocupação exige infantaria e declara guerra se necessário.':'Selecione uma composição militar para transferir.'}`));
 const form=elem('form','order-form');
 const select=elem('select');select.id='sectorOrigin';
 for(const p of origins){const opt=elem('option','',`${p.name} · ${p.troops} unidades`);opt.value=p.id;select.append(opt);}
 addField(form,isWithdraw?'ESTADO DE RETORNO':'ESTADO DE ORIGEM',select);
 const inputHost=elem('div','sector-composition');form.append(inputHost);
 const submit=button('CONFIRMAR ORDEM',()=>{},'primary-btn');submit.type='submit';form.append(submit);
 let fields={};
 function refresh(){
  const p=province(select.value),source=isWithdraw?c:p;
  inputHost.replaceChildren();fields={};
  inputHost.append(groupTitle('Composição da força',isWithdraw?'Deixe uma unidade no centro.':'Deixe uma unidade no estado de origem.'));
  for(const k of UNIT_ORDER){
   const maximum=source.units?.[k]||0;
   const field=elem('input');field.type='number';field.min='0';field.max=String(maximum);field.step='1';field.required=true;
   field.value=String(k==='infantry'?Math.min(isAttack?35:12,Math.max(0,maximum-1)):0);
   field.disabled=maximum===0;field.id='sectorUnits_'+k;
   addField(inputHost,`${unit(k)?.name||k} · DISPONÍVEIS: ${maximum}`,field);fields[k]=field;
   field.addEventListener('input',validate);
  }
  validate();
 }
 function validate(){
  const source=isWithdraw?c:province(select.value),composition=Object.fromEntries(UNIT_ORDER.map(k=>[k,Number(fields[k].value)]));
  const amount=Object.values(composition).reduce((a,b)=>a+b,0);
  submit.disabled=amount<1||amount>=source.troops||(isAttack&&composition.infantry<1)||UNIT_ORDER.some(k=>!Number.isInteger(composition[k])||composition[k]<0||composition[k]>(source.units?.[k]||0));
 }
 select.addEventListener('change',refresh);
 form.addEventListener('submit',ev=>{ev.preventDefault();validate();if(submit.disabled)return;const composition=Object.fromEntries(UNIT_ORDER.map(k=>[k,Number(fields[k].value)]));submitOrder(submit,{type:kind,provinceId:select.value,sectorId:c.id,composition});});
 host.append(form);refresh();
}

function renderSectorBlockadeDialog(id){
 const c=center(id);if(!c){closeDialog();return;}
 const host=dialogIntro('LOGÍSTICA / INTERDIÇÃO','Bloquear rota estratégica');
 const origins=availableSectorOrigins(c),current=(state.blockades||[]);
 if(ownCenter(c)||relation(c.ownerId)==='truce'||!origins.length){host.append(empty('Bloqueio indisponível','É necessário controlar um estado de origem próximo e não estar em cessar-fogo.'));return;}
 const form=elem('form','order-form');host.append(elem('p','dialog-lead','Bloqueio temporário de 6 turnos após preparação de 1 turno. A rota permanece bloqueada até ser liberada, expirar ou haver paz. Não conquista território.'));
 const origin=elem('select');origin.id='blockadeOrigin';for(const p of origins){const o=elem('option','',p.name);o.value=p.id;origin.append(o);}addField(form,'ESTADO DE ORIGEM',origin);
 const route=elem('select');route.id='blockadeRoute';for(const routeId of c.routeIds||[]){const peer=center(routeId);const o=elem('option','',peer?.name||routeId);o.value=routeId;route.append(o);}addField(form,'ROTA PARA BLOQUEAR',route);
 const submit=button('INICIAR BLOQUEIO',()=>{},'primary-btn');submit.type='submit';form.append(submit);
 function refresh(){const occupied=current.some(b=>(b.sectorId===c.id&&b.routeId===route.value)||(b.routeId===c.id&&b.sectorId===route.value));submit.disabled=occupied||!hasResources(state.urbanActions.blockade.cost);}
 route.addEventListener('change',refresh);
 form.addEventListener('submit',e=>{e.preventDefault();refresh();if(!submit.disabled)submitOrder(submit,{type:'sector_blockade',provinceId:origin.value,sectorId:c.id,routeId:route.value});});
 host.append(groupTitle('Custo de bloqueio'));host.append(elem('p','module-footnote',Object.entries(state.urbanActions.blockade.cost).map(([k,v])=>`${RESOURCES.find(r=>r[0]===k)?.[1]||k}: ${v}`).join(' · ')));host.append(form);refresh();
}
function renderSectorReliefDialog(id){
 const c=center(id);if(!c){closeDialog();return;}
 const host=dialogIntro('LOGÍSTICA / CONTRAMEDIDA','Operação de socorro');
 const origins=availableSectorOrigins(c).filter(p=>(p.units?.infantry||0)>state.urbanActions.relieve.infantry);
 if(!ownCenter(c)||!origins.length||!(c.underSiege||c.underBlockade)){host.append(empty('Socorro indisponível','É preciso controlar a cidade, ter ao menos 16 unidades de infantaria na origem e existir cerco ou bloqueio.'));return;}
 host.append(elem('p','dialog-lead','Destaca 15 unidades de infantaria por 2 turnos para romper cercos e bloqueios. A força pode sofrer perdas e os sobreviventes retornam.'));
 const origin=elem('select');origin.id='reliefOrigin';for(const p of origins){const o=elem('option','',p.name+' · '+p.units.infantry+' inf.');o.value=p.id;origin.append(o);}addField(host,'ESTADO DE ORIGEM',origin);
 const cost=state.urbanActions.relieve.cost;host.append(groupTitle('Custo da operação'));host.append(elem('p','module-footnote',Object.entries(cost).map(([k,v])=>`${RESOURCES.find(r=>r[0]===k)?.[1]||k}: ${v}`).join(' · ')));
 const submit=button('ENVIAR SOCORRO',()=>submitOrder(submit,{type:'sector_relieve',provinceId:origin.value,sectorId:c.id}),'primary-btn');submit.disabled=!hasResources(cost);host.append(submit);
}
function renderSectorMaintenanceDialog(id,kind){
 const c=center(id);if(!c){closeDialog();return;}
 const host=dialogIntro('GESTÃO / CIDADE',kind==='sector_supply'?'Enviar suprimentos':'Fortificar cidade');
 const origins=availableSectorOrigins(c);if(!ownCenter(c)||!origins.length){host.append(empty('Ação indisponível','Não há centro ou origem sob seu comando.'));return;}
 if(kind==='sector_supply'&&(c.underSiege||c.underBlockade)){host.append(empty('Rota interrompida','Rompa o cerco ou o bloqueio antes de enviar comboios.'));return;}
 const spec=state.urbanActions[kind==='sector_supply'?'supply':'fortify'];
 host.append(elem('p','dialog-lead',kind==='sector_supply'?'Comboio urbano de 2 turnos, restaura até 38 pontos de suprimento.':'Obra urbana de 3 turnos, aumenta a defesa até o nível 3.'));
 const origin=elem('select');for(const p of origins){const o=elem('option','',p.name);o.value=p.id;origin.append(o);}addField(host,'ESTADO DE ORIGEM',origin);
 host.append(groupTitle('Custo'));host.append(elem('p','module-footnote',Object.entries(spec.cost).map(([k,v])=>`${RESOURCES.find(r=>r[0]===k)?.[1]||k}: ${v}`).join(' · ')));
 const submit=button('CONFIRMAR OPERAÇÃO',()=>submitOrder(submit,{type:kind,provinceId:origin.value,sectorId:c.id}),'primary-btn');submit.disabled=!hasResources(spec.cost)||(kind==='sector_fortify'&&c.fortLevel>=3);host.append(submit);
}

function addField(host,label,control) {const wrap=elem('label','field');wrap.append(elem('span','',label),control);host.append(wrap);return wrap;}
function renderMoveDialog(p) {
  const host=dialogIntro('CENTRAL DE OPERAÇÕES','Movimentar tropas');
  host.append(elem('p','dialog-lead',`Origem: ${p.name} · ${money(p.troops)} unidades em guarnição. A movimentação é calculada por tipo de unidade.`));
  if(p.troops<=1||!p.neighbors.length){host.append(empty('Movimento indisponível','Não há tropas excedentes ou rotas de fronteira nesta guarnição.'));return;}
  const form=elem('form','order-form');
  const select=elem('select');select.id='modalTarget';
  for(const id of p.neighbors){
    const dst=province(id),truce=relation(dst.ownerId)==='truce',opt=elem('option','',`${dst.name} — ${own(dst)?'Transferir':truce?'Cessar-fogo':'Atacar'}`);
    opt.value=dst.id;opt.disabled=truce;select.append(opt);
  }
  addField(form,'ESTADO DE DESTINO',select);
  form.append(groupTitle('Composição da força','Atribua quantidades para cada classe. Mantenha ao menos uma unidade na origem.'));
  const fields={};
  for(const k of UNIT_ORDER){
    const count=p.units?.[k]||0, input=elem('input');input.id=k==='infantry'?'modalUnits':'modalUnits_'+k;
    input.type='number';input.min='0';input.max=String(count);input.step='1';input.value=String(k==='infantry'?Math.min(20,Math.max(0,count-1)):0);
    input.required=true;input.disabled=count===0;
    addField(form,`${unit(k)?.name.toUpperCase()||k} · EM BASE: ${money(count)}`,input);fields[k]=input;
  }
  form.append(elem('div','order-note','A força avança na velocidade da unidade mais lenta. Blindados e aeronaves não ocupam estados sem infantaria sobrevivente. Fortificações, terreno e suprimento influenciam a batalha.'));
  const confirm=button('CONFIRMAR MOVIMENTAÇÃO',()=>{},'primary-btn');confirm.type='submit';form.append(confirm);
  form.addEventListener('submit',async ev=>{
    ev.preventDefault();if(!select.value||select.selectedOptions[0]?.disabled)return notice('Nenhum destino disponível: há cessar-fogo na fronteira.',true);
    const composition=Object.fromEntries(UNIT_ORDER.map(k=>[k,Number(fields[k].value)]));
    if(UNIT_ORDER.some(k=>!Number.isInteger(composition[k])||composition[k]<0||composition[k]>(p.units[k]||0)))return notice('Composição inválida. Confira as quantidades.',true);
    const total=UNIT_ORDER.reduce((n,k)=>n+composition[k],0);
    if(total<1||total>=p.troops)return notice('Mova pelo menos uma unidade e mantenha uma na origem.',true);
    await submitOrder(confirm,{type:'move',provinceId:p.id,targetId:select.value,composition});
  });
  host.append(form);
}
function hasResources(price){return Object.entries(price).every(([k,n])=>state.me.resources[k]>=n);}
function renderRecruitDialog(p) {
  const host=dialogIntro('PRODUÇÃO / FORÇAS MODERNAS','Recrutar tropas');
  host.append(elem('p','dialog-lead',`Estado: ${p.name} · indústria nível ${p.industry}/4. Escolha uma classe militar para produzir.`));
  const select=elem('select');select.id='recruitUnitType';
  for(const k of UNIT_ORDER){const spec=unit(k),opt=elem('option','',spec.name);opt.value=k;select.append(opt);}
  addField(host,'TIPO DE UNIDADE',select);
  const details=elem('div','recruit-details');host.append(details);
  const confirm=button('CONFIRMAR RECRUTAMENTO',()=>{},'primary-btn');host.append(confirm);
  function refresh(){
    const kind=select.value,spec=unit(kind),blocked=pending(p,'recruit',kind),locked=kind==='aircraft'&&p.industry<2;
    details.replaceChildren();
    details.append(elem('p','dialog-lead',spec.description));
    details.append(statGrid([['LOTE',money(spec.batch),'Unidades por ordem'],['CONCLUSÃO',spec.buildTicks+' H','Turnos estratégicos'],['ATAQUE',spec.attack,'Poder por unidade'],['DEFESA',spec.defense,'Poder por unidade']]));
    details.append(groupTitle('Custo de fabricação'));
    const cost=elem('div','cost-list');for(const [resource,n] of Object.entries(spec.cost))cost.append(itemRow(RESOURCES.find(r=>r[0]===resource)?.[1]||resource,`Em estoque: ${money(state.me.resources[resource])}`,money(n)));
    details.append(cost);
    const message=locked?'Aviação exige indústria nível 2 no território.':blocked?'Já existe um lote desta classe em produção neste estado.':!hasResources(spec.cost)?'Recursos insuficientes.':'O custo é debitado ao confirmar. Os lotes são concluídos automaticamente.';
    details.append(elem('p','module-footnote',message));
    confirm.disabled=locked||blocked||!hasResources(spec.cost);
  }
  select.addEventListener('change',refresh);
  confirm.addEventListener('click',()=>submitOrder(confirm,{type:'recruit_unit',provinceId:p.id,unitType:select.value}));
  refresh();
}
function renderReconDialog(p) {
  const host=dialogIntro('INTELIGÊNCIA / DRONES','Reconhecimento de fronteira');
  host.append(elem('p','dialog-lead',`Origem: ${p.name}. Exige base militar nível 1 e ao menos 2 drones na guarnição. A missão leva 2 turnos e observa a composição do inimigo por 6 turnos após a conclusão.`));
  host.append(statGrid([['BASE MILITAR',p.base+'/3','Requisito: nível 1'],['DRONES',p.units?.drones||0,'Requisito: 2'],['COMBUSTÍVEL','12','Custo único'],['ENERGIA','8','Custo único']]));
  const targets=p.neighbors.map(province).filter(t=>t&&!own(t));
  if(!targets.length){host.append(empty('Nenhuma fronteira adversária','Envie uma missão a partir de outro estado ou aguarde novas fronteiras.'));return;}
  const select=elem('select');select.id='reconTarget';
  for(const t of targets){const opt=elem('option','',t.name+' · '+faction(t.ownerId)?.short);opt.value=t.id;select.append(opt);}
  addField(host,'ESTADO PARA OBSERVAÇÃO',select);
  const confirm=button('DESPACHAR DRONES',()=>submitOrder(confirm,{type:'recon',provinceId:p.id,targetId:select.value}),'primary-btn');
  confirm.disabled=p.base<1||(p.units?.drones||0)<2||state.me.resources.fuel<12||state.me.resources.energy<8;
  host.append(elem('p','module-footnote',confirm.disabled?'Faltam bases, drones ou recursos para enviar a missão.':'A missão não declara guerra nem permite ocupar o território. O relatório só aparece para você.'));
  host.append(confirm);
}
// Operações separadas por janela. O cliente só orienta; servidor revalida tudo.
function operationalDistance(fromId,toId) {
  if(fromId===toId)return 0;
  const explored=new Set([fromId]), queue=[[fromId,0]];
  for(let i=0;i<queue.length;i++) {
    const [id,depth]=queue[i];
    for(const neighbor of (province(id)?.neighbors||[])) {
      if(neighbor===toId)return depth+1;
      if(!explored.has(neighbor)){explored.add(neighbor);queue.push([neighbor,depth+1]);}
    }
  }
  return Infinity;
}
function renderSupportDialog(p,kind) {
  const isAir=kind==='airstrike',spec=state.supportMissions[kind];
  const facility=isAir?'airfield':'battery',classId=isAir?'aircraft':'artillery';
  const host=dialogIntro(isAir?'FORÇA AÉREA / MISSÃO':'ARTILHARIA / APOIO',spec.name);
  const range=isAir?p.airfield+1:1,available=p.units?.[classId]||0;
  host.append(elem('p','dialog-lead',`Origem: ${p.name}. Requer ${isAir?'aeródromo militar':'bateria de artilharia'} e guerra declarada. Alcance: ${range} fronteira(s). Não conquista território.`));
  host.append(statGrid([['INSTALAÇÃO',p[facility]+'/2','Nível atual'],['DISPONÍVEIS',available,unit(classId)?.name||classId],['DURAÇÃO',spec.ticks+' H','Processamento pelo servidor'],['ABASTECIMENTO',p.supply+'%','Influencia o dano']]));
  const destinations=state.provinces.filter(t=>!own(t)&&relation(t.ownerId)==='war'&&operationalDistance(p.id,t.id)<=range);
  if(p[facility]===0){host.append(empty('Instalação necessária',`Construa ${isAir?'um aeródromo':'uma bateria'} antes de executar esta missão.`));host.append(button('ABRIR CONSTRUÇÃO',()=>showDialog(facility,p.id,true),'secondary-btn'));return;}
  if(!destinations.length){host.append(empty('Nenhum alvo elegível','Declare guerra a uma facção dentro do alcance, respeitando os cessar-fogos.'));return;}
  const selection=elem('select');selection.id='supportTarget';
  for(const t of destinations.sort((a,b)=>operationalDistance(p.id,a.id)-operationalDistance(p.id,b.id))){const option=elem('option','',`${t.name} — ${operationalDistance(p.id,t.id)} fronteira(s)`);option.value=t.id;selection.append(option);}
  addField(host,'DESTINO DA MISSÃO',selection);
  const count=elem('input');count.type='number';count.id='supportCount';count.step='1';count.min=String(spec.min);count.max=String(Math.min(available,spec.max));count.value=String(Math.min(available,spec.min));
  addField(host,`QUANTIDADE DE ${isAir?'AERONAVES':'PEÇAS DE ARTILHARIA'} (MÁX. ${spec.max})`,count);
  const costSection=elem('div','support-price');host.append(costSection);
  const confirm=button(isAir?'AUTORIZAR MISSÃO AÉREA':'AUTORIZAR BOMBARDEIO',()=>{},'primary-btn');host.append(confirm);
  function refresh(){
    const n=Number(count.value),price=Object.fromEntries(Object.entries(spec.cost).map(([k,v])=>[k,v+(spec.perUnit[k]||0)*n]));
    const valid=Number.isInteger(n)&&n>=spec.min&&n<=spec.max&&n<=available;
    const busy=pending(p,kind);
    costSection.replaceChildren();costSection.append(groupTitle('Recursos consumidos na missão'));
    const list=elem('div','cost-list');for(const [k,cost] of Object.entries(price))list.append(itemRow(RESOURCES.find(([id])=>id===k)?.[1]||k,`Disponível: ${money(state.me.resources[k])}`,money(cost)));costSection.append(list);
    costSection.append(elem('p','module-footnote',busy?'Já existe missão deste tipo partindo desta instalação.':!valid?'Quantidade indisponível nesta guarnição.':!hasResources(price)?'Recursos insuficientes.':'As unidades serão reservadas até a missão terminar, quando os sobreviventes retornarão.'));
    confirm.disabled=busy||!valid||!hasResources(price);
  }
  count.addEventListener('input',refresh);
  confirm.addEventListener('click',()=>submitOrder(confirm,{type:kind,provinceId:p.id,targetId:selection.value,unitCount:Number(count.value)}));
  refresh();
}
function renderProductionDialog(p,kind) {
  if(kind==='recruit')return renderRecruitDialog(p);
  const defs={
    industry:{eyebrow:'INFRAESTRUTURA / INDÚSTRIA',title:'Expandir indústria',info:'Aumenta a produção permanente do território.',current:p.industry,max:4,buildTicks:4},
    fort:{eyebrow:'DEFESA / FORTIFICAÇÕES',title:'Fortificar estado',info:'Eleva a resistência contra ataques inimigos.',current:p.fort,max:3,buildTicks:3},
    base:{eyebrow:'LOGÍSTICA / BASES',title:'Construir base militar',info:'Cria um centro logístico, habilita reconhecimento por drones e aumenta a defesa local.',current:p.base,max:3,buildTicks:4},
    airfield:{eyebrow:'AVIAÇÃO / AERÓDROMOS',title:'Instalar aeródromo militar',info:'Habilita missões aéreas; alcance de 2 fronteiras no nível 1 ou 3 no nível 2.',current:p.airfield,max:2,buildTicks:4},
    battery:{eyebrow:'ARTILHARIA / BATERIAS',title:'Instalar bateria de artilharia',info:'Habilita bombardeios de apoio a estados vizinhos em guerra.',current:p.battery,max:2,buildTicks:3},
  };
  const spec=defs[kind];if(!spec)return;
  const host=dialogIntro(spec.eyebrow,spec.title);
  host.append(elem('p','dialog-lead',p.name+' · '+spec.info));
  const blocked=pending(p,kind),full=spec.current>=spec.max;
  host.append(statGrid([['NÍVEL ATUAL',spec.current+'/'+spec.max,'Instalado'],['CONCLUSÃO',spec.buildTicks+' H','Turnos do jogo']]));
  host.append(groupTitle('Custos da ordem'));
  const costList=elem('div','cost-list');for(const [k,value] of Object.entries(PRICES[kind])){
    const label=RESOURCES.find(([key])=>key===k)?.[1]||k;
    costList.append(itemRow(label,'Estoque atual: '+money(state.me.resources[k]),money(value)));
  }host.append(costList);
  host.append(elem('div','order-note',full?'Nível máximo atingido.':blocked?'Já existe uma ordem deste tipo neste estado.':!hasResources(PRICES[kind])?'Seus recursos são insuficientes.':'Os custos serão debitados na confirmação. A obra será concluída pelo servidor.'));
  const confirm=button(kind==='industry'?'CONFIRMAR CONSTRUÇÃO':kind==='fort'?'CONFIRMAR FORTIFICAÇÃO':'CONSTRUIR BASE MILITAR',()=>submitOrder(confirm,{type:kind,provinceId:p.id}),'primary-btn');
  confirm.disabled=full||blocked||!hasResources(PRICES[kind]);host.append(confirm);
}
async function submitDiplomacy(b,input) {
  if (!token) return notice('Assuma um estado antes de jogar.',true);
  b.disabled=true;
  try {await post('/api/diplomacy',authMode?{...input,matchId,expectedRevision:state.revision,requestId:b._requestId||(b._requestId=newRequestId())}:{token,...input});closeDialog();notice('Decisão diplomática registrada pelo servidor.');await fetchState();}
  catch(e){b.disabled=false;notice(e.message||'Ação diplomática recusada.',true);}
}
async function submitOrder(b,input) {
  if (!token) return notice('Assuma um estado antes de jogar.',true);
  b.disabled=true;
  try {await post('/api/order',authMode?{...input,matchId,expectedRevision:state.revision,requestId:b._requestId||(b._requestId=newRequestId())}:{token,...input});closeDialog();notice('Ordem confirmada pelo servidor.');await fetchState();}
  catch(e){b.disabled=false;notice(e.message||'A ordem não pôde ser confirmada.',true);}
}
function closeMoreMenu(){ $('#moreMenu').classList.add('hidden');$('#moreButton').setAttribute('aria-expanded','false'); }
async function fetchMatches(){
 try {
  const res=await fetch('/api/matches',{cache:'no-store'});if(!res.ok)throw Error('Salas indisponíveis.');
  const data=await res.json(),picker=$('#matchPicker');picker.replaceChildren();
  if(!data.matches.some(m=>m.id===matchId)){
   matchId=data.defaultMatchId;localStorage.setItem('dg-match-id',matchId);
  }
  for(const m of data.matches){const o=elem('option','',m.name+' · '+m.players+'/27 jogadores · H+'+m.tick);o.value=m.id;picker.append(o);}
  picker.value=matchId;
 }catch(e){notice('Não foi possível carregar as salas: '+e.message,true);}
}
$('#matchPicker').addEventListener('change',async(e)=>{
 matchId=e.target.value;localStorage.setItem('dg-match-id',matchId);
 token=authMode?(state?.account?'AUTH_COOKIE':null):(localStorage.getItem('dg-token-'+matchId)||null);chosenFaction=null;live?.close();live=null;
 closeDialog();await fetchState();if(token)connectLive();
});
$('#createMatchButton').addEventListener('click',async()=>{
 const button=$('#createMatchButton'),name=$('#newMatchName').value.trim();button.disabled=true;
 try{const created=await post('/api/matches',{name});matchId=created.id;localStorage.setItem('dg-match-id',matchId);token=authMode?'AUTH_COOKIE':null;chosenFaction=null;await fetchMatches();await fetchState();notice('Campanha criada no servidor. Escolha seu estado.');}
 catch(e){notice(e.message,true);}finally{button.disabled=false;}
});
$('#joinButton').addEventListener('click',async()=>{
  const name=authMode?state?.account?.displayName:$('#commanderName').value.trim();
  if(!chosenFaction)return notice('Selecione um estado.',true);
  try {const result=await post('/api/join',{name,nationId:chosenFaction,matchId});token=authMode?'AUTH_COOKIE':result.token;if(!authMode){localStorage.setItem('dg-token-'+matchId,token);if(matchId==='brasil-01')localStorage.setItem('dg-token',token);}notice('Comando assumido. Boa campanha!');await fetchState();connectLive();}
  catch(e){notice(e.message,true);await fetchState();}
});
$('#stateSearch').addEventListener('input',renderPicker);
for(const b of document.querySelectorAll('[data-page]'))b.addEventListener('click',()=>navigate(b.dataset.page));
$('#moreButton').addEventListener('click',()=>{const visible=$('#moreMenu').classList.toggle('hidden');$('#moreButton').setAttribute('aria-expanded',String(!visible));});
$('#quickState').addEventListener('change',ev=>{if(ev.target.value)openProvince(ev.target.value);});
$('#zoomIn').addEventListener('click',()=>setZoom(.5));
$('#zoomOut').addEventListener('click',()=>setZoom(-.5));
$('#sectorToggle').addEventListener('click',()=>{showCenters=!showCenters;renderMap();});
for (const btn of document.querySelectorAll('[data-quick]')) btn.addEventListener('click',()=>commandQuick(btn.dataset.quick));
$('#mobileTacticalButton').addEventListener('click',()=>commandQuick('inspect'));
$('#selectionInspect').addEventListener('click',()=>commandQuick('inspect'));
$('#mapExpand').addEventListener('click',()=>toggleExpandedMap());
$('#dialogClose').addEventListener('click',closeDialog);
$('#dialogBack').addEventListener('click',()=>{if(dialogState?.fromProvince==='sector')showDialog('sector',dialogState.id);else if(dialogState?.fromProvince)showDialog('province',dialogState.id);});
$('#gameDialog').addEventListener('close',()=>{dialogState=null;});
window.addEventListener('hashchange',()=>{closeMoreMenu();closeDialog();renderPage();});
window.addEventListener('keydown',ev=>{if(ev.key==='Escape'){closeMoreMenu();if(document.body.classList.contains('map-fullscreen'))toggleExpandedMap(false);}});
window.addEventListener('click',ev=>{if(!ev.target.closest('#moreMenu,#moreButton'))closeMoreMenu();});
// Contas com autenticação e sessões persistentes no backend.
function setAuthPage(mode){
 authPage=mode;const titles={login:['Entre na sua conta','ENTRAR NA CAMPANHA'],register:['Crie seu comandante','CRIAR CONTA'],recover:['Recuperar acesso','REDEFINIR SENHA']};
 $('#authTitle').textContent=titles[mode][0];$('#authSubmit').textContent=titles[mode][1];
 $('#authDisplayNameField').classList.toggle('hidden',mode!=='register');$('#authRecoveryField').classList.toggle('hidden',mode!=='recover');$('#authInviteField').classList.toggle('hidden',mode!=='register'||!inviteRequired);
 $('#authPasswordLabel').textContent=mode==='recover'?'NOVA SENHA':'SENHA';
 $('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';
 $('#authSubtitle').textContent=mode==='recover'?'Use o código de recuperação recebido ao criar sua conta.':'Uma conta por jogador, com estados vinculados separadamente em cada campanha.';
 document.querySelectorAll('[data-auth-mode]').forEach(b=>b.classList.toggle('active',b.dataset.authMode===mode));
}
document.querySelectorAll('[data-auth-mode]').forEach(b=>b.addEventListener('click',()=>setAuthPage(b.dataset.authMode)));
$('#authForm').addEventListener('submit',async ev=>{
 ev.preventDefault();const button=$('#authSubmit');button.disabled=true;
 try{
  const body={username:$('#authUsername').value.trim(),password:$('#authPassword').value};
  let result;
  if(authPage==='register'){body.displayName=$('#authDisplayName').value.trim();if(inviteRequired)body.inviteCode=$('#authInviteCode').value.trim();result=await post('/api/auth/register',body);}
  else if(authPage==='recover'){body.code=$('#authRecovery').value.trim();result=await post('/api/auth/recover',body);}
  else result=await post('/api/auth/login',body);
  if(result.recoveryCode){$('#recoveryCodeValue').textContent=result.recoveryCode;$('#recoveryDialog').showModal();}
  if(authPage==='recover'){setAuthPage('login');notice('Senha alterada. Faça login com sua nova senha.');}
  else{await fetchState();if(state?.me)connectLive();notice('Conta autenticada. Boas operações!');}
 }catch(e){notice(e.message||'Erro de autenticação.',true);}finally{button.disabled=false;}
});
$('#recoveryAcknowledged').addEventListener('click',()=>{$('#recoveryDialog').close();$('#recoveryCodeValue').textContent='';});
$('#copyRecoveryCode').addEventListener('click',()=>navigator.clipboard?.writeText($('#recoveryCodeValue').textContent).then(()=>notice('Código copiado.')).catch(()=>notice('Selecione e copie manualmente.',true)));
$('#logoutButton').addEventListener('click',async()=>{
 try{await post('/api/auth/logout',{});live?.close();live=null;token=null;closeDialog();await fetchState();notice('Você saiu da conta.');}
 catch(e){notice(e.message,true);}
});
setAuthPage('login');
fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>r.json()).then(v=>{inviteRequired=!!v.inviteRequired;setAuthPage(authPage);}).catch(()=>{});
setZoom(0);
fetchMatches().then(()=>fetchState()).then(()=>{if(token&&state?.me)connectLive();});
setInterval(fetchState,12000);

window.addEventListener('resize',()=>renderMunicipalities());
