# Release 0.14 — Banco de dados remoto + hibernação gratuita

## Situação

Implementação concluída localmente. Banco e Render não provisionados. Não confundir o teste local de API simulada com deploy real.

## Código adicionado

- `src/server-cloud.mjs`: API online do jogo, lógica de catch-up, persistência no Supabase e controle de acesso;
- `src/cloud-store.mjs`: cliente REST do Supabase, usando `sb_secret_...` exclusivamente via header `apikey` no backend, validações e autenticação;
- `sql/setup_supabase.sql`: tabelas e funções atômicas com RLS e permissões fechadas;
- `render.yaml`: plano Free, variável de convite, secrets não commitados e sem SQLite no disco efêmero;
- `tests/cloud-hosting.test.mjs`: testes de integração com mock de PostgREST;
- `README-ONLINE.md`: instruções, limitações e implantação controlada.

## Turnos durante inatividade

`last_tick_at` é um timestamp em milissegundos armazenado por campanha. A cada leitura do estado, o servidor calcula `Math.floor((Date.now() - last_tick_at) / TICK_MS)` e processa o máximo de 120 turnos em um lote, de forma determinística, salvando `game_json`, revisão e `last_tick_at` em transação. Se houver mais turnos pendentes, agenda outros lotes. A atualização é protegida por compare-and-swap de revisão: duas instâncias não aplicam o mesmo intervalo duas vezes.

## Pendências para teste remoto

1. Escolha explícita da organização de um novo projeto Supabase (necessário antes da criação).
2. Conectar o Render; não há integração Render ativa nesta conversa.
3. Criar repositório GitHub exclusivo, instalar migração, associar segredos no servidor, fazer o primeiro deploy.
4. Teste real de RLS, SQL RPC, latência, hibernação, disponibilidade, volume de turnos e limites do plano gratuito.

Não tocar na UNIFA/Nexum.
