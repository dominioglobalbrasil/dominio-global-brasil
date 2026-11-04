// Uso offline pelo administrador: vincular uma antiga guarnição anônima a uma conta autenticada.
// Não há API pública para reivindicar comandantes legados: validar posse manualmente antes de usar.
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore} from '../src/auth-store.mjs';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const [matchId,username,nationId]=process.argv.slice(2);
if(!matchId||!username||!nationId){console.error('Uso: DB_FILE=/caminho/dominio-global.sqlite node scripts/claim-legacy.mjs <campanha> <usuario> <sigla-uf>');process.exit(2);}
const dbfile=resolve(process.env.DB_FILE||join(ROOT,'.data','dominio-global.sqlite'));
const store=openStore(dbfile,null);
try{
 const account=store.getAccount(username.toLowerCase());
 if(!account)throw Error('Conta inexistente. Primeiro crie a conta na interface.');
 const campaign=store.getCampaign(matchId);
 if(!campaign)throw Error('Campanha inexistente.');
 const game=JSON.parse(campaign.game_json);
 const slot=Object.entries(game.players).find(([,p])=>p.nationId===nationId);
 if(!slot)throw Error('Não existe comandante legado nessa UF. Use o lobby normalmente.');
 if(store.getMembership(matchId,account.id))throw Error('A conta já controla um estado nessa campanha.');
 const already=store.db.prepare('SELECT account_id FROM memberships WHERE match_id=? AND game_token=?').get(matchId,slot[0]);
 if(already)throw Error('Comando já está vinculado a outra conta.');
 store.txn(()=>store.db.prepare('INSERT INTO memberships(match_id,account_id,nation_id,game_token) VALUES(?,?,?,?)').run(matchId,account.id,nationId,slot[0]));
 console.log(`Vínculo registrado: ${username} → ${nationId} em ${matchId}. Nome anterior: ${slot[1].name}.`);
}catch(e){console.error('Não foi possível vincular:',e.message);process.exitCode=1;}finally{store.db.close();}
