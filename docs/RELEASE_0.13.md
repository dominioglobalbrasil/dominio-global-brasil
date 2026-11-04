# DOMÍNIO GLOBAL • CAMPANHA BRASIL v0.13

## Objetivo

Evoluir a v0.12 para um **servidor local com autenticação de jogadores e persistência transacional**, preservando 27 UFs, 171 cidades estratégicas, as missões militares e as regras de guerra urbana. O visual segue provisório, conforme solicitado.

## O que foi implementado

- **Contas de usuário:** cadastro com usuário único, nome público e senha de no mínimo 10 caracteres.
- **Proteção de senhas:** `scrypt` (salt aleatório exclusivo por usuário); senhas nunca são persistidas em texto puro.
- **Recuperação de acesso local:** código aleatório de 128 bits gerado na criação da conta, mostrado uma única vez. A recuperação gera um NOVO código e invalida todas as sessões anteriores. **Não há envio por e-mail ainda.**
- **Sessão por cookie:** token aleatório de 256 bits, armazenado somente como hash SHA-256 no banco, cookie HttpOnly, SameSite=Strict e duração de 7 dias. O token não é enviado para o JavaScript do cliente. Em HTTPS, configure `DG_SECURE_COOKIES=1`.
- **Banco SQLite:** tabelas `accounts`, `sessions`, `campaigns`, `memberships`, `command_requests`, `auth_attempts`; transações com `BEGIN IMMEDIATE`; `WAL`, constraints e chaves únicas. O estado das campanhas deixa de ser gravado no JSON durante o uso normal.
- **Contas por campanha:** o mesmo usuário pode controlar um estado diferente em cada partida, sem partilhar tropas ou recursos; cada estado admite uma conta por partida.
- **Ordens idempotentes:** cada comando recebe UUID; mesmo UUID/carga retorna resultado já gravado, sem repetir o custo ou criar duas ordens. UUID usado para outra ação é recusado.
- **Controle de concorrência:** cada campanha tem `revision`. Uma ordem enviada sobre revisão desatualizada recebe HTTP 409; alterações e o recibo idempotente são escritos na mesma transação.
- **Login/registro/recuperação e sair:** telas novas separadas do lobby, sem alterar o HUD provisório.
- **Origem de requisições:** comandos de escrita exigem `Content-Type: application/json`, cabeçalho customizado `X-DG-Client: 1` e origem compatível; login tem limite de tentativas por usuário/IP.
- **Migração:** ao iniciar pela primeira vez, importa um arquivo JSON da v0.12 para o banco caso exista e salva `.backup-before-sqlite`. Não apaga a versão antiga. As contas antigas anônimas NÃO são automaticamente vinculadas a um usuário; use o script offline de reivindicação após conferir a titularidade.
- **Modo legado de testes:** `DG_LEGACY_GUEST=1`, restrito a localhost, preserva a API antiga **somente para testes de regressão**.

## Como executar

Requisito: **Node.js 22.16+**, pois `node:sqlite` é nativo mas ainda experimental nesta versão do Node.

```bash
npm start
```

Acesse `http://127.0.0.1:3000`. A primeira tela pede criação de conta ou login. O banco é criado em `.data/dominio-global.sqlite`; a pasta `.data/` é ignorada no pacote de código. O servidor fica vinculado apenas a `127.0.0.1` por padrão. Para teste com outro computador, **não basta abrir a porta**: é preciso HTTPS, configuração de proxy, autenticação e auditoria adicionais. **Não publicar ainda.**

Variáveis opcionais:

```bash
DB_FILE=/caminho/dominio-global.sqlite DATA_FILE=/caminho/antigo.json TICK_MS=60000 npm start
```

A persistência acontece em cada ação e em cada tick. Crie backups consistentes, preferencialmente com o servidor parado:

```bash
npm run backup -- /caminho/backup.sqlite
```

### Reivindicar um comando antigo (somente administrador local)

O jogador primeiro cria sua conta. Após verificar fora do jogo que ele é o comandante legítimo do estado antigo, o administrador executa:

```bash
node scripts/claim-legacy.mjs brasil-01 usuario_ja_cadastrado sp
```

Não existe rota pública para tomar o controle de comandos anônimos legados. Esse cuidado impede que qualquer jogador reivindique um estado anteriormente ocupado.

## Testes

```bash
npm test
python tests/browser_auth_bridge_smoke.py
```

- **100 testes automatizados**: os 94 da v0.12 e 6 novos conjuntos de integração de autenticação/SQLite (cada conjunto pode conter diversas verificações).
- Testado: cadastro, login, recuperação, reentrada após reiniciar, duas abas com revisão conflitante, idempotência, isolamento de campanhas e importação do JSON legado.
- Navegador: os endereços locais estavam bloqueados pelo navegador do ambiente de teste. A interface foi validada em Chromium com o HTML/CSS/JS da aplicação e uma ponte das chamadas `fetch` para a API HTTP real do servidor; as capturas não representam acesso remoto ou deploy.

## O que falta para produção

**A v0.13 não é infraestrutura multiplayer distribuída pronta.** Ainda faltam: banco PostgreSQL ou serviço transacional compartilhado, coordenador único de ticks/filas, recuperação via e-mail verificado, antifraude e anticheat, observabilidade, monitoramento, política de backups e restauração, rate limits distribuídos, HTTPS e proteção de infraestrutura, testes de carga, IA e balanceamento, administração e visual definitivo. SQLite local é apropriado **nesta fase de desenvolvimento**, não para múltiplas instâncias Vercel/servidores espalhados.

Sem deploy em produção.
