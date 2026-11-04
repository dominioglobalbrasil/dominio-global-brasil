import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const file = new URL('../public/data/municipios-ms.json',import.meta.url);
const rows = JSON.parse(readFileSync(file,'utf8'));

test('camada municipal leve exibe somente 8 municípios estratégicos de MS',()=>{
  assert.equal(rows.length,8);
  assert.equal(new Set(rows.map(r=>r.id)).size,8);
  assert.ok(rows.every(r=>r.uf==='MS' && r.name && r.path?.startsWith('M') && r.point?.length===2));
  assert.ok(rows.some(r=>r.name==='Campo Grande'));
  assert.ok(rows.some(r=>r.name==='Três Lagoas'));
});

test('camada municipal permanece menor que 3 KB',()=>{
  assert.ok(statSync(file).size < 3000);
});
