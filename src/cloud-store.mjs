import {randomBytes, createHash, scryptSync, timingSafeEqual} from 'node:crypto';
import {createGame} from './engine.mjs';
import {stableStringify} from './auth-store.mjs';

export const hex=(n=32)=>randomBytes(n).toString('hex');
export const sha=s=>createHash('sha256').update(String(s)).digest('hex');
const passhash=(password,salt)=>scryptSync(password,salt,64,{N:16384,r:8,p:1}).toString('hex');
const now=()=>Date.now();
const sevenDays=7*24*3600*1000;
const bad=(message,status=400)=>{const e=Error(message);e.status=status;throw e;};
const fixedHashCheck=(a,b)=>timingSafeEqual(Buffer.from(sha(a),'hex'),Buffer.from(b,'hex'));

export class CloudDb {
 constructor(url,key,{fetcher=fetch}={}){
  if(!url||!key)throw Error('SUPABASE_URL e SUPABASE_SECRET_KEY obrigatorios.');
  const parsed=new URL(url);
  if(parsed.protocol!=='https:' && !(parsed.protocol==='http:'&&['localhost','127.0.0.1'].includes(parsed.hostname)))throw Error('URL do Supabase deve usar HTTPS.');
  // Um gateway restrito no Supabase evita copiar a chave de service_role para o Render.
  this.gateway=/\/functions\/v1\/dg-private-bridge\/?$/.test(parsed.pathname);
  this.root=this.gateway ? parsed.origin+parsed.pathname.replace(/\/$/,'')+'/rest/v1' : parsed.origin+'/rest/v1';
  this.key=key;this.fetcher=fetcher;
 }
 async request(method,path,params={},payload=null,extra={}){
  const u=new URL(this.root+'/'+path.replace(/^\/+/,''));
  for(const [k,v] of Object.entries(params))if(v!==undefined)u.searchParams.set(k,String(v));
  const headers={'Accept':'application/json',...(payload!==null?{'Content-Type':'application/json'}:{}),...extra};
  if(this.gateway)headers['x-dg-private-key']=this.key;
  else {headers.apikey=this.key;if(!this.key.startsWith('sb_secret_'))headers.Authorization='Bearer '+this.key;}
  const response=await this.fetcher(u,{method,headers,body:payload===null?undefined:JSON.stringify(payload),signal:AbortSignal.timeout(12000)});
  const raw=await response.text();let data=null;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
  if(!response.ok){const error=Error(typeof data==='object'?(data.message||data.error||`Supabase ${response.status}`):`Supabase ${response.status}`);error.status=response.status;error.code=data?.code;throw error;}
  return data;
 }
 async rows(table,filters={},options={}){
  const params={select:options.select||'*'};
  for(const [k,v] of Object.entries(filters))params[k]='eq.'+String(v);
  if(options.order)params.order=options.order;
  if(options.limit)params.limit=options.limit;
  return await this.request('GET',table,params)||[];
 }
 async row(table,filters={},options={}){return (await this.rows(table,filters,{...options,limit:1}))[0]||null;}
 async insert(table,values){return (await this.request('POST',table,{},values,{'Prefer':'return=representation'}))?.[0]||null;}
 async patch(table,filters,values){return await this.request('PATCH',table,Object.fromEntries(Object.entries(filters).map(([k,v])=>[k,'eq.'+v])),values,{'Prefer':'return=representation'});}
 async remove(table,filters){return await this.request('DELETE',table,Object.fromEntries(Object.entries(filters).map(([k,v])=>[k,'eq.'+v])));}
 async rpc(name,params){return await this.request('POST','rpc/'+name,{},params);}
}

export function openCloudStore({url=process.env.DG_GATEWAY_URL||process.env.SUPABASE_URL,key=process.env.DG_GATEWAY_TOKEN||process.env.SUPABASE_SECRET_KEY,fetcher}={}){
 const sql=new CloudDb(url,key,{fetcher});
 const store={sql,
  async bootstrap(){return sql.rpc('dg_bootstrap',{p_game:createGame(),p_now:now()});},
  async list(){return sql.rows('dg_campaigns',{}, {select:'*',order:'created_at.asc'});},
  async getCampaign(id){return sql.row('dg_campaigns',{id});},
  async getAccount(username){return sql.row('dg_accounts',{username});},
  async byAccountId(id){return sql.row('dg_accounts',{id});},
  async getMembership(m,a){return sql.row('dg_memberships',{match_id:m,account_id:a});},
  async getRequest(m,a,requestId){return sql.row('dg_commands',{match_id:m,account_id:a,request_id:requestId});},
  async session(token){if(typeof token!=='string'||token.length>128||!token)return null;
   const row=await sql.row('dg_sessions',{token_hash:sha(token)});
   if(!row||Number(row.expires_at)<=now())return null;
   const acc=await sql.row('dg_accounts',{id:row.account_id});return acc?{id:acc.id,username:acc.username,display_name:acc.display_name}:null;
  },
  async removeSession(token){return sql.remove('dg_sessions',{token_hash:sha(token)});},
  async createAccount({username,password,displayName}){
   const normalized=typeof username==='string'?username.toLowerCase().trim():'';
   if(!/^[a-z0-9_]{3,24}$/.test(normalized))bad('Usuário: 3 a 24 letras minúsculas, números ou _.');
   const nick=typeof displayName==='string'&&displayName.trim()?displayName.trim():normalized;
   if(nick.length<2||nick.length>24||/[<>\x00-\x1F]/.test(nick))bad('Nome público inválido (2 a 24 caracteres).');
   if(typeof password!=='string'||password.length<10||Buffer.byteLength(password)>256)bad('Senha deve ter no mínimo 10 caracteres (máximo 256 bytes).');
   const salt=hex(16),code=hex(16),id=hex(16);
   await sql.insert('dg_accounts',{id,username:normalized,display_name:nick,salt,password_hash:passhash(password,salt),recovery_hash:sha(code),created_at:now()});
   return {account:{id,username:normalized,displayName:nick},recoveryCode:code};
  },
  async verifyLogin(username,password,ip='local'){
   const name=typeof username==='string'?username.toLowerCase().trim():'';
   const attemptKey=sha(ip+'|'+name),t=now();const prev=await sql.row('dg_auth_attempts',{attempt_key:attemptKey});
   if(prev&&t-Number(prev.window_start)<15*60000&&Number(prev.failures)>=10){const e=Error('Tentativas em excesso. Aguarde 15 minutos.');e.status=429;throw e;}
   const acc=await store.getAccount(name);
   const calculated=passhash(typeof password==='string'?password:'',acc?.salt||'00000000000000000000000000000000');
   const good=acc&&timingSafeEqual(Buffer.from(calculated,'hex'),Buffer.from(acc.password_hash,'hex'));
   if(!good){await sql.rpc('dg_record_login_failure',{p_key:attemptKey,p_now:t});bad('Usuário ou senha incorretos.');}
   if(prev)await sql.remove('dg_auth_attempts',{attempt_key:attemptKey});
   return {id:acc.id,username:acc.username,displayName:acc.display_name};
  },
  async createSession(accountId){const token=hex(32);await sql.insert('dg_sessions',{token_hash:sha(token),account_id:accountId,expires_at:now()+sevenDays,created_at:now()});return token;},
  async recover({username,code,password}){
   const name=typeof username==='string'?username.toLowerCase().trim():'';
   const acc=await store.getAccount(name);
   if(!acc||typeof code!=='string'||code.length>128||!fixedHashCheck(code,acc.recovery_hash))bad('Usuário ou código de recuperação inválidos.');
   if(typeof password!=='string'||password.length<10||Buffer.byteLength(password)>256)bad('Nova senha inválida.');
   const salt=hex(16),next=hex(16);
   await sql.rpc('dg_reset_password',{p_account_id:acc.id,p_old_recovery_hash:sha(code),p_salt:salt,p_password_hash:passhash(password,salt),p_new_recovery_hash:sha(next)});
   return {recoveryCode:next};
  },
  async createCampaign(id,name){return sql.rpc('dg_create_campaign',{p_id:id,p_name:name,p_game:createGame(),p_now:now()});},
  async commitJoin({matchId,accountId,nationId,gameToken,expectedRevision,game}){return sql.rpc('dg_join_nation',{p_match:matchId,p_account:accountId,p_nation:nationId,p_game_token:gameToken,p_expected:expectedRevision,p_game:game});},
  async commitAction({matchId,accountId,requestId,action,inputHash,expectedRevision,game,result}){return sql.rpc('dg_commit_action',{p_match:matchId,p_account:accountId,p_request:requestId,p_action:action,p_hash:inputHash,p_expected:expectedRevision,p_game:game,p_result:result,p_now:now()});},
  async commitTick({matchId,expectedRevision,game,deltaMs}){return sql.rpc('dg_commit_tick',{p_match:matchId,p_expected:expectedRevision,p_game:game,p_delta:deltaMs,p_now:now()});},
 };
 return store;
}
export {stableStringify};
