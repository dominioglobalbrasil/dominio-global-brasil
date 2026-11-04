import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import net from 'node:net';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function port(){return await new Promise((resolve,reject)=>{const socket=net.createServer();socket.once('error',reject);socket.listen(0,'127.0.0.1',()=>{const p=socket.address().port;socket.close(()=>resolve(p));});});}
async function start(p,dir,secret='um-convite-secreto-de-20-caracteres',secure=true){
 const proc=spawn('node',['server.mjs'],{cwd:process.cwd(),env:{...process.env,HOST:'0.0.0.0',PORT:String(p),DB_FILE:join(dir,'game.sqlite'),DATA_FILE:join(dir,'legacy.json'),TICK_MS:'60000',DG_PUBLIC_TEST:'1',DG_SECURE_COOKIES:secure?'1':'0',DG_INVITE_CODE:secret,DG_LEGACY_GUEST:'0'},stdio:['ignore','pipe','pipe']});
 let output='';proc.stderr.on('data',c=>output+=String(c));
 for(let i=0;i<80;i++){
  if(proc.exitCode!==null)return {proc,output};
  try{const r=await fetch(`http://127.0.0.1:${p}/api/health`);if(r.ok)return {proc,output};}catch{}
  await pause(50);
 }
 proc.kill();throw Error('Nao iniciou');
}
async function stop(proc){if(proc.exitCode!==null)return;proc.kill('SIGTERM');await new Promise(resolve=>proc.once('exit',resolve));}
async function request(base,route,data,cookie=''){
 const r=await fetch(base+route,{method:'POST',headers:{'content-type':'application/json','x-dg-client':'1',...(cookie?{cookie}:{})},body:JSON.stringify(data)});
 return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};
}
test('Homologacao: exige convite e cookie Secure, persiste contas e separa comandos',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dg-host-')),p=await port(),base=`http://127.0.0.1:${p}`;
 let proc;
 try{
  // Regra de inicializacao: nao disponibilizar servidor remoto mal configurado.
  let bad=await start(p,dir,'fraco',true);assert.ok(bad.proc.exitCode!==null||!((await (async()=>{try{return await fetch(base+'/api/health');}catch{return null;}})())?.ok));await stop(bad.proc);
  bad=await start(p,dir,'um-convite-secreto-de-20-caracteres',false);assert.ok(bad.proc.exitCode!==null||!((await (async()=>{try{return await fetch(base+'/api/health');}catch{return null;}})())?.ok));await stop(bad.proc);
  ({proc}=await start(p,dir));
  const health=await fetch(base+'/api/health');assert.equal(health.status,200);
  const me=await fetch(base+'/api/auth/me');assert.equal((await me.json()).inviteRequired,true);
  const without=await request(base,'/api/auth/register',{username:'comandante',password:'senha-muito-segura-123'});assert.equal(without.status,403);
  const wrong=await request(base,'/api/auth/register',{username:'comandante',password:'senha-muito-segura-123',inviteCode:'convite-errado'});assert.equal(wrong.status,403);
  const valid=await request(base,'/api/auth/register',{username:'comandante',displayName:'Comandante',password:'senha-muito-segura-123',inviteCode:'um-convite-secreto-de-20-caracteres'});assert.equal(valid.status,201,JSON.stringify(valid));assert.match(valid.cookie,/Secure/);assert.match(valid.cookie,/HttpOnly/);assert.match(valid.cookie,/SameSite=Strict/);
  const cookie=valid.cookie.split(';')[0];const joined=await request(base,'/api/join',{matchId:'brasil-01',nationId:'sp'},cookie);assert.equal(joined.status,200,JSON.stringify(joined));
  await stop(proc);({proc}=await start(p,dir));
  const state=await fetch(base+'/api/state?matchId=brasil-01',{headers:{cookie}}).then(r=>r.json());assert.equal(state.me.nationId,'sp');
 }finally{if(proc)await stop(proc);await rm(dir,{force:true,recursive:true});}
});
