from pathlib import Path
root=Path(__file__).parent
eng=root/'src/engine.mjs'; s=eng.read_text()
a=s.index('export const FACTIONS = ['); b=s.index('\n\nconst RESOURCE_START',a)
s=s[:a]+'''const REGION_PALETTE = {
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
});''' + s[b:]
s=s.replace('version: 1,','version: 2,')
s=s.replace('troops: 60 + (i % 4) * 12 + (p.capital ? 50 : 0),','troops: 120,')
s=s.replace('industry: p.capital ? 2 : 1,','industry: 1,')
s=s.replace('fort: p.capital ? 1 : 0,','fort: 0,')
s=s.replace("message: 'O mundo entrou em estado de alerta. Quatro potências disputam a supremacia regional.'", "message: 'Cenário alternativo: as 27 unidades federativas disputam o controle do Brasil.'")
s=s.replace("throw new Error('País inválido.')", "throw new Error('Estado inválido.')")
s=s.replace("throw new Error('Este país já está ocupado.')", "throw new Error('Este estado já está ocupado.')")
s=s.replace("${player.name} assumiu o governo da ${game.nations[nationId].name}.", "${player.name} assumiu o comando de ${game.nations[nationId].name}.")
s=s.replace('MAP.map((p, i) => ({','MAP.map((p) => ({')
s=s.replace("const previousOwner = target.ownerId;\n    target.ownerId", "target.ownerId")
s=s.replace('    void previousOwner;\n','')
s=s.replace("game.provinces.map(({ id, name, ownerId, troops, industry, fort, morale, terrain, neighbors, x, y, path, capital, port }) => ({ id, name, ownerId, troops, industry, fort, morale, terrain, neighbors, x, y, path, capital, port }))", "game.provinces.map(({ id, sigla, name, region, ownerId, troops, industry, fort, morale, terrain, neighbors, x, y, path, capital, port }) => ({ id, sigla, name, region, ownerId, troops, industry, fort, morale, terrain, neighbors, x, y, path, capital, port }))")
eng.write_text(s)
server=root/'server.mjs';ss=server.read_text().replace("join(ROOT, '.data', 'session.json')","join(ROOT, '.data', 'brasil-session.json')")
ss=ss.replace("let game = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : createGame();", "let game = existsSync(DATA) ? JSON.parse(readFileSync(DATA, 'utf8')) : createGame();\nif (game.version !== 2) throw new Error('Arquivo de campanha incompatível: utilize um DATA_FILE novo para o mapa do Brasil.');")
server.write_text(ss)
html=root/'public/index.html';s=html.read_text()
subs={
'DOMÍNIO GLOBAL | Comando Estratégico':'DOMÍNIO BRASIL | Comando Estratégico',
'Domínio Global — protótipo multiplayer de estratégia militar contemporânea.':'Domínio Brasil — simulação fictícia de estratégia territorial no mapa brasileiro.',
'DOMÍNIO <span>GLOBAL</span>':'DOMÍNIO <span>BRASIL</span>',
'COMANDO ESTRATÉGICO · MVP 0.1':'GUERRA MODERNA · MVP 0.2',
'CENÁRIO: FRONTEIRAS DO ATLÂNTICO':'CENÁRIO: BRASIL ALTERNATIVO',
'Escolha uma nação para assumir o comando.':'Escolha um estado para assumir o comando.',
'Selecione um país para jogar':'Selecione um estado para jogar',
'Economia nacional':'Economia estadual',
'ESTADO DO MUNDO':'CONTROLE TERRITORIAL',
'24 províncias':'27 estados',
'4 potências':'27 comandos',
'OCEANO DO NORTE':'',
'MAR DE MERIDIAN':'OCEANO ATLÂNTICO',
'DG / WORLD INTELLIGENCE':'DOMÍNIO BRASIL / COMANDO TÁTICO',
'ATLANTIC OPERATIONS SECTOR / 01':'BRASIL / 27 UNIDADES FEDERATIVAS',
'Selecione uma província':'Selecione um estado',
'Toque em um território no mapa para consultar o controle, as forças e emitir ordens.':'Toque em um estado no mapa para consultar tropas, recursos e emitir ordens.',
'Assuma o controle de uma potência.':'Escolha um estado para comandar.',
'Quatro nações competem por território e influência. Escolha uma e comece sua campanha de guerra moderna.':'Cenário fictício: os 26 estados e o Distrito Federal disputam território. Escolha seu comando e comece a campanha.',
'SELECIONE UMA NAÇÃO':'SELECIONE UMA UNIDADE FEDERATIVA',
'uma vaga por país':'uma vaga por estado',
'DOMÍNIO GLOBAL <span>© PROTÓTIPO</span>':'DOMÍNIO BRASIL <span>© PROTÓTIPO</span>',
'ESCALA ESTRATÉGICA • 01':'BRASIL • CENÁRIO FICTÍCIO',
'GRAU DE ALERTA: ELEVADO':'27 COMANDOS REGIONAIS',
'área de operações':'território brasileiro',
'Clique em uma província':'Clique em um estado',
'CLIQUE EM UMA PROVÍNCIA PARA OPERAR':'SELECIONE UM ESTADO PARA OPERAR',
}
for a,b in subs.items():s=s.replace(a,b)
s=s.replace('  <div class="eyebrow pick-label">SELECIONE UMA UNIDADE FEDERATIVA</div><div id="factionPicker"', '  <div class="eyebrow pick-label">SELECIONE UMA UNIDADE FEDERATIVA</div><input id="stateSearch" type="search" placeholder="Buscar estado ou sigla (ex.: MS)" autocomplete="off" aria-label="Pesquisar estado"><div id="factionPicker"')
s=s.replace('Mapa estratégico clicável com 27 estados, países e seus exércitos','Mapa estratégico do Brasil com 27 estados clicáveis e seus exércitos')
html.write_text(s)
app=root/'public/app.js';s=app.read_text()
s=s.replace("'TEATRO DE OPERAÇÕES / ZONA 01'", "'BRASIL / CAMPANHA FICTÍCIA'")
s=s.replace("'Economia nacional'", "'Economia estadual'")
s=s.replace("'MINISTÉRIO DA ECONOMIA / SUPRIMENTOS'", "'GESTÃO ESTADUAL / SUPRIMENTOS'")
s=s.replace("'Diplomacia mundial'", "'Diplomacia regional'")
s=s.replace("'MINISTÉRIO DAS RELAÇÕES EXTERIORES'", "'COMANDO / RELAÇÕES INTERESTADUAIS'")
s=s.replace("'AGÊNCIA DE INFORMAÇÕES / ALERTAS'", "'CENTRAL DE INTELIGÊNCIA / ALERTAS'")
s=s.replace("data.provinces.length + ' províncias'", "data.provinces.length + ' estados' ")
s=s.replace("'Escolha uma nação para assumir o comando.'", "'Escolha um estado para assumir o comando.'")
s=s.replace("'Sem comando'; $('#nationCommander').textContent = 'Selecione um país para jogar'", "'Sem comando'; $('#nationCommander').textContent = 'Selecione um estado para jogar'")
# cut rankings at top eight for clarity; include own nation even if below eight
s=s.replace("for (const f of [...state.factions].sort((a,b)=>b.provinces - a.provinces)) {", "const ranked = [...state.factions].sort((a,b)=>b.provinces - a.provinces || a.name.localeCompare(b.name, 'pt-BR'));\n  const top = ranked.slice(0, 8);\n  const mine = ranked.find(f=>f.id===state.me?.nationId);\n  if (mine && !top.some(f=>f.id===mine.id)) top.push(mine);\n  for (const f of top) {")
s=s.replace("labels.append(nodeSvg('text', {x:p.x,y:p.y-12,class:'province-name'},p.name));\n    labels.append(nodeSvg('text', {x:p.x,y:p.y+11,class:'province-count'},String(p.troops)));\n    if(p.capital) labels.append(nodeSvg('text', {x:p.x+27,y:p.y-30,fill:'#f6e9a8','font-size':17,class:'province-marker'},'★'));\n    if(p.port) labels.append(nodeSvg('text', {x:p.x-30,y:p.y+24,fill:'#a5d9e4','font-size':16,class:'province-marker'},'⚓'));", "const tiny = ['df','se','al','pb','rn','es','rj'].includes(p.id);\n    labels.append(nodeSvg('text', {x:p.x,y:p.y-(tiny?0:6),class:'province-name'},p.sigla));\n    if (!tiny) labels.append(nodeSvg('text', {x:p.x,y:p.y+13,class:'province-count'},String(p.troops)));\n    if (p.id==='df') {\n      const hit = nodeSvg('circle', { cx:p.x,cy:p.y,r:10,fill:'transparent',stroke:'#fff2c0','stroke-width':1.7,class:'capital-hit',tabindex:'0',role:'button','aria-label':'Distrito Federal — selecionar' });\n      hit.addEventListener('click',()=>selectProvince(p.id));\n      hit.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectProvince(p.id);}});\n      labels.append(hit);\n    }")
s=s.replace("for(const f of state.factions){ const item = make('span','legend-item'); const sw = make('i');sw.style.background=f.color;item.append(sw,make('span','',f.short));legend.append(item); }", "for(const region of ['Norte','Nordeste','Centro-Oeste','Sudeste','Sul']){ const f=state.factions.find(x=>x.region===region);const item=make('span','legend-item');const sw=make('i');sw.style.background=f.color;item.append(sw,make('span','',region));legend.append(item); }")
s=s.replace("'★ CAPITAL · '","'◈ COMANDO ESTADUAL · '")
s=s.replace("'⚓ PORTO · '","'⚓ LITORAL/PORTO · '")
s=s.replace("' · TERRITÓRIO '","' · UF '")
s=s.replace("  for(const f of state.factions){\n    const btn", "  const term = ($('#stateSearch')?.value || '').trim().toLocaleLowerCase('pt-BR');\n  for(const f of state.factions.filter(x=>!term || (x.name+' '+x.short).toLocaleLowerCase('pt-BR').includes(term))){\n    const btn")
s=s.replace("`${f.provinces} províncias · Disponível`", "`${f.region} · Disponível`")
s=s.replace("`Ocupado por ${f.player}`", "`Ocupado por ${f.player}`")
s=s.replace("'Assuma o governo de uma potência para obter os dados do comando.'", "'Assuma o comando de um estado para consultar os dados da campanha.'")
s=s.replace('em ${mine.length} províncias.', 'em ${mine.length} estados.')
s=s.replace('`Unidades distribuídas por ${mine.length} províncias sob controle.`', '`Unidades distribuídas por ${mine.length} estados sob controle.`')
s=s.replace('`${f.provinces} províncias controladas.`','`${f.provinces} estados controlados.`')
s=s.replace("'SUA NAÇÃO':'POTÊNCIA EXTERNA'", "'SEU COMANDO':'OUTRO COMANDO'")
s=s.replace("'Províncias estrangeiras adjacentes ao seu território: '", "'Estados adjacentes sob outros comandos: '")
s=s.replace("'Nenhum país estrangeiro faz fronteira com seu território.'", "'Nenhum comando adversário faz fronteira com seu território.'")
s=s.replace("'Selecione uma nação.'", "'Selecione um estado.'")
s=s.replace("'Assuma uma nação antes de jogar.'", "'Assuma um estado antes de jogar.'")
s=s.replace("'Treinamento de tropas'", "'Recrutamento de tropas'")
s += "\n$('#stateSearch')?.addEventListener('input', renderPicker);\n"
app.write_text(s)
css=root/'public/styles.css'
s=css.read_text()+'''\n/* Brasil alpha — seletor de 27 UFs e mapa com bordas estaduais */\n.faction-picker{max-height:280px;overflow-y:auto;overscroll-behavior:contain;padding:3px;scrollbar-color:#3f7388 #0d2030}
.faction-choice{min-height:65px;padding:10px}
.faction-choice .faction-icon{font-size:15px;font-family:'Barlow Condensed',sans-serif;letter-spacing:1px;min-width:26px}
#stateSearch{margin-bottom:10px}
.province{stroke:#bdd3d4;stroke-width:1.25;stroke-opacity:.72}
.capital-hit{cursor:pointer;pointer-events:all}
.map-legend{max-width:390px;flex-wrap:wrap;justify-content:flex-end}
@media(max-width:700px){.faction-picker{max-height:260px}.map-legend{max-width:220px}}
'''
css.write_text(s)
