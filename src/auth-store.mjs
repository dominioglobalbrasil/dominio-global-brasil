import { DatabaseSync } from 'node:sqlite';
import { readFileSync,existsSync,copyFileSync,mkdirSync,chmodSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import {createGame,migrateGame} from './engine.mjs';

const hex=(n=32)=>randomBytes(n).toString('hex');
const sha=s=>createHash('sha256').update(String(s)).digest('hex');
const passhash=(pw,salt)=>scryptSync(pw,salt,64,{N:16384,r:8,p:1}).toString('hex');
const now=()=>Date.now();
const sevenDays=7*86400000;
const staticSafe=s=>typeof s==='string'&&s.length<=128;

export function openStore(filename,legacyFile){
  process.umask(0o077);
  const dbfile=resolve(filename);mkdirSync(dirname(dbfile),{recursive:true});
  const db=new DatabaseSync(dbfile);
  // Evita que outros usuários do mesmo computador leiam o banco/sessões.
  chmodSync(dbfile,0o600);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS accounts(
      id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
      salt TEXT NOT NULL,password_hash TEXT NOT NULL,recovery_hash TEXT NOT NULL,created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions(
      token_hash TEXT PRIMARY KEY,account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaigns(
      id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL,
      game_json TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS memberships(
      match_id TEXT NOT NULL REFERENCES campaigns(id), account_id TEXT NOT NULL REFERENCES accounts(id),
      nation_id TEXT NOT NULL,game_token TEXT NOT NULL,
      PRIMARY KEY(match_id,account_id),UNIQUE(match_id,nation_id),UNIQUE(match_id,game_token)
    );
    CREATE TABLE IF NOT EXISTS command_requests(
      match_id TEXT NOT NULL REFERENCES campaigns(id),account_id TEXT NOT NULL REFERENCES accounts(id),
      request_id TEXT NOT NULL, action TEXT NOT NULL, input_hash TEXT NOT NULL,
      result_json TEXT NOT NULL,created_at INTEGER NOT NULL,
      PRIMARY KEY(match_id,account_id,request_id)
    );
    CREATE TABLE IF NOT EXISTS auth_attempts(
      attempt_key TEXT PRIMARY KEY,window_start INTEGER NOT NULL, failures INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_cmd_created ON command_requests(created_at);
  `);
  function txn(callback){db.exec('BEGIN IMMEDIATE');try{const v=callback();db.exec('COMMIT');return v;}catch(e){db.exec('ROLLBACK');throw e;}}
  function insertCampaign(id,name,createdAt,game){db.prepare('INSERT INTO campaigns(id,name,created_at,game_json,revision) VALUES (?,?,?,?,0)').run(id,name,createdAt,JSON.stringify(migrateGame(game)));}
  // Importa a campanha antiga somente se este banco ainda estiver vazio.
  if(!db.prepare('SELECT id FROM campaigns LIMIT 1').get()){
    if(legacyFile && existsSync(legacyFile)){
      const raw=JSON.parse(readFileSync(legacyFile,'utf8'));
      const source=raw.storeVersion===1?raw.matches:{'brasil-01':{id:'brasil-01',name:'Campanha Brasil 01',createdAt:new Date().toISOString(),game:raw}};
      const backup=legacyFile+'.backup-before-sqlite';if(!existsSync(backup))copyFileSync(legacyFile,backup);
      txn(()=>{for(const [id,entry] of Object.entries(source))insertCampaign(id,entry.name||id,entry.createdAt||new Date().toISOString(),entry.game);});
    }else txn(()=>insertCampaign('brasil-01','Campanha Brasil 01',new Date().toISOString(),createGame()));
  }
  return {db,dbfile,txn,
    list:()=>db.prepare('SELECT id,name,created_at,game_json,revision FROM campaigns ORDER BY created_at ASC').all(),
    getCampaign:id=>db.prepare('SELECT * FROM campaigns WHERE id=?').get(id),
    insertCampaign,
    getAccount:username=>db.prepare('SELECT * FROM accounts WHERE username=?').get(username),
    byAccountId:id=>db.prepare('SELECT id,username,display_name,created_at FROM accounts WHERE id=?').get(id),
    getMembership:(matchId,accountId)=>db.prepare('SELECT * FROM memberships WHERE match_id=? AND account_id=?').get(matchId,accountId),
    getRequest:(m,a,id)=>db.prepare('SELECT * FROM command_requests WHERE match_id=? AND account_id=? AND request_id=?').get(m,a,id),
    session:token=>{
      if(!staticSafe(token)||!token)return null;
      const row=db.prepare('SELECT a.id,a.username,a.display_name,s.expires_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=?').get(sha(token));
      return row&&row.expires_at>now()?row:null;
    },
    removeSession:token=>db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token)),
    createAccount:({username,password,displayName})=>{
      const normalized=typeof username==='string'?username.toLowerCase().trim():'';
      if(!/^[a-z0-9_]{3,24}$/.test(normalized))throw Error('Usuário: 3 a 24 letras minúsculas, números ou _.');
      const nick=typeof displayName==='string'&&displayName.trim()?displayName.trim():normalized;
      if(nick.length<2||nick.length>24||/[<>\x00-\x1F]/.test(nick))throw Error('Nome público inválido (2 a 24 caracteres).');
      if(typeof password!=='string'||password.length<10||Buffer.byteLength(password)>256)throw Error('Senha deve ter no mínimo 10 caracteres (máximo 256 bytes).');
      const salt=hex(16),code=hex(16),id=hex(16);
      txn(()=>db.prepare('INSERT INTO accounts(id,username,display_name,salt,password_hash,recovery_hash,created_at) VALUES(?,?,?,?,?,?,?)').run(id,normalized,nick,salt,passhash(password,salt),sha(code),now()));
      return {account:{id,username:normalized,displayName:nick},recoveryCode:code};
    },
    verifyLogin:(username,password,ip='local')=>{
      const uname=typeof username==='string'?username.toLowerCase().trim():'';
      const key=sha(ip+'|'+uname),t=now();let row=db.prepare('SELECT * FROM auth_attempts WHERE attempt_key=?').get(key);
      if(row&&t-row.window_start<15*60000&&row.failures>=10)throw Error('Tentativas em excesso. Aguarde 15 minutos.');
      const user=db.prepare('SELECT * FROM accounts WHERE username=?').get(uname);
      // Usa scrypt mesmo para usuários inexistentes para reduzir enumeração de contas.
      const computed=passhash(typeof password==='string'?password:'',user?.salt||'00000000000000000000000000000000');
      const accepted=user&&timingSafeEqual(Buffer.from(computed,'hex'),Buffer.from(user.password_hash,'hex'));
      if(!accepted){txn(()=>{if(!row||t-row.window_start>15*60000)db.prepare('INSERT INTO auth_attempts(attempt_key,window_start,failures) VALUES(?,?,1) ON CONFLICT(attempt_key) DO UPDATE SET window_start=excluded.window_start,failures=1').run(key,t);else db.prepare('UPDATE auth_attempts SET failures=failures+1 WHERE attempt_key=?').run(key);});throw Error('Usuário ou senha incorretos.');}
      db.prepare('DELETE FROM auth_attempts WHERE attempt_key=?').run(key);
      return {id:user.id,username:user.username,displayName:user.display_name};
    },
    createSession:id=>{const token=hex(32);db.prepare('INSERT INTO sessions(token_hash,account_id,expires_at,created_at) VALUES (?,?,?,?)').run(sha(token),id,now()+sevenDays,now());return token;},
    recover:({username,code,password})=>{
      const uname=typeof username==='string'?username.toLowerCase().trim():'';
      const row=db.prepare('SELECT * FROM accounts WHERE username=?').get(uname);
      if(!row||!staticSafe(code)||!timingSafeEqual(Buffer.from(sha(code)),Buffer.from(row.recovery_hash)))throw Error('Usuário ou código de recuperação inválidos.');
      if(typeof password!=='string'||password.length<10||Buffer.byteLength(password)>256)throw Error('Nova senha inválida.');
      const salt=hex(16),next=hex(16);
      txn(()=>{db.prepare('UPDATE accounts SET salt=?,password_hash=?,recovery_hash=? WHERE id=?').run(salt,passhash(password,salt),sha(next),row.id);db.prepare('DELETE FROM sessions WHERE account_id=?').run(row.id);});
      return {recoveryCode:next};
    },
  };
}
export const stableStringify=x=>JSON.stringify(normalize(x));
function normalize(x){if(Array.isArray(x))return x.map(normalize);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,normalize(x[k])]));return x;}
export {sha,hex};
