import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as sleep} from 'node:timers/promises';
import {createGame} from '../src/engine.mjs';

function listen(server){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)));}
function close(server){return new Promise(resolve=>server.close(resolve));}
function fixture(){
 const tables=Object.fromEntries(['dg_accounts','dg_sessions','dg_campaigns','dg_memberships','dg_commands','dg_auth_attempts'].map(k=>[k,[]]));
 const received=[];
 const fail=(msg,status=400)=>Object.assign(Error(msg),{status});
 const service=createServer(async(req,res)=>{
  let raw='';for await(const c of req)raw+=c;
  let body={};try{body=raw?JSON.parse(raw):{};}catch{}
  let url=new URL(req.url,'http://localhost'),name=url.pathname.replace('/rest/v1/','');
  const params=Object.fromEntries(url.searchParams),now=Date.now();
  received.push({path:url.pathname,method:req.method,apikey:req.headers.apikey,auth:req.headers.authorization});
  const respond=(status,data)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data));};
  if(req.headers.apikey!=='sb_secret_test')return respond(401,{message:'Invalid secret'});
  try{
   if(name.startsWith('rpc/')){
    let result={},rpc=name.slice(4);const campaign=()=>tables.dg_campaigns.find(c=>c.id===body.p_match);
    switch(rpc){
     case 'dg_bootstrap':
      if(!tables.dg_campaigns.length)tables.dg_campaigns.push({id:'brasil-01',name:'Campanha Brasil 01',created_at:new Date().toISOString(),game_json:body.p_game,revision:0,last_tick_at:body.p_now});
      result={ok:true};break;
     case 'dg_create_campaign':
      if(tables.dg_campaigns.length>=8)throw fail('Limite de 8 campanhas atingido');
      tables.dg_campaigns.push({id:body.p_id,name:body.p_name,created_at:new Date().toISOString(),game_json:body.p_game,revision:0,last_tick_at:body.p_now});result={id:body.p_id,name:body.p_name};break;
     case 'dg_join_nation':{
      let c=campaign();if(c.revision!==body.p_expected)throw fail('DG_CONFLICT');
      if(tables.dg_memberships.some(m=>m.match_id===body.p_match&&(m.nation_id===body.p_nation||m.account_id===body.p_account)))throw fail('Estado ja ocupado');
      c.revision++;c.game_json=body.p_game;
      tables.dg_memberships.push({match_id:body.p_match,account_id:body.p_account,nation_id:body.p_nation,game_token:body.p_game_token});result={revision:c.revision};break;
     }
     case 'dg_commit_action':{
      const c=campaign();let old=tables.dg_commands.find(x=>x.match_id===body.p_match&&x.account_id===body.p_account&&x.request_id===body.p_request);
      if(old){if(old.input_hash!==body.p_hash||old.action!==body.p_action)throw fail('DG_DUPLICATE_MISMATCH');result={result:old.result_json,replayed:true};break;}
      if(c.revision!==body.p_expected)throw fail('DG_CONFLICT');
      c.revision++;c.game_json=body.p_game;
      tables.dg_commands.push({match_id:body.p_match,account_id:body.p_account,request_id:body.p_request,action:body.p_action,input_hash:body.p_hash,result_json:body.p_result,created_at:body.p_now});result={result:body.p_result,replayed:false};break;
     }
     case 'dg_commit_tick':{
      const c=campaign();if(c.revision!==body.p_expected)throw fail('DG_CONFLICT');
      c.revision++;c.game_json=body.p_game;c.last_tick_at+=body.p_delta;result={revision:c.revision,last_tick_at:c.last_tick_at};break;
     }
     case 'dg_record_login_failure':{
      let x=tables.dg_auth_attempts.find(x=>x.attempt_key===body.p_key);if(!x)tables.dg_auth_attempts.push({attempt_key:body.p_key,window_start:body.p_now,failures:1});else x.failures++;result={ok:true};break;
     }
     case 'dg_reset_password':{
      const a=tables.dg_accounts.find(x=>x.id===body.p_account_id&&x.recovery_hash===body.p_old_recovery_hash);if(!a)throw fail('Codigo de recuperacao invalido');
      Object.assign(a,{salt:body.p_salt,password_hash:body.p_password_hash,recovery_hash:body.p_new_recovery_hash});tables.dg_sessions=tables.dg_sessions.filter(x=>x.account_id!==a.id);result={ok:true};break;
     }
     default:throw fail('Function not found',404);
    }
    return respond(200,result);
   }
   const entries=tables[name];if(!entries)throw fail('Tabela nao encontrada',404);
   const filters=Object.entries(params).filter(([k,v])=>v.startsWith('eq.')).map(([k,v])=>[k,v.slice(3)]);
   const filtered=entries.filter(x=>filters.every(([k,v])=>String(x[k])===v));
   if(req.method==='GET')return respond(200,params.limit?filtered.slice(0,Number(params.limit)):filtered);
   if(req.method==='POST'){
    const val=JSON.parse(JSON.stringify(body));
    if(name==='dg_accounts'&&entries.some(x=>x.username===val.username))throw fail('duplicate key value violates unique constraint',409);
    entries.push(val);return respond(201,[val]);
   }
   if(req.method==='DELETE'){tables[name]=entries.filter(x=>!filtered.includes(x));return respond(204,null);}
   if(req.method==='PATCH'){
    for(const x of filtered)Object.assign(x,body);return respond(200,filtered);
   }
   throw fail('Metodo',405);
  }catch(e){return respond(e.status||400,{message:e.message});}
 });
 return {service,tables,received};
}
async function startApp(dbport,appport){
 const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,HOST:'127.0.0.1',PORT:String(appport),DG_STORAGE:'supabase',SUPABASE_URL:`http://127.0.0.1:${dbport}`,SUPABASE_SECRET_KEY:'sb_secret_test',DG_PUBLIC_TEST:'1',DG_SECURE_COOKIES:'1',DG_INVITE_CODE:'convite-de-teste-muito-seguro',TICK_MS:'5000',DG_MAX_CATCHUP:'120'},stdio:['ignore','pipe','pipe']});
 let errors='';child.stderr.on('data',d=>errors+=d.toString());
 for(let i=0;i<120;i++){
  if(child.exitCode!==null)throw Error('Servidor encerrou: '+errors);
  try{const r=await fetch(`http://127.0.0.1:${appport}/api/health`);if(r.ok)return child;}catch{}
  await sleep(30);
 }
 child.kill('SIGTERM');throw Error('Inicializacao falhou: '+errors);
}
async function stop(child){if(!child)return;child.kill('SIGTERM');await Promise.race([new Promise(r=>child.once('exit',r)),sleep(1000)]);if(child.exitCode===null)child.kill('SIGKILL');}
async function api(base,path,data=null,cookie=''){
 const r=await fetch(base+path,{method:data?'POST':'GET',headers:{...(data?{'content-type':'application/json','x-dg-client':'1'}:{}),...(cookie?{cookie}:{})},body:data?JSON.stringify(data):undefined});
 return {status:r.status,json:await r.json(),cookie:r.headers.get('set-cookie')};
}
test('Cloud grátis: cadastro restrito, salvamento, login, ordens idempotentes e retorno após reinício',async()=>{
 const fixtureDB=fixture(),dbport=await listen(fixtureDB.service);
 // Fecha o socket auxiliar de porta efemera antes de iniciar o jogo.
 // Captura uma porta livre diferente por bind/release.
 const probe=createServer();const p=await listen(probe);await close(probe);
 let child;
 try{
  child=await startApp(dbport,p);const base=`http://127.0.0.1:${p}`;
  const forbidden=await api(base,'/api/auth/register',{username:'alpha',password:'segredo-muito-longo'});assert.equal(forbidden.status,403);
  const reg=await api(base,'/api/auth/register',{username:'alpha',password:'segredo-muito-longo',displayName:'Comandante Alpha',inviteCode:'convite-de-teste-muito-seguro'});
  assert.equal(reg.status,201,JSON.stringify(reg));assert.match(reg.cookie,/Secure/);const cookie=reg.cookie.split(';')[0];
  const joined=await api(base,'/api/join',{matchId:'brasil-01',nationId:'sp'},cookie);assert.equal(joined.status,200,JSON.stringify(joined));
  const state=await api(base,'/api/state?matchId=brasil-01',null,cookie);assert.equal(state.json.me.nationId,'sp');
  const id=randomUUID(),command={matchId:'brasil-01',expectedRevision:state.json.revision,requestId:id,type:'recruit',provinceId:'sp'};
  const result=await api(base,'/api/order',command,cookie);assert.equal(result.status,200,JSON.stringify(result));
  const repeated=await api(base,'/api/order',command,cookie);assert.equal(repeated.status,200);assert.equal(repeated.json.replayed,true);
  assert.equal(fixtureDB.tables.dg_commands.length,1);
  const changed=await api(base,'/api/order',{...command,requestId:randomUUID()},cookie);assert.equal(changed.status,409);
  assert.equal(fixtureDB.received.filter(x=>x.auth).length,0,'Chave sb_secret nao deve entrar em Authorization');
  assert.ok(fixtureDB.received.every(x=>x.apikey==='sb_secret_test'));
  await stop(child);child=await startApp(dbport,p);
  const again=await api(base,'/api/state?matchId=brasil-01',null,cookie);assert.equal(again.json.me.nationId,'sp');assert.equal(again.json.orders.length,1);
 }finally{await stop(child);await close(fixtureDB.service);}
});

test('Cloud grátis: calcula automaticamente turnos perdidos enquanto o Render dorme',async()=>{
 const f=fixture(),dbport=await listen(f.service),probe=createServer(),port=await listen(probe);await close(probe);
 let child;
 try{
  child=await startApp(dbport,port);const c=f.tables.dg_campaigns[0];
  c.last_tick_at=Date.now()-16500;
  const base=`http://127.0.0.1:${port}`;const state=await api(base,'/api/state?matchId=brasil-01');
  assert.equal(state.status,200,JSON.stringify(state));
  assert.ok(state.json.tick>=3,'Deve recuperar 3 turnos');
  assert.ok(c.last_tick_at>Date.now()-4500,'Banco deve registrar o avanco temporal');
  const tick=state.json.tick;
  await stop(child);child=await startApp(dbport,port);
  const again=await api(base,'/api/state?matchId=brasil-01');
  assert.equal(again.json.tick,tick,'Nao pode repetir os mesmos turnos apos reiniciar');
 }finally{await stop(child);await close(f.service);}
});

test('Cloud grátis: campanhas isoladas, estado ocupado e recuperação de senha com revogação',async()=>{
 const f=fixture(),dbport=await listen(f.service),probe=createServer(),port=await listen(probe);await close(probe);
 let child;
 try{
  child=await startApp(dbport,port);const base=`http://127.0.0.1:${port}`;
  async function register(username){const r=await api(base,'/api/auth/register',{username,password:'senha-forte-123456',displayName:'General '+username,inviteCode:'convite-de-teste-muito-seguro'});assert.equal(r.status,201,JSON.stringify(r));return {...r.json,cookie:r.cookie.split(';')[0]};}
  const alpha=await register('alfa'),beta=await register('beta');
  assert.equal((await api(base,'/api/join',{matchId:'brasil-01',nationId:'sp'},alpha.cookie)).status,200);
  assert.equal((await api(base,'/api/join',{matchId:'brasil-01',nationId:'sp'},beta.cookie)).status,400);
  const second=await api(base,'/api/matches',{name:'Sala alternativa'},beta.cookie);assert.equal(second.status,201);
  const joined=await api(base,'/api/join',{matchId:second.json.id,nationId:'sp'},beta.cookie);assert.equal(joined.status,200);
  const firstState=await api(base,'/api/state?matchId=brasil-01',null,alpha.cookie),secondState=await api(base,'/api/state?matchId='+second.json.id,null,beta.cookie);
  assert.equal(firstState.json.me.nationId,'sp');assert.equal(secondState.json.me.nationId,'sp');
  assert.equal((await api(base,'/api/state?matchId='+second.json.id,null,alpha.cookie)).json.me,null);
  const recovered=await api(base,'/api/auth/recover',{username:'beta',code:beta.recoveryCode,password:'outra-senha-bem-forte'});
  assert.equal(recovered.status,200,JSON.stringify(recovered));
  assert.notEqual(recovered.json.recoveryCode,beta.recoveryCode);
  assert.equal((await api(base,'/api/auth/me',null,beta.cookie)).json.account,null);
  assert.equal((await api(base,'/api/auth/login',{username:'beta',password:'senha-forte-123456'})).status,400);
  const login=await api(base,'/api/auth/login',{username:'beta',password:'outra-senha-bem-forte'});
  assert.equal(login.status,200);
  assert.equal((await api(base,'/api/state?matchId='+second.json.id,null,login.cookie.split(';')[0])).json.me.nationId,'sp');
 }finally{await stop(child);await close(f.service);}
});

test('Cloud grátis: configuração pública rejeita token fraco e não inicia sem chave de banco',async()=>{
 const probe=createServer(),port=await listen(probe);await close(probe);
 const child=spawn(process.execPath,['server.mjs'],{cwd:process.cwd(),env:{...process.env,DG_STORAGE:'supabase',HOST:'0.0.0.0',PORT:String(port),SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',DG_PUBLIC_TEST:'1',DG_SECURE_COOKIES:'1',DG_INVITE_CODE:'convite-super-seguro'},stdio:['ignore','pipe','pipe']});
 let error='';child.stderr.on('data',b=>error+=b.toString());
 await Promise.race([new Promise(r=>child.once('exit',r)),sleep(1000)]);
 if(child.exitCode===null)child.kill('SIGKILL');
 assert.notEqual(child.exitCode,0);assert.match(error,/SUPABASE_URL/);
});
