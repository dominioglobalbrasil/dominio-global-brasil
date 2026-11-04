import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGame } from '../src/engine.mjs';

const sleep = n => new Promise(r=>setTimeout(r,n));
const reserve = async () => {
 const net=await import('node:net');
 return await new Promise((resolve,reject)=>{
  const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});
 });
};
async function runServer(port,data) {
 const child=spawn('node',['server.mjs'],{cwd:globalThis.process.cwd(),env:{...globalThis.process.env,DG_LEGACY_GUEST:'1',HOST:'127.0.0.1',PORT:String(port),TICK_MS:'300000',DATA_FILE:data},stdio:'ignore'});
 for(let i=0;i<80;i++) {
   if(child.exitCode!==null)throw new Error('Servidor encerrou prematuramente');
   try { const resp=await fetch(`http://127.0.0.1:${port}/api/health`); if(resp.ok)return child; }
   catch{} await sleep(40);
 }
 child.kill('SIGTERM');throw new Error('Servidor não iniciou');
}

test('recursos do HUD são realmente servidos via HTTP e reinício preserva campanha migrada',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'dg05-'));
 const data=join(folder,'game.json'),port=await reserve();
 const old=createGame();old.version=2;delete old.diplomacy;old.provinces.find(p=>p.id==='ms').troops=256;
 await writeFile(data,JSON.stringify(old));
 let child;
 try {
   child=await runServer(port,data);
   const base=`http://127.0.0.1:${port}`;
   for (const path of ['/','/styles.css','/app.js','/assets/terrain-relief.webp','/assets/base-bunker.webp','/assets/soldier.webp']) {
     const resp=await fetch(base+path);
     assert.equal(resp.status,200,path);
     assert.ok((await resp.arrayBuffer()).byteLength>0,path);
     if(path.endsWith('.webp'))assert.match(resp.headers.get('content-type'),/image\/webp/);
   }
   const state=await (await fetch(base+'/api/state')).json();
   assert.equal(state.provinces.find(p=>p.id==='ms').troops,256);
   assert.ok(state.diplomacy);
   const joined=await (await fetch(base+'/api/join',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({nationId:'ms',name:'Jogador Persistente'})})).json();
   assert.ok(joined.token);
   child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));child=null;
   const backup=JSON.parse(await readFile(data+'.backup-v2','utf8'));
   assert.equal(backup.version,2);
   assert.equal(backup.provinces.find(p=>p.id==='ms').troops,256);
   const disk=JSON.parse(await readFile(data,'utf8'));
   assert.equal(disk.storeVersion,1);assert.equal(disk.matches['brasil-01'].game.version,10);assert.equal(disk.matches['brasil-01'].game.provinces.find(p=>p.id==='ms').troops,256);
   child=await runServer(port,data);
   const after=await (await fetch(base+'/api/state?token='+joined.token)).json();
   assert.equal(after.me.nationId,'ms');assert.equal(after.provinces.find(p=>p.id==='ms').troops,256);
 } finally {if(child){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));}await rm(folder,{recursive:true,force:true});}
});
