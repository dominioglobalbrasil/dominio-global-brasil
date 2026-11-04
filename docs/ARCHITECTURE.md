# DOMÍNIO GLOBAL — Arquitetura de evolução

## Protótipo local (incluído)
Navegador (HTML/CSS/JS, mapa SVG) ⇄ API HTTP + SSE (Node) ⇄ Motor determinístico de simulação ⇄ arquivo JSON local.

- `server.mjs`: rotas, sessão de teste, SSE, timer e armazenamento.
- `src/engine.mjs`: regras e validações; funções sem dependência de browser.
- `src/map.json`: topologia, geometria SVG e configuração do cenário.
- `public/`: interface responsiva, mapas, UI de comando, economia e eventos.
- `tests/`: testes automatizados.

## Produção proposta (não implantada)
Web (React/Next.js) em Vercel ⇄ endpoints autenticados ⇄ Supabase Auth/Postgres/RLS.
Worker de simulação separado processa ticks sob lock por jogo, grava ordens e eventos de forma transacional.
Supabase Realtime Broadcast transmite mudanças aos inscritos autenticados; clientes confirmam estado por API após reconexão.
MapLibre GL JS com GeoJSON/tiles serve regiões geográficas dinâmicas; área estratégica e unidade têm geometrias separadas da lógica do combate.

## Consistência e antitrapaça
- Cliente **nunca** escolhe resultado de batalha ou atualiza recursos/efetivos diretamente.
- Ordens com `game_id`, jogador autenticado, idempotency_key e expected_version.
- Verificar país, controle da origem, tecnologias, custos, alcance, janelas diplomáticas e estoques no servidor.
- Reservar recursos e unidades na mesma transação da ordem. Marcar ordem executada exatamente uma vez.
- Cada tick deve ter lease, `SELECT ... FOR UPDATE`/advisory lock, sequência única e logs auditáveis.
- Replay de eventos + snapshots para investigação de bugs; métricas de tick lento e latência.
- RLS de leitura por membro; chave service-role **jamais** presente no front-end.
- Não confiar em tropas ou vizinhança informadas pelo cliente.

## Hospedagem
Vercel pode servir a interface e API pontual; **não** será a sede do loop de atualização nem do WebSocket servidor persistente. Um worker sempre ativo ou agendamento confiável do banco deve calcular ticks.

## Atenção às credenciais de protótipo
O token do MVP fica no armazenamento local e é passado à API. Isso é adequado somente para testes fechados: não expor publicamente na internet. Implementar login e sessões reais antes de lançamento.
