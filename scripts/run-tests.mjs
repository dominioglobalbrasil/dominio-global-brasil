// Testes herméticos: nunca usar as credenciais/seletores da produção em fixtures locais.
import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const tests=readdirSync('tests').filter(p=>p.endsWith('.test.mjs')).sort().map(p=>'tests/'+p);
const env={...process.env,
  DG_STORAGE:'',DG_GATEWAY_URL:'',DG_GATEWAY_TOKEN:'',SUPABASE_URL:'',SUPABASE_SECRET_KEY:'',
  DG_PUBLIC_TEST:'',DG_INVITE_CODE:'',DG_SECURE_COOKIES:'',DG_LEGACY_GUEST:'',
};
const result=spawnSync(process.execPath,['--test',...tests],{env,stdio:'inherit'});
process.exit(result.status ?? 1);
