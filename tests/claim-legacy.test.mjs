import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore,hex} from '../src/auth-store.mjs';
import {joinGame} from '../src/engine.mjs';

test('v0.13: estado legado só é vinculado por script offline e preserva seu comandante',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dg-legacy-claim-')),file=join(dir,'app.sqlite');
 try{
  const store=openStore(file,null);
  const account=store.createAccount({username:'reivindicante',password:'senha-forte-2026',displayName:'Nova Conta'}).account;
  const old=store.getCampaign('brasil-01');const game=JSON.parse(old.game_json),token=hex(32);
  const player=joinGame(game,'Velho Comandante','ms',token);
  store.txn(()=>store.db.prepare('UPDATE campaigns SET game_json=? WHERE id=?').run(JSON.stringify(game),old.id));
  store.db.close();
  const result=spawnSync('node',['scripts/claim-legacy.mjs','brasil-01','reivindicante','ms'],{cwd:process.cwd(),env:{...process.env,DB_FILE:file},encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const check=openStore(file,null);
  const membership=check.getMembership('brasil-01',account.id);
  assert.equal(membership.nation_id,'ms');assert.equal(membership.game_token,token);
  assert.equal(JSON.parse(check.getCampaign('brasil-01').game_json).players[token].name,player.name);
  check.db.close();
  const second=spawnSync('node',['scripts/claim-legacy.mjs','brasil-01','reivindicante','ms'],{cwd:process.cwd(),env:{...process.env,DB_FILE:file},encoding:'utf8'});
  assert.equal(second.status,1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
