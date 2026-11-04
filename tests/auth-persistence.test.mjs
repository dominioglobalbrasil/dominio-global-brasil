import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createGame} from '../src/engine.mjs';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function port(){return await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});}
async function start(p,db,data){const child=spawn('node',['server.mjs'],{cwd:process.cwd(),env:{...process.env,PORT:String(p),HOST:'127.0.0.1',DB_FILE:db,DATA_FILE:data,TICK_MS:'300000',DG_LEGACY_GUEST:'0',DG_PUBLIC_TEST:'0',DG_STORAGE:'sqlite'},stdio:'ignore'});for(let i=0;i<100;i++){if(child.exitCode!==null)throw Error('Falha ao iniciar servidor');try{const r=await fetch(`http://127.0.0.1:${p}/api/health`);if(r.ok)return child;}catch{}await pause(50);}child.kill();throw Error('Servidor não iniciou');}
async function stop(child){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}
async function fixture(callback,{legacy=null}={}){const dir=await mkdtemp(join(tmpdir(),'dg13-')),db=join(dir,'game.sqlite'),data=join(dir,'legacy.json'),p=await port();let child=null;
 try{if(legacy)await writeFile(data,JSON.stringify(legacy));child=await start(p,db,data);
  const base=`http://127.0.0.1:${p}`;
  const client=(cookie='')=>({
   async get(path){const r=await fetch(base+path,{headers:cookie?{cookie}:undefined});return {status:r.status,data:await r.json(),headers:r.headers};},
   async post(path,body,{headers={}}={}){const r=await fetch(base+path,{method:'POST',headers:{'content-type':'application/json','x-dg-client':'1',...headers,...(cookie?{cookie}:{})},body:JSON.stringify(body)});return{status:r.status,data:await r.json(),headers:r.headers};}
  });
  const create=async(username,password='segredo-enorme-123')=>{const response=await client().post('/api/auth/register',{username,password,displayName:'Comandante '+username});assert.equal(response.status,201,JSON.stringify(response.data));const cookie=response.headers.get('set-cookie').split(';')[0];return {cookie,account:response.data.account,recoveryCode:response.data.recoveryCode,api:client(cookie)};};
  await callback({client,create,db,data,base,async restart(){await stop(child);child=await start(p,db,data);},async readDB(){return new DatabaseSync(db);}});
 }finally{if(child)await stop(child);await rm(dir,{recursive:true,force:true});}
}
const order=(matchId,revision,requestId=randomUUID(),type='recruit')=>({matchId,expectedRevision:revision,requestId,type,provinceId:'sp'});

test('v0.13: autenticação obrigatória, senhas protegidas e cookie seguro para sessão local',async()=>fixture(async({client,create,db})=>{
 const anon=client();assert.equal((await anon.get('/api/auth/me')).data.account,null);
 assert.equal((await anon.post('/api/join',{matchId:'brasil-01',nationId:'sp'})).status,401);
 const noHeader=await anon.post('/api/auth/register',{username:'teste',password:'segredo-enorme-123'},{headers:{'x-dg-client':''}});assert.equal(noHeader.status,403);
 const weak=await anon.post('/api/auth/register',{username:'teste',password:'123'});assert.equal(weak.status,400);
 const first=await create('bravo');assert.equal(first.account.username,'bravo');assert.ok(first.recoveryCode.length>=24);
 const cookie=(await anon.post('/api/auth/login',{username:'bravo',password:'segredo-enorme-123'})).headers.get('set-cookie');
 assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Strict/);
 assert.equal((await first.api.get('/api/auth/me')).data.account.username,'bravo');
 assert.equal((await anon.post('/api/auth/register',{username:'bravo',password:'different-pass-9876'})).status,409);
 const bad=await anon.post('/api/auth/login',{username:'bravo',password:'wrong-credential'});assert.equal(bad.status,400);
 const sql=new DatabaseSync(db);let row=sql.prepare('SELECT * FROM accounts WHERE username=?').get('bravo');assert.ok(row.password_hash.length===128);assert.notEqual(row.password_hash,'segredo-enorme-123');assert.notEqual(row.recovery_hash,first.recoveryCode);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM sessions WHERE token_hash=?').get(first.cookie.split('=')[1]).n,0);sql.close();
}));

test('v0.13: conta retoma estado após reinício, sem revelar token de jogo',async()=>fixture(async({client,create,restart})=>{
 const player=await create('zulu');const joined=await player.api.post('/api/join',{matchId:'brasil-01',nationId:'sp'});assert.equal(joined.status,200);
 assert.equal(joined.data.token,undefined);
 const state=await player.api.get('/api/state?matchId=brasil-01');assert.equal(state.data.me.nationId,'sp');assert.equal(state.data.account.username,'zulu');
 assert.equal(state.data.revision,1);
 const duplicate=await player.api.post('/api/join',{matchId:'brasil-01',nationId:'sp'});assert.equal(duplicate.status,200);assert.equal(duplicate.data.rejoined,true);
 const other=await create('yankee');assert.equal((await other.api.post('/api/join',{matchId:'brasil-01',nationId:'sp'})).status,400);
 await restart();assert.equal((await player.api.get('/api/state?matchId=brasil-01')).data.me.nationId,'sp');
 const login=await client().post('/api/auth/login',{username:'zulu',password:'segredo-enorme-123'});assert.equal(login.status,200);
 const again=client(login.headers.get('set-cookie').split(';')[0]);assert.equal((await again.get('/api/state?matchId=brasil-01')).data.me.nationId,'sp');
 const out=await again.post('/api/auth/logout',{});assert.equal(out.status,200);assert.equal((await again.get('/api/auth/me')).data.account,null);
 assert.equal((await player.api.get('/api/state?matchId=brasil-01')).data.me.nationId,'sp');
}));

test('v0.13: idem-potência, revisão conflitante e separação entre contas/salas',async()=>fixture(async({client,create,restart,db})=>{
 const a=await create('alfa'),b=await create('beta');
 const aJoin=await a.api.post('/api/join',{matchId:'brasil-01',nationId:'sp'});assert.equal(aJoin.status,200);
 const state=(await a.api.get('/api/state?matchId=brasil-01')).data;const rid=randomUUID(),body=order('brasil-01',state.revision,rid);
 const responses=await Promise.all([a.api.post('/api/order',body),a.api.post('/api/order',{...body,requestId:randomUUID()})]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
 const first=responses.find(x=>x.status===200);
 const replay=await a.api.post('/api/order',body);
 if(first.data.order && !first.data.replayed){assert.equal(replay.status,200);assert.equal(replay.data.replayed,true);}else{assert.equal(replay.status,409);}
 const newest=(await a.api.get('/api/state?matchId=brasil-01')).data;assert.equal(newest.orders.length,1);
 // Reenvio da mesma chave e carga diferente deve ser recusado sem consumir recursos.
 const used=(await a.api.post('/api/order',body)).status===200?body:{...body,requestId:responses.find((r)=>r.status===200)?.data?.requestId};
 // Um payload alterado com o mesmo requestId não pode emitir uma segunda ordem.
 const validId=replay.status===200?rid:body.requestId;
 const tamper=await a.api.post('/api/order',{...order('brasil-01',newest.revision,validId),type:'industry'});
 assert.equal(tamper.status,409);
 const room=(await a.api.post('/api/matches',{name:'Segunda Campanha'}));assert.equal(room.status,201);
 const newId=room.data.id;
 const bJoin=await b.api.post('/api/join',{matchId:newId,nationId:'sp'});assert.equal(bJoin.status,200);
 const isolated=(await b.api.get('/api/state?matchId='+newId)).data;assert.equal(isolated.orders.length,0);
 assert.equal((await a.api.get('/api/state?matchId='+newId)).data.me,null);
 const forbidden=await b.api.post('/api/order',order('brasil-01',newest.revision));assert.equal(forbidden.status,403);
 await restart();assert.equal((await a.api.get('/api/state?matchId=brasil-01')).data.orders.length,1);
 assert.equal((await b.api.get('/api/state?matchId='+newId)).data.me.nationId,'sp');
 const sql=new DatabaseSync(db);assert.equal(sql.prepare('SELECT count(*) n FROM command_requests').get().n,1);sql.close();
}));

test('v0.13: código de recuperação é de uso único, revoga sessões e permite nova senha',async()=>fixture(async({client,create})=>{
 const a=await create('gamma'),anon=client();const code=a.recoveryCode;
 assert.equal((await anon.post('/api/auth/recover',{username:'gamma',code:'invalido',password:'nova-senha-bem-longa'})).status,400);
 const done=await anon.post('/api/auth/recover',{username:'gamma',code,password:'nova-senha-bem-longa'});
 assert.equal(done.status,200);assert.notEqual(done.data.recoveryCode,code);
 assert.equal((await a.api.get('/api/auth/me')).data.account,null);
 assert.equal((await anon.post('/api/auth/recover',{username:'gamma',code,password:'outra-senha-bem-longa'})).status,400);
 assert.equal((await anon.post('/api/auth/login',{username:'gamma',password:'segredo-enorme-123'})).status,400);
 assert.equal((await anon.post('/api/auth/login',{username:'gamma',password:'nova-senha-bem-longa'})).status,200);
}));

test('v0.13: importa v0.12 com backup e preserva cidades, tropas e ordens',async()=>{
 const old=createGame();old.provinces.find(p=>p.id==='ms').units.infantry=243;old.provinces.find(p=>p.id==='ms').troops=243;
 await fixture(async({client,data})=>{
  const state=await client().get('/api/state?matchId=brasil-01');assert.equal(state.data.provinces.find(p=>p.id==='ms').troops,243);
  await access(data+'.backup-before-sqlite');
 },{legacy:{storeVersion:1,defaultMatchId:'brasil-01',matches:{'brasil-01':{id:'brasil-01',name:'Migração',createdAt:new Date().toISOString(),game:old}}}});
});
