// A v0.13 exige contas por padrão. O servidor legado existe apenas para regressões locais.
if (process.env.DG_STORAGE === 'supabase') {
  await import('./src/server-cloud.mjs');
} else if (process.env.DG_LEGACY_GUEST === '1') {
  if (process.env.HOST && !['localhost', '127.0.0.1', '::1'].includes(process.env.HOST)) throw new Error('DG_LEGACY_GUEST só pode ser usado em localhost.');
  await import('./server-legacy.mjs');
} else {
  await import('./src/server-auth.mjs');
}
