# Atualização v0.5 — mecânicas e estabilidade

Esta atualização não mexe no estilo geral do HUD. Implementa ações reais de diplomacia, obras de defesa e correções operacionais.

## API

`POST /api/diplomacy` com JSON:

- `{ "token": "...", "type": "declare_war", "targetId": "sp" }`
- `{ "token": "...", "type": "offer_peace", "targetId": "sp" }`
- `{ "token": "...", "type": "accept_peace", "proposalId": 1 }`
- `{ "token": "...", "type": "reject_peace", "proposalId": 1 }`

`POST /api/order` já existente aceita `{"token":"...","type":"fort","provinceId":"ms"}`.

O estado em `/api/state` inclui `diplomacy.wars`, `diplomacy.truces`, `diplomacy.proposals` (estas últimas somente para o comandante envolvido). A validação não confia no frontend.

## Compatibilidade

O arquivo da campanha v2 é convertido na primeira inicialização em v3 preservando as propriedades existentes e criando o estado diplomático inicial. Para uso em produção, criar backup antes de migrar. Não é possível retornar a v0.4 usando a campanha já migrada sem conversão adicional.

## Testes automatizados

`npm test` inclui testes do motor, negociação com dois jogadores, expiração de propostas, restrições de cessar-fogo, efeito real das fortificações e reinício de servidor com dados migrados. `npm run test:browser` usa Chromium para verificar desktop e mobile com servidor real.
