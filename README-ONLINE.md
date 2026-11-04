# DOMÍNIO GLOBAL — v0.14: infraestrutura gratuita para teste multiplayer

**Status real: versão preparada e validada localmente; NÃO publicada em URL pública.** O Render ainda não está conectado e o projeto exclusivo no Supabase não foi criado. Nenhuma infraestrutura da UNIFA, Nexum ou de outros projetos foi alterada.

## O que foi implementado

- Adaptador para Supabase PostgreSQL usando PostgREST e o `SUPABASE_SECRET_KEY` **somente no servidor**. Não depende de pacotes NPM externos.
- Cadastro com convite, senhas scrypt, sessões HttpOnly/Secure, recuperação de conta por código e revogação das sessões após redefinir senha.
- Contas, campanhas e ordens salvas no PostgreSQL. Cada estado só pode ter um comandante por partida. As salas continuam independentes.
- Funções SQL de transações **atômicas** e revisão otimista para evitar conflito entre ordens, reenvio duplicado, escolha simultânea do mesmo estado e duplicação de turnos.
- **Catch-up ao despertar:** cada campanha guarda `last_tick_at`. Quando o Render voltar da hibernação, o servidor calcula os turnos que passaram e os persiste com revisão, sem executar os mesmos turnos duas vezes. O limite por lote é `DG_MAX_CATCHUP` (120). Se houver mais turnos, continua recuperando por lotes.
- `render.yaml` para Web Service no **plano free**, sem disco pago, com ambiente separado e cadastro por convite.
- Modo SQLite local da v0.13.1 preservado; a migração antiga local para uma conta online requer exportação/importação controlada. Não envia automaticamente credenciais ou dados antigos.

## Como executar localmente (sem hospedagem)

Requer Node.js >=22.16. Para iniciar sem Supabase, use `npm start`; SQLite continua sendo o modo padrão. Para validar o motor: `npm test`.

## Como ativar o modo online **após aprovação da organização Supabase**

1. Criar um **novo projeto Supabase Free exclusivo** para o Domínio Global, de preferência na região `sa-east-1` (São Paulo). Não utilizar banco de aplicativos existentes.
2. Executar **`sql/setup_supabase.sql`** no SQL Editor desse novo projeto, revisar as permissões e testar as funções RPC. O SQL é destinado apenas ao banco novo.
3. Configurar Render Web Service `free` usando `render.yaml` em um repositório GitHub exclusivo do projeto.
4. Informar os segredos nas variáveis privadas do Render (não no código/GitHub):
   - `SUPABASE_URL` (URL do novo projeto)
   - `SUPABASE_SECRET_KEY` (chave de servidor `sb_secret_...`)
   - `DG_INVITE_CODE` (convite aleatório com pelo menos 16 caracteres)
5. A configuração já inclui `DG_STORAGE=supabase`, `HOST=0.0.0.0`, cookies Secure e atualização de turnos de **15 minutos**. Não utilizar `DG_LEGACY_GUEST` em produção.
6. Após implantar, testar `/api/health`, duas contas em uma sala, salas isoladas, ordens simultâneas, logout/login e uma hibernação do Render. Compartilhar a URL apenas com jogadores convidados.

## Limites da operação sem custo

- Render Free entra em repouso após ~15 minutos sem solicitações HTTP/WebSocket; o primeiro acesso após o repouso pode demorar para responder. O motor recupera o tempo decorrido no banco ao despertar, mas não envia eventos enquanto está adormecido.
- Supabase Free tem limite de armazenamento e pode pausar após cerca de uma semana de baixa atividade. A retomada não é automática pelo jogo se o projeto Supabase estiver pausado: o proprietário precisa reativar o banco no painel.
- O plano gratuito não é indicado como hospedagem de produção 24/7; inicialmente serve para testes com poucos jogadores.
- Não há backup automático diário incluso no Supabase Free. Faça exportações manuais das contas e campanhas durante os testes; não exponha senhas/chaves no arquivo exportado.

## O que NÃO está validado ainda

- Nenhuma conexão ao banco Supabase real foi realizada. Os testes de integração usaram um **servidor simulador de API PostgREST**. O SQL precisa ser executado e testado no projeto novo.
- Render ainda não implantado. Sem URL pública, sem medições de latência ou teste real de hibernação em nuvem.
- A antiga base SQLite não foi importada para a nuvem. O projeto novo inicia com uma campanha padrão vazia; os arquivos locais antigos permanecem intactos.
- Não houve auditoria externa de segurança, testes de carga em escala ou balanceamento multiplayer real.

## Segurança

- As 6 tabelas `dg_*` usam RLS sem políticas públicas; acesso apenas com `service_role`/`sb_secret` do servidor.
- As 7 funções SQL usam `SECURITY INVOKER` e execução concedida apenas a `service_role`.
- Nunca colocar a chave secreta em `public/`, scripts client-side, snapshots ou variáveis `NEXT_PUBLIC_*`.
- Para autenticação, a aplicação mantém seu mecanismo de contas próprio com cookies; não usa Supabase Auth. Não confundir a chave de serviço com credenciais dos jogadores.
- O banco e as partidas estão isolados por identificador de campanha; hashes de senhas/recuperação são armazenados no banco.

## Testes

```
node --check src/server-cloud.mjs
node --check src/cloud-store.mjs
npm test
```

A suíte contém os 101 testes herdados e 4 novos testes de API cloud, cobrindo cadastro com convite, contas, sessão reiniciada, idempotência, recuperação, salas isoladas, tempo decorrido e inicialização segura.
