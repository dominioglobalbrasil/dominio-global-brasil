import http from 'node:http';
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join, extname, dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createGame, joinGame, issueOrder, diplomaticAction, migrateGame, advanceTick, playerFromToken, publicState } from './src/engine.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(process.env.DATA_FILE || join(ROOT, '.data', 'brasil-session.json'));
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '127.0.0.1';
const TICK_MS = Math.max(1000, Number(process.env.TICK_MS || 20000));
const LIMIT = 8;
const DEFAULT_MATCH = 'brasil-01';
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.json':'application/json; charset=utf-8' };
mkdirSync(dirname(DATA), { recursive: true });
const old = existsSync(DATA) ? JSON.parse(readFileSync(DATA,'utf8')) : null;
const source = old?.storeVersion === 1 ? old : {
 storeVersion:1,defaultMatchId:DEFAULT_MATCH,
 matches:{[DEFAULT_MATCH]:{id:DEFAULT_MATCH,name:'Campanha Brasil 01',createdAt:new Date().toISOString(),game:old||createGame()}}
};
// O arquivo original é preservado antes de mudar a estrutura ou o schema do motor.
if(old && (old.storeVersion!==1 || Object.values(old.matches).some(m=>m.game.version<10))) {
 const version=old.storeVersion===1?'multicampanha':`v${old.version}`;
 const backup=`${DATA}.backup-${version}`;
 if(!existsSync(backup))copyFileSync(DATA,backup);
}
const store={storeVersion:1,defaultMatchId:source.defaultMatchId||DEFAULT_MATCH,matches:{}};
for(const [id,entry] of Object.entries(source.matches||{}))store.matches[id]={...entry,id,game:migrateGame(entry.game)};
const streams=new Set();
function persist(){const temp=DATA+'.new';writeFileSync(temp,JSON.stringify(store));renameSync(temp,DATA);}
function respond(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));}
function matchList(){return Object.values(store.matches).map(m=>({id:m.id,name:m.name,createdAt:m.createdAt,tick:m.game.tick,players:Object.keys(m.game.players).length,phase:m.game.phase}));}
function byToken(token){if(typeof token!=='string'||!token)return null;return Object.values(store.matches).find(m=>playerFromToken(m.game,token))||null;}
function chosen(id,token){const session=byToken(token);if(session){if(id&&id!==session.id)throw new Error('Sessão pertence a outra campanha.');return session;}return store.matches[id||store.defaultMatchId]||null;}
function notify(id){for(const stream of streams){if(stream.matchId!==id)continue;const match=store.matches[id];try{stream.res.write(`event: update\ndata: ${JSON.stringify({ ...publicState(match.game,stream.token),matchId:id,matchName:match.name,tickMs:TICK_MS })}\n\n`);}catch{streams.delete(stream);}}}
function readBody(req){return new Promise((resolve,reject)=>{let data='',finished=false;req.on('data',part=>{data+=part;if(data.length>20000&&!finished){finished=true;reject(new Error('Solicitação muito grande.'));req.destroy();}});req.on('end',()=>{if(finished)return;try{resolve(JSON.parse(data||'{}'));}catch{reject(new Error('JSON inválido.'));}});req.on('error',reject);});}
async function handle(req,res){
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
 const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
 if(req.method==='GET'&&url.pathname==='/api/health')return respond(res,200,{ok:true,tick:store.matches[store.defaultMatchId]?.game.tick||0,matches:Object.keys(store.matches).length});
 if(req.method==='GET'&&url.pathname==='/api/matches')return respond(res,200,{matches:matchList(),defaultMatchId:store.defaultMatchId});
 if(req.method==='GET'&&url.pathname==='/api/state'){
  try{const m=chosen(url.searchParams.get('matchId'),url.searchParams.get('token'));if(!m)return respond(res,404,{error:'Campanha não encontrada.'});return respond(res,200,{...publicState(m.game,url.searchParams.get('token')),matchId:m.id,matchName:m.name,tickMs:TICK_MS});}
  catch(e){return respond(res,403,{error:e.message});}
 }
 if(req.method==='GET'&&url.pathname==='/api/events'){
  const token=url.searchParams.get('token'),m=byToken(token);
  if(!m||url.searchParams.get('matchId')&&url.searchParams.get('matchId')!==m.id)return respond(res,401,{error:'Sessão inválida ou de outra campanha.'});
  res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
  const stream={res,token,matchId:m.id};streams.add(stream);
  notify(m.id); // cada cliente recebe exclusivamente o estado da sua campanha
  const ping=setInterval(()=>{try{res.write(': ping\n\n');}catch{clearInterval(ping);}},15000);
  req.on('close',()=>{clearInterval(ping);streams.delete(stream);});return;
 }
 if(req.method==='POST'&&url.pathname.startsWith('/api/')){
  try{
   const input=await readBody(req);
   if(url.pathname==='/api/matches'){
    if(Object.keys(store.matches).length>=LIMIT)throw new Error('Limite de campanhas locais atingido.');
    const name=typeof input.name==='string'?input.name.trim().replace(/[<>]/g,''):'';
    if(name.length<3||name.length>38)throw new Error('O nome da campanha deve ter entre 3 e 38 caracteres.');
    const id='br-'+randomBytes(5).toString('hex');store.matches[id]={id,name,createdAt:new Date().toISOString(),game:createGame()};
    persist();return respond(res,201,{id,name});
   }
   if(url.pathname==='/api/join'){
    const m=store.matches[input.matchId||store.defaultMatchId];if(!m)throw new Error('Campanha não encontrada.');
    const token=randomBytes(32).toString('hex'),player=joinGame(m.game,input.name,input.nationId,token);
    persist();notify(m.id);return respond(res,200,{token,player,matchId:m.id});
   }
   const token=input.token,m=byToken(token);
   if(!m||input.matchId&&input.matchId!==m.id)throw new Error('Sessão inválida ou de outra campanha.');
   if(url.pathname==='/api/diplomacy'){
    const result=diplomaticAction(m.game,token,input);persist();notify(m.id);return respond(res,200,{result});
   }
   if(url.pathname==='/api/order'){
    const order=issueOrder(m.game,token,input);persist();notify(m.id);return respond(res,200,{order});
   }
   return respond(res,404,{error:'Rota desconhecida.'});
  }catch(e){return respond(res,400,{error:e.message||'Solicitação inválida.'});}
 }
 if(req.method!=='GET'&&req.method!=='HEAD')return respond(res,405,{error:'Método não permitido.'});
 const relative=(url.pathname==='/'?'index.html':url.pathname.replace(/^\/+/,''));
 const abs=resolve(join(ROOT,'public'),relative);
 if(!abs.startsWith(resolve(join(ROOT,'public'))+'/')||!existsSync(abs)||!mime[extname(abs)])return respond(res,404,{error:'Arquivo não encontrado.'});
 res.writeHead(200,{'Content-Type':mime[extname(abs)],'Cache-Control':'no-store'});
 if(req.method==='HEAD')return res.end();res.end(readFileSync(abs));
}
const server=http.createServer((req,res)=>{handle(req,res).catch(e=>{console.error(e);if(!res.headersSent)respond(res,500,{error:'Erro interno.'});else res.end();});});
server.listen(PORT,HOST,()=>{persist();console.log(`DOMÍNIO GLOBAL v0.12: http://${HOST}:${PORT} / ${Object.keys(store.matches).length} campanha(s) / ${TICK_MS/1000}s por turno`);});
const interval=setInterval(()=>{for(const m of Object.values(store.matches)){advanceTick(m.game);notify(m.id);}persist();},TICK_MS);
function shutdown(){clearInterval(interval);server.close();persist();}
process.on('SIGTERM',shutdown);process.on('SIGINT',()=>{shutdown();process.exit(0);});
