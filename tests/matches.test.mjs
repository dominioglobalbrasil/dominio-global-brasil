import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
import {createGame} from '../src/engine.mjs';
const nap=n=>new Promise(r=>setTimeout(r,n));
async function port(){return await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function start(p,file){const child=spawn('node',['server.mjs'],{cwd:process.cwd(),env:{...process.env,DG_LEGACY_GUEST:'1',HOST:'127.0.0.1',PORT:String(p),TICK_MS:'300000',DATA_FILE:file},stdio:'ignore'});for(let i=0;i<80;i++){if(child.exitCode!==null)throw Error('servidor encerrou');try{const r=await fetch(`http://127.0.0.1:${p}/api/health`);if(r.ok)return child;}catch{}await nap(50);}child.kill('SIGTERM');throw Error('servidor indisponível');}
async function stop(child){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}
test('salas independentes: jogadores, ordens, login de teste e persistência após reinício',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'dg-matches-')),file=join(folder,'game.json'),p=await port();let child;
 try {
  const legacy=createGame();legacy.version=9;delete legacy.blockades;legacy.provinces.find(p=>p.id==='sp').units.infantry=158;legacy.provinces.find(p=>p.id==='sp').troops=158;
  await writeFile(file,JSON.stringify(legacy));child=await start(p,file);
  const base=`http://127.0.0.1:${p}`;
  const get=async path=>{const r=await fetch(base+path);return {status:r.status,data:await r.json()};};
  const post=async(path,body)=>{const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};};
  const l=await get('/api/matches');assert.equal(l.data.matches.length,1);assert.equal(l.data.matches[0].id,'brasil-01');
  const created=await post('/api/matches',{name:'Campanha de teste B'});assert.equal(created.status,201);const b=created.data.id;
  const aJoin=await post('/api/join',{matchId:'brasil-01',name:'Comandante Alfa',nationId:'sp'});
  const bJoin=await post('/api/join',{matchId:b,name:'Comandante Beta',nationId:'sp'});
  assert.ok(aJoin.data.token&&bJoin.data.token&&aJoin.data.token!==bJoin.data.token);
  const beforeA=await get('/api/state?matchId=brasil-01&token='+aJoin.data.token);
  const beforeB=await get('/api/state?matchId='+b+'&token='+bJoin.data.token);
  assert.equal(beforeA.data.provinces.find(p=>p.id==='sp').troops,158);
  assert.equal(beforeB.data.provinces.find(p=>p.id==='sp').troops,120);
  const order=await post('/api/order',{token:aJoin.data.token,type:'recruit',provinceId:'sp'});assert.equal(order.status,200);
  const afterA=await get('/api/state?matchId=brasil-01&token='+aJoin.data.token),afterB=await get('/api/state?matchId='+b+'&token='+bJoin.data.token);
  assert.equal(afterA.data.orders.length,1);assert.equal(afterB.data.orders.length,0);
  assert.equal(afterB.data.me.resources.credits,1500);assert.equal(afterA.data.me.resources.credits,1320);
  const badRead=await get('/api/state?matchId='+b+'&token='+aJoin.data.token);assert.equal(badRead.status,403);
  const badWrite=await post('/api/order',{token:aJoin.data.token,matchId:b,type:'recruit',provinceId:'sp'});assert.equal(badWrite.status,400);
  assert.equal((await post('/api/order',{token:'fake',type:'recruit',provinceId:'sp'})).status,400);
  await stop(child);child=null;
  const disk=JSON.parse(await readFile(file,'utf8'));
  assert.equal(disk.storeVersion,1);assert.equal(Object.keys(disk.matches).length,2);
  assert.equal(disk.matches['brasil-01'].game.version,10);
  assert.equal(disk.matches[b].game.version,10);
  const backup=JSON.parse(await readFile(file+'.backup-v9','utf8'));
  assert.equal(backup.version,9);
  child=await start(p,file);
  const restored=await get('/api/state?matchId='+b+'&token='+bJoin.data.token);
  assert.equal(restored.data.me.nationId,'sp');assert.equal(restored.data.orders.length,0);
  const restoredA=await get('/api/state?matchId=brasil-01&token='+aJoin.data.token);
  assert.equal(restoredA.data.orders.length,1);
 }finally{if(child)await stop(child);await rm(folder,{recursive:true,force:true});}
});
