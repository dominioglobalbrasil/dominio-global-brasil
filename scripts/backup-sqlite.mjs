// Gera backup consistente com VACUUM INTO. Pode ser usado com o servidor parado.
import {DatabaseSync} from 'node:sqlite';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync,mkdirSync} from 'node:fs';
const ROOT=dirname(dirname(fileURLToPath(import.meta.url)));
const source=resolve(process.env.DB_FILE||join(ROOT,'.data','dominio-global.sqlite'));
const target=resolve(process.argv[2]||join(ROOT,'.data',`dominio-backup-${Date.now()}.sqlite`));
if(!existsSync(source))throw Error('Banco original inexistente.');
if(source===target||existsSync(target))throw Error('Destino inválido ou já existente.');
mkdirSync(dirname(target),{recursive:true});
const db=new DatabaseSync(source,{readOnly:true});
try{db.exec(`VACUUM INTO '${target.replaceAll("'","''")}'`);console.log(`Backup consistente gerado: ${target}`);}finally{db.close();}
