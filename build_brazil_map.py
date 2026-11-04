"""Generate 27-UF playable map from the simplified state outlines in data/state_shapes.txt.
Source of outlines: https://github.com/henriquemalvar/br-geojson (derived from IBGE).
The simplified border geometry is for game visualization, not for legal cartography.
"""
import json
from pathlib import Path
ROOT = Path(__file__).parent
NAMES = {
 'AC':'Acre','AL':'Alagoas','AP':'Amapá','AM':'Amazonas','BA':'Bahia','CE':'Ceará',
 'DF':'Distrito Federal','ES':'Espírito Santo','GO':'Goiás','MA':'Maranhão','MT':'Mato Grosso',
 'MS':'Mato Grosso do Sul','MG':'Minas Gerais','PA':'Pará','PB':'Paraíba','PR':'Paraná',
 'PE':'Pernambuco','PI':'Piauí','RJ':'Rio de Janeiro','RN':'Rio Grande do Norte',
 'RS':'Rio Grande do Sul','RO':'Rondônia','RR':'Roraima','SC':'Santa Catarina',
 'SP':'São Paulo','SE':'Sergipe','TO':'Tocantins'}
REGIONS = {
 'Norte': 'AC AP AM PA RO RR TO',
 'Nordeste': 'AL BA CE MA PB PE PI RN SE',
 'Centro-Oeste': 'DF GO MT MS',
 'Sudeste': 'ES MG RJ SP',
 'Sul': 'PR RS SC',
}
# Geographic border adjacency; each pair is normalized to be undirected.
BORDERS = {
 'AC':'AM RO',
 'AL':'BA PE SE',
 'AP':'PA',
 'AM':'AC MT PA RO RR',
 'BA':'AL ES GO MG PE PI SE TO',
 'CE':'PB PE PI RN',
 'DF':'GO',
 'ES':'BA MG RJ',
 'GO':'BA DF MG MS MT TO',
 'MA':'PA PI TO',
 'MT':'AM GO MS PA RO TO',
 'MS':'GO MG MT PR SP',
 'MG':'BA ES GO MS RJ SP',
 'PA':'AM AP MA MT RR TO',
 'PB':'CE PE RN',
 'PR':'MS SC SP',
 'PE':'AL BA CE PB PI',
 'PI':'BA CE MA PE TO',
 'RJ':'ES MG SP',
 'RN':'CE PB',
 'RO':'AC AM MT',
 'RR':'AM PA',
 'RS':'SC',
 'SC':'PR RS',
 'SE':'AL BA',
 'SP':'MG MS PR RJ',
 'TO':'BA GO MA MT PA PI',
}
PORTS = set('AP PA MA CE RN PB PE AL SE BA ES RJ SP PR SC RS AM'.split())
URBAN = set('DF RJ SP'.split())
MOUNTAIN = set('MG ES RJ'.split())
FOREST = set('AC AM AP PA RO RR'.split())
REGION_BY_UF = {code:reg for reg,codes in REGIONS.items() for code in codes.split()}
lines = (ROOT/'data'/'state_shapes.txt').read_text().strip().splitlines()
shapes = {}
for row in lines:
 code,pt,path=row.split('|',2)
 shapes[code]=(list(map(int,pt.split(','))),path)
assert len(NAMES)==27 and len(shapes)==27 and set(NAMES)==set(shapes)==set(BORDERS)==set(REGION_BY_UF)
for code,others in BORDERS.items():
 for other in others.split():
  assert code in BORDERS[other].split(), f'{code}↔{other} asymmetrical'
mapdata=[]
for code in sorted(NAMES):
 (x,y),path=shapes[code]
 terrain='urbano' if code in URBAN else 'montanha' if code in MOUNTAIN else 'floresta' if code in FOREST else 'planície'
 mapdata.append({
  'id':code.lower(),'sigla':code,'name':NAMES[code],'region':REGION_BY_UF[code],
  'ownerId':code.lower(),'path':path,'x':x,'y':y,
  'neighbors':sorted(n.lower() for n in BORDERS[code].split()),
  'capital':True,'port':code in PORTS,'terrain':terrain,
 })
(ROOT/'src'/'map.json').write_text(json.dumps(mapdata,ensure_ascii=False,separators=(',',':'))+'\n')
print(f'Brasil: {len(mapdata)} UFs | {sum(len(p["neighbors"]) for p in mapdata)//2} fronteiras interestaduais')
