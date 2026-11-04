import json
from shapely.geometry import Polygon, MultiPoint, Point
from shapely import voronoi_polygons
land=Polygon([(145,128),(260,80),(360,94),(462,68),(590,91),(720,73),(835,123),(922,187),(950,279),(911,354),(951,443),(890,525),(758,555),(628,540),(520,580),(412,558),(288,596),(193,535),(120,450),(101,340),(133,239)])
centers=[]
for r in range(4):
 for c in range(6):
  x=190+c*137 + (((r*37+c*11)%5)-2)*7
  y=177+r*114 + (((c*17+r*13)%5)-2)*8
  centers.append((x,y))
regions=list(voronoi_polygons(MultiPoint(centers),extend_to=land.envelope).geoms)
regionpolys=[]
for cx,cy in centers:
 from shapely.geometry import Point
 p=Point(cx,cy)
 poly=next((g for g in regions if g.covers(p)),None)
 if poly is None: poly=min(regions,key=lambda g:g.distance(p))
 regionpolys.append(poly.intersection(land).simplify(2.0, preserve_topology=True))
names=['Valência','Caldor','Nováris','Altória','Dálmata','Serrat',
'Porto Norte','Ventura','Ravenna','Belmonte','Titania','Mirador',
'Costa Azul','Arlington','Serra Alta','Averno','Solária','Lunaris',
'Esperança','Karmel','Montclair','Oriente','Talvera','Porto Sul']
ids=['p'+str(i+1) for i in range(24)]
capitals={'p8','p11','p14','p17'}
ports={'p1','p6','p13','p18','p19','p24'}
def path(poly):
 if poly.geom_type=='MultiPolygon': poly=max(poly.geoms,key=lambda g:g.area)
 return 'M '+' L '.join(f'{x:.1f} {y:.1f}' for x,y in poly.exterior.coords)+' Z'
items=[]
for i,(center,poly) in enumerate(zip(centers,regionpolys)):
 r,c=divmod(i,6)
 nation=('aurora' if c<3 else 'vesper') if r<2 else ('meridian' if c<3 else 'kestrel')
 neighbors=[ids[j] for j,p in enumerate(regionpolys) if j!=i and poly.boundary.intersection(p.boundary).length>12]
 label = Point(*center) if poly.buffer(2).contains(Point(*center)) else poly.representative_point()
 items.append({'id':ids[i], 'name':names[i], 'ownerId':nation, 'path':path(poly), 'x':round(label.x,1), 'y':round(label.y,1), 'neighbors':neighbors,'capital':ids[i] in capitals, 'port':ids[i] in ports,'terrain':['planície','urbano','montanha','floresta'][(r*7+c*3)%4]})
# more reliable capitals: known in respective nation
for p in items:
 if p['capital']:
  assert p['id'] in capitals
assert all(p['neighbors'] for p in items)
assert all(len([p for p in items if p['ownerId']==n])==6 for n in ('aurora','vesper','meridian','kestrel'))
with open('/mnt/data/dominio-global-mvp/src/map.json','w') as f:json.dump(items,f,ensure_ascii=False,indent=2)
print('Created',len(items),'provinces, adjacency edges',sum(len(p['neighbors']) for p in items)//2)
