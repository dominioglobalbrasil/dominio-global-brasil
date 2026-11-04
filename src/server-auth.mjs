import http from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,timingSafeEqual} from 'node:crypto';
import {createGame,joinGame,issueOrder,diplomaticAction,advanceTick,publicState} from './engine.mjs';
import {openStore,hex,sha,stableStringify} from './auth-store.mjs';

const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const DATA=resolve(process.env.DATA_FILE||join(ROOT,'.data','brasil-session.json'));
const DB_FILE=resolve(process.env.DB_FILE||join(ROOT,'.data','dominio-global.sqlite'));
const PORT=Number(process.env.PORT||3000),HOST=process.env.HOST||'127.0.0.1';
const TICK_MS=Math.max(1000,Number(process.env.TICK_MS||20000));
const LIMIT=8,COOKIE='dg_session';
const IS_PUBLIC=process.env.DG_PUBLIC_TEST==='1';
const INVITE=process.env.DG_INVITE_CODE||'';
// Homologacao remota: nunca abrir cadastro sem convite nem cookies HTTPS.
if(IS_PUBLIC&&(INVITE.length<16||process.env.DG_SECURE_COOKIES!=='1'))
 throw Error('Homologacao online requer DG_INVITE_CODE (16+ caracteres) e DG_SECURE_COOKIES=1.');
const publicLimits=new Map();
function limitGuest(req,action,max=15){
 if(!IS_PUBLIC)return;
 const ip=req.socket.remoteAddress||'unknown',key=action+':'+ip,now=Date.now();
 const current=publicLimits.get(key);
 const next=(!current||current.until<=now)?{count:1,until:now+15*60_000}:{...current,count:current.count+1};
 publicLimits.set(key,next);
 if(publicLimits.size>20000){for(const [k,v] of publicLimits)if(v.until<=now)publicLimits.delete(k);}
 if(next.count>max)fail('Muitas tentativas. Tente novamente mais tarde.',429);
}
function checkInvite(code){
 if(!IS_PUBLIC)return;
 if(typeof code!=='string'||Buffer.byteLength(code)>1024)fail('Convite de teste obrigatorio.',403);
 const a=Buffer.from(sha(code),'hex'),b=Buffer.from(sha(INVITE),'hex');
 if(!timingSafeEqual(a,b))fail('Convite de teste invalido.',403);
}

if(!['127.0.0.1','localhost','::1'].includes(HOST)&&process.env.DG_PUBLIC_TEST!=='1')throw Error('Servidor autenticado só inicia em localhost. Para testes remotos, defina DG_PUBLIC_TEST=1 com HTTPS/reverse proxy.');
const store=openStore(DB_FILE,DATA);const {db,txn}=store;
const streams=new Set();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const isId=x=>typeof x==='string'&&/^[a-z0-9-]{1,80}$/i.test(x);
const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
const json=(res,status,payload)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));};
const secureCookie=req=>Boolean(process.env.DG_SECURE_COOKIES==='1'||req.socket.encrypted);
const setCookie=(res,req,token)=>res.setHeader('Set-Cookie',`${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secureCookie(req)?'; Secure':''}`);
const unsetCookie=res=>res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
const sessionToken=req=>{const value=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='));return value?value.slice(COOKIE.length+1):'';};
const accountFor=req=>store.session(sessionToken(req));
const safeAccount=a=>a?{id:a.id,username:a.username,displayName:a.display_name||a.displayName}:null;
function guardWrite(req){
 if(req.headers['content-type']?.split(';')[0].trim()!=='application/json')fail('Envie JSON.',415);
 if(req.headers['x-dg-client']!=='1')fail('Cabeçalho de segurança ausente.',403);
 const origin=req.headers.origin;
 if(origin){const local=new URL(`http://${req.headers.host}`);const remote=new URL(origin);
  if(remote.host!==local.host||!['http:','https:'].includes(remote.protocol))fail('Origem não autorizada.',403);
 }
}
function body(req){return new Promise((resolve,reject)=>{
 let data='',finished=false;
 req.on('data',part=>{data+=part;if(data.length>20000&&!finished){finished=true;reject(Object.assign(Error('Solicitação muito grande.'),{status:413}));req.destroy();}});
 req.on('end',()=>{if(finished)return;try{const v=JSON.parse(data||'{}');if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Objeto JSON esperado.');resolve(v);}catch{reject(Object.assign(Error('JSON inválido.'),{status:400}));}});req.on('error',reject);
});}
function campaigns(){return store.list().map(row=>{const g=JSON.parse(row.game_json);return{id:row.id,name:row.name,createdAt:row.created_at,tick:g.tick,players:Object.keys(g.players).length,phase:g.phase};});}
function matchWithGame(id){const row=store.getCampaign(id||'brasil-01');return row?{...row,game:JSON.parse(row.game_json)}:null;}
function membership(row,account){return account?store.getMembership(row.id,account.id):null;}
function serializeState(row,account){
 const member=membership(row,account);
 return {...publicState(row.game,member?.game_token||null),account:safeAccount(account),authRequired:true,matchId:row.id,matchName:row.name,tickMs:TICK_MS,revision:row.revision};
}
function updateCampaign(row,game){const changed=db.prepare('UPDATE campaigns SET game_json=?,revision=revision+1 WHERE id=? AND revision=?').run(JSON.stringify(game),row.id,row.revision);
 if(changed.changes!==1)fail('A campanha foi atualizada. Recarregue os dados e tente novamente.',409);
 return row.revision+1;
}
function notify(id){const row=matchWithGame(id);if(!row)return;
 for(const stream of streams){if(stream.matchId!==id)continue;
  try{const account=store.session(stream.sessionToken);if(!account){stream.res.end();streams.delete(stream);continue;}
   stream.res.write(`event: update\ndata: ${JSON.stringify(serializeState(row,account))}\n\n`);
  }catch{streams.delete(stream);}
 }
}
function action(row,account,route,input){
 if(!account)fail('Entre na sua conta para comandar.',401);
 if(!isId(input.matchId)||input.matchId!==row.id)fail('Campanha inválida.',400);
 const requestId=input.requestId;
 if(typeof requestId!=='string'||!/^[a-f0-9-]{36}$/i.test(requestId))fail('Identificador de ordem inválido.',400);
 const content={...input};delete content.requestId;delete content.expectedRevision;delete content.token;
 const fingerprint=sha(route+'|'+stableStringify(content));
 const old=store.getRequest(row.id,account.id,requestId);
 if(old){if(old.input_hash!==fingerprint||old.action!==route)fail('Identificador já utilizado para uma ação diferente.',409);
  return {...JSON.parse(old.result_json),replayed:true};}
 if(!Number.isSafeInteger(input.expectedRevision)||input.expectedRevision!==row.revision)fail('A campanha mudou desde a última consulta. Atualize antes de enviar a ordem.',409);
 const member=membership(row,account);if(!member)fail('Assuma um estado nesta campanha primeiro.',403);
 const game=structuredClone(row.game);
 const result=route==='order'?{order:issueOrder(game,member.game_token,content)}:{result:diplomaticAction(game,member.game_token,content)};
 const output={...result,revision:row.revision+1};
 // Toda ordem + resposta idempotente + mudança do jogo entram na mesma transação.
 txn(()=>{
  updateCampaign(row,game);
  db.prepare('INSERT INTO command_requests(match_id,account_id,request_id,action,input_hash,result_json,created_at) VALUES(?,?,?,?,?,?,?)')
    .run(row.id,account.id,requestId,route,fingerprint,JSON.stringify(output),Date.now());
 });
 return output;
}
async function handle(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 const url=new URL(req.url,`http://${req.headers.host||'localhost'}`),path=url.pathname;
 const account=accountFor(req);
 if(req.method==='GET'&&path==='/api/health')return json(res,200,{ok:true,mode:'sqlite-auth',matches:store.list().length});
 if(req.method==='GET'&&path==='/api/auth/me')return json(res,200,{account:safeAccount(account),inviteRequired:IS_PUBLIC});
 if(req.method==='GET'&&path==='/api/matches')return json(res,200,{matches:campaigns(),defaultMatchId:'brasil-01'});
 if(req.method==='GET'&&path==='/api/state'){
  const id=url.searchParams.get('matchId')||'brasil-01';if(!isId(id))fail('Campanha inválida.',400);
  const row=matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
  return json(res,200,serializeState(row,account));
 }
 if(req.method==='GET'&&path==='/api/events'){
  if(!account)fail('Autenticação necessária.',401);
  const id=url.searchParams.get('matchId')||'brasil-01',row=matchWithGame(id);
  if(!row)fail('Campanha não encontrada.',404);
  if(!membership(row,account))fail('Assuma um estado para receber atualizações privadas.',403);
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
  const stream={res,sessionToken:sessionToken(req),matchId:id};streams.add(stream);
  res.write(`event: update\ndata: ${JSON.stringify(serializeState(row,account))}\n\n`);
  const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{clearInterval(ping);}},15000);
  req.on('close',()=>{clearInterval(ping);streams.delete(stream);});return;
 }
 if(req.method==='POST'&&path.startsWith('/api/')){
  guardWrite(req);const input=await body(req);
  if(path==='/api/auth/register'){
   limitGuest(req,'register',60);checkInvite(input.inviteCode);
   let result;try{result=store.createAccount(input);}catch(e){if(/UNIQUE constraint/.test(e.message))fail('Nome de usuário indisponível.',409);throw e;}
   const token=store.createSession(result.account.id);setCookie(res,req,token);return json(res,201,result);
  }
  if(path==='/api/auth/login'){
   limitGuest(req,'login',150);
   const user=store.verifyLogin(input.username,input.password,req.socket.remoteAddress||'local');
   const token=store.createSession(user.id);setCookie(res,req,token);return json(res,200,{account:user});
  }
  if(path==='/api/auth/recover'){limitGuest(req,'recover',40);return json(res,200,store.recover({username:input.username,code:input.code,password:input.password}));}
  if(path==='/api/auth/logout'){if(account)store.removeSession(sessionToken(req));unsetCookie(res);return json(res,200,{ok:true});}
  if(!account)fail('Faça login antes de jogar.',401);
  if(path==='/api/matches'){
   const name=typeof input.name==='string'?input.name.trim().replace(/[<>]/g,''):'';
   if(name.length<3||name.length>38)fail('Nome da campanha deve ter entre 3 e 38 caracteres.');
   const result=txn(()=>{if(store.list().length>=LIMIT)fail('Limite local de 8 campanhas atingido.');
     const id='br-'+hex(5);store.insertCampaign(id,name,new Date().toISOString(),createGame());return{id,name};});
   return json(res,201,result);
  }
  if(path==='/api/join'){
   const id=input.matchId||'brasil-01';if(!isId(id))fail('Campanha inválida.');
   let row=matchWithGame(id);if(!row)fail('Campanha não encontrada.',404);
   const existing=membership(row,account);
   if(existing){if(existing.nation_id!==input.nationId)fail('Sua conta já comanda outro estado nesta sala.',409);
    return json(res,200,{player:row.game.players[existing.game_token],matchId:id,revision:row.revision,rejoined:true});}
   const token=hex(32),game=structuredClone(row.game),player=joinGame(game,account.display_name,input.nationId,token);
   const revision=txn(()=>{const next=updateCampaign(row,game);db.prepare('INSERT INTO memberships(match_id,account_id,nation_id,game_token) VALUES(?,?,?,?)').run(id,account.id,input.nationId,token);return next;});
   notify(id);return json(res,200,{player,matchId:id,revision});
  }
  if(path==='/api/order'||path==='/api/diplomacy'){
   const row=matchWithGame(input.matchId);if(!row)fail('Campanha não encontrada.',404);
   const result=action(row,account,path==='/api/order'?'order':'diplomacy',input);
   if(!result.replayed)notify(row.id);
   return json(res,200,result);
  }
  return json(res,404,{error:'Rota desconhecida.'});
 }
 if(req.method!=='GET'&&req.method!=='HEAD')fail('Método não permitido.',405);
 const rel=path==='/'?'index.html':path.replace(/^\/+/,''),root=resolve(join(ROOT,'public'));
 const abs=resolve(join(ROOT,'public'),rel);
 if(!abs.startsWith(root+'/')||!existsSync(abs)||!mime[extname(abs)])fail('Arquivo não encontrado.',404);
 res.writeHead(200,{'Content-Type':mime[extname(abs)],'Cache-Control':'no-store'});
 if(req.method==='HEAD')return res.end();res.end(readFileSync(abs));
}
const server=http.createServer((req,res)=>{handle(req,res).catch(e=>{if((e.status||400)>=500)console.error(e);if(!res.headersSent)json(res,e.status||400,{error:e.message||'Solicitação inválida.'});else res.end();});});
server.listen(PORT,HOST,()=>console.log(`DOMÍNIO GLOBAL v0.13 (SQLite + contas): http://${HOST}:${PORT}, ${TICK_MS/1000}s/turno.`));
let isTicking=false;
const interval=setInterval(()=>{
 if(isTicking)return;isTicking=true;
 try{const ids=[];txn(()=>{for(const row of store.list()){
  const game=JSON.parse(row.game_json);advanceTick(game);updateCampaign(row,game);ids.push(row.id);
 }});for(const id of ids)notify(id);
 }catch(e){console.error('Falha de turno:',e);}finally{isTicking=false;}
},TICK_MS);
function shutdown(){clearInterval(interval);for(const stream of streams){try{stream.res.end();}catch{}}server.close(()=>db.close());}
process.on('SIGTERM',shutdown);process.on('SIGINT',()=>{shutdown();process.exit(0);});
