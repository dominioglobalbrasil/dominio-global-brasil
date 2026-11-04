import http from 'node:http';
import {readFileSync, existsSync} from 'node:fs';
import {resolve, join, extname, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {createGame,joinGame,issueOrder,diplomaticAction,advanceTick,publicState} from './engine.mjs';
import {openCloudStore,sha,hex,stableStringify} from './cloud-store.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const HOST=process.env.HOST||'127.0.0.1',PORT=Number(process.env.PORT||3000);
const TICK_MS=Math.max(1000,Number(process.env.TICK_MS||900000));
const MAX_CATCHUP=Math.min(200,Math.max(1,Number(process.env.DG_MAX_CATCHUP||120)));
const COOKIE='dg_session',LIMIT=8;
const IS_PUBLIC=process.env.DG_PUBLIC_TEST==='1', INVITE=process.env.DG_INVITE_CODE||'';
if(!['127.0.0.1','localhost','::1'].includes(HOST)&&!IS_PUBLIC)throw Error('Hospedagem remota exige DG_PUBLIC_TEST=1.');
if(IS_PUBLIC&&(INVITE.length<16||process.env.DG_SECURE_COOKIES!=='1'))throw Error('Homologacao remota exige convite de 16+ caracteres e cookies Secure.');
const store=openCloudStore();
await store.bootstrap();
const streams=new Set(),rateLimits=new Map(),updating=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const fail=(message,status=400)=>{let e=Error(message);e.status=status;throw e;};
const isId=x=>typeof x==='string'&&/^[a-z0-9-]{1,80}$/i.test(x);
const json=(res,code,body)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(body));};
const tokenFrom=req=>{const v=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));return v?v.slice(COOKIE.length+1):'';};
const accountFor=req=>store.session(tokenFrom(req));
const safeAccount=a=>a?{id:a.id,username:a.username,displayName:a.display_name||a.displayName}:null;
const setCookie=(res,token)=>res.setHeader('set-cookie',`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.DG_SECURE_COOKIES==='1'?'; Secure':''}`);
const unsetCookie=res=>res.setHeader('set-cookie',`${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
function rateLimit(req,action,max){if(!IS_PUBLIC)return;let key=action+':'+(req.socket.remoteAddress||'?'),t=Date.now();let e=rateLimits.get(key);e=(!e||e.until<=t)?{count:1,until:t+900000}:{...e,count:e.count+1};rateLimits.set(key,e);if(rateLimits.size>15000)for(let [k,v] of rateLimits)if(v.until<=t)rateLimits.delete(k);if(e.count>max)fail('Muitas tentativas. Tente mais tarde.',429);}
function checkInvite(input){if(!IS_PUBLIC)return;let v=input.inviteCode;if(typeof v!=='string'||v.length>1024)fail('Convite obrigatório.',403);const a=Buffer.from(sha(v),'hex'),b=Buffer.from(sha(INVITE),'hex');if(!timingSafeEqual(a,b))fail('Convite inválido.',403);}
function guardWrite(req){if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')fail('Envie JSON.',415);if(req.headers['x-dg-client']!=='1')fail('Cabeçalho de segurança ausente.',403);const origin=req.headers.origin;if(origin){const local=new URL(`http://${req.headers.host}`),from=new URL(origin);if(local.host!==from.host||!['http:','https:'].includes(from.protocol))fail('Origem não autorizada.',403);}}
function readBody(req){return new Promise((resolve,reject)=>{let s='',finished=false;req.on('data',c=>{s+=c;if(s.length>20000&&!finished){finished=true;reject(Object.assign(Error('Solicitação muito grande.'),{status:413}));req.destroy();}});req.on('end',()=>{if(finished)return;try{const b=JSON.parse(s||'{}');if(!b||typeof b!=='object'||Array.isArray(b))throw Error();resolve(b);}catch{reject(Object.assign(Error('JSON inválido.'),{status:400}));}});req.on('error',reject);});}
const parseGame=row=>row?{...row,game:typeof row.game_json==='string'?JSON.parse(row.game_json):row.game_json}:null;
const matchWithGame=async id=>parseGame(await store.getCampaign(id||'brasil-01'));
const membership=async(row,account)=>account?await store.getMembership(row.id,account.id):null;
async function serializeState(row,account){const m=await membership(row,account);return {...publicState(row.game,m?.game_token||null),account:safeAccount(account),authRequired:true,matchId:row.id,matchName:row.name,tickMs:TICK_MS,revision:row.revision};}
const isConflict=e=>e?.message?.includes('DG_CONFLICT');
function adaptError(e){if(isConflict(e))fail('A campanha mudou. Atualize o jogo e repita a ordem.',409);if(/DG_DUPLICATE_MISMATCH/.test(e.message||''))fail('Identificador de ordem reaproveitado com outro comando.',409);if(/unique|duplicate key|estado ja ocupado/i.test(e.message||''))fail('Conta ou estado já utilizado nesta campanha.',409);throw e;}
async function processDue(id){
 if(updating.has(id))return updating.get(id);
 const job=(async()=>{
  for(let attempt=0;attempt<3;attempt++){
   const row=await matchWithGame(id);if(!row)return 0;
   const due=Math.floor((Date.now()-Number(row.last_tick_at))/TICK_MS);
   if(due<=0)return 0;
   const amount=Math.min(due,MAX_CATCHUP),game=structuredClone(row.game);
   for(let i=0;i<amount;i++)advanceTick(game);
   try{await store.commitTick({matchId:id,expectedRevision:row.revision,game,deltaMs:amount*TICK_MS});
    await notify(id);return due-amount;
   }catch(e){if(isConflict(e))continue;throw e;}
  }return 0;
 })().finally(()=>updating.delete(id));
 updating.set(id,job);return job;
}
async function syncDue(id){let remains=await processDue(id);if(remains>0)setImmediate(()=>processDue(id).catch(e=>console.error('Turnos pendentes:',e.message)));}
async function notify(id){const row=await matchWithGame(id);if(!row)return;for(const stream of [...streams]){if(stream.matchId!==id)continue;try{const account=await store.session(stream.token);if(!account){stream.res.end();streams.delete(stream);continue;}stream.res.write(`event: update\ndata: ${JSON.stringify(await serializeState(row,account))}\n\n`);}catch{streams.delete(stream);}}}
async function applyAction(row,account,route,input){
 if(!account)fail('Entre na sua conta.',401);
 if(!isId(input.matchId)||input.matchId!==row.id)fail('Campanha inválida.');
 if(typeof input.requestId!=='string'||!/^[0-9a-f-]{36}$/i.test(input.requestId))fail('Identificador de ordem inválido.');
 const content={...input};delete content.requestId;delete content.expectedRevision;delete content.token;
 const hash=sha(route+'|'+stableStringify(content));
 const old=await store.getRequest(row.id,account.id,input.requestId);
 if(old){if(old.input_hash!==hash||old.action!==route)fail('Identificador já usado para outra ordem.',409);return {...old.result_json,replayed:true};}
 if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision!==row.revision)fail('A campanha mudou. Atualize antes de agir.',409);
 const m=await membership(row,account);if(!m)fail('Assuma um estado primeiro.',403);
 const game=structuredClone(row.game);
 let result;try{result=route==='order'?{order:issueOrder(game,m.game_token,content)}:{result:diplomaticAction(game,m.game_token,content)};}catch(e){fail(e.message||'Ordem inválida.',400);}
 const output={...result,revision:row.revision+1};
 try{const persisted=await store.commitAction({matchId:row.id,accountId:account.id,requestId:input.requestId,action:route,inputHash:hash,expectedRevision:row.revision,game,result:output});
  return {...persisted.result,replayed:Boolean(persisted.replayed)};
 }catch(e){return adaptError(e);}
}
async function handle(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 const u=new URL(req.url,`http://${req.headers.host||'localhost'}`),path=u.pathname;
 if(req.method==='GET'&&path==='/api/health'){
  const rows=await store.list();return json(res,200,{ok:true,mode:'supabase-cloud',matches:rows.length});
 }
 const account=await accountFor(req);
 if(req.method==='GET'&&path==='/api/auth/me')return json(res,200,{account:safeAccount(account),inviteRequired:IS_PUBLIC});
 if(req.method==='GET'&&path==='/api/matches'){
  const campaigns=await store.list();return json(res,200,{matches:campaigns.map(r=>({id:r.id,name:r.name,createdAt:r.created_at,tick:r.game_json.tick,players:Object.keys(r.game_json.players).length,phase:r.game_json.phase})),defaultMatchId:'brasil-01'});
 }
 if(req.method==='GET'&&path==='/api/state'){
  const id=u.searchParams.get('matchId')||'brasil-01';if(!isId(id))fail('Campanha inválida.');await syncDue(id);
  const row=await matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
  return json(res,200,await serializeState(row,account));
 }
 if(req.method==='GET'&&path==='/api/events'){
  if(!account)fail('Autenticação necessária.',401);
  const id=u.searchParams.get('matchId')||'brasil-01';await syncDue(id);
  const row=await matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
  if(!await membership(row,account))fail('Assuma um estado para receber eventos.',403);
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
  const stream={res,token:tokenFrom(req),matchId:id};streams.add(stream);
  res.write(`event: update\ndata: ${JSON.stringify(await serializeState(row,account))}\n\n`);
  const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{}},15000);
  req.on('close',()=>{clearInterval(ping);streams.delete(stream);});return;
 }
 if(req.method==='POST'&&path.startsWith('/api/')){
  guardWrite(req);const input=await readBody(req);
  if(path==='/api/auth/register'){
   rateLimit(req,'register',60);checkInvite(input);
   let result;try{result=await store.createAccount(input);}catch(e){return adaptError(e);}
   const token=await store.createSession(result.account.id);setCookie(res,token);return json(res,201,result);
  }
  if(path==='/api/auth/login'){
   rateLimit(req,'login',150);const user=await store.verifyLogin(input.username,input.password,req.socket.remoteAddress||'local');
   const token=await store.createSession(user.id);setCookie(res,token);return json(res,200,{account:user});
  }
  if(path==='/api/auth/recover'){
   rateLimit(req,'recover',40);return json(res,200,await store.recover({username:input.username,code:input.code,password:input.password}));
  }
  if(path==='/api/auth/logout'){
   if(account)await store.removeSession(tokenFrom(req));unsetCookie(res);return json(res,200,{ok:true});
  }
  if(!account)fail('Faça login antes de jogar.',401);
  if(path==='/api/matches'){
   const name=typeof input.name==='string'?input.name.trim().replace(/[<>]/g,''):'';
   if(name.length<3||name.length>38)fail('Nome da campanha inválido.');
   const data=await store.createCampaign('br-'+hex(5),name);return json(res,201,data);
  }
  if(path==='/api/join'){
   const id=input.matchId||'brasil-01';if(!isId(id))fail('Campanha inválida.');await syncDue(id);
   const row=await matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
   const existing=await membership(row,account);
   if(existing){if(existing.nation_id!==input.nationId)fail('Você já comanda outro estado.',409);
    return json(res,200,{player:row.game.players[existing.game_token],matchId:id,revision:row.revision,rejoined:true});}
   const token=hex(32),game=structuredClone(row.game);let player;try{player=joinGame(game,account.display_name,input.nationId,token);}catch(e){fail(e.message||'Estado indisponível.',400);}
   let result;try{result=await store.commitJoin({matchId:id,accountId:account.id,nationId:input.nationId,gameToken:token,expectedRevision:row.revision,game});}catch(e){return adaptError(e);}
   await notify(id);return json(res,200,{player,matchId:id,revision:result.revision});
  }
  if(path==='/api/order'||path==='/api/diplomacy'){
   const id=input.matchId;if(!isId(id))fail('Campanha inválida.');await syncDue(id);
   const row=await matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
   const result=await applyAction(row,account,path==='/api/order'?'order':'diplomacy',input);
   if(!result.replayed)await notify(id);return json(res,200,result);
  }
  return json(res,404,{error:'Rota desconhecida.'});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')fail('Método não permitido.',405);
 const rel=path==='/'?'index.html':path.replace(/^\/+/,''),root=resolve(join(ROOT,'public'));
 const abs=resolve(join(root,rel));
 if(!abs.startsWith(root+'/')||!existsSync(abs)||!mime[extname(abs)])fail('Arquivo não encontrado.',404);
 res.writeHead(200,{'Content-Type':mime[extname(abs)],'Cache-Control':'no-store'});
 if(req.method==='HEAD')return res.end();res.end(readFileSync(abs));
}
const server=http.createServer((req,res)=>{handle(req,res).catch(e=>{const code=e.status>=400&&e.status<500?e.status:500;
 if(code===500)console.error('Falha API',e.message);if(!res.headersSent)json(res,code,{error:code===500?'Servidor temporariamente indisponível.':e.message});else res.end();});});
server.listen(PORT,HOST,()=>console.log(`DOMINIO GLOBAL v0.14 cloud em http://${HOST}:${PORT} (turno ${TICK_MS}ms)`));
let looping=false;
const clock=setInterval(async()=>{if(looping)return;looping=true;try{const rows=await store.list();for(const row of rows)await syncDue(row.id);}catch(e){console.error('Falha de sincronizacao:',e.message);}finally{looping=false;}},Math.min(TICK_MS,60000));
function shutdown(){clearInterval(clock);for(const s of streams){try{s.res.end();}catch{}}server.close();}
process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
