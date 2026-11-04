# Domínio Global — Campanha Brasil 0.12

**Estado:** protótipo local testado, não publicado. Arte provisória mantida conforme decisão do projeto.

## Novidades reais

### Guerra urbana

- **Cerco urbano:** usa a ordem `sector_siege` (quatro turnos), mantém a força do atacante comprometida, reduz o abastecimento da cidade enquanto ativo e diminui sua produção. O fim do cerco usa o mesmo motor de combate de cidades da v0.11. Não conquista automaticamente o estado.
- **Bloqueio de rota (`sector_blockade`):** um comandante pode interromper por até seis turnos uma conexão abstrata diretamente ligada a uma cidade inimiga. A preparação demora um turno e custa 110 créditos, 22 combustíveis e 12 energias. O bloqueio diminui a receita e o abastecimento local. Não transfere controle de território.
- **Socorro urbano (`sector_relieve`):** o defensor pode reservar 15 unidades de infantaria e enviar uma força de socorro, que leva dois turnos e custa 140 créditos, 35 alimentos e 15 aços. Na conclusão, pode romper cercos pendentes e bloqueios contra a cidade, com perdas de unidades na operação.
- **Suprimentos e fortificações** da versão anterior passam a ser acessíveis por janelas separadas na interface. Comboios convencionais não atravessam cidade cercada/bloqueada.
- **Segurança das regras:** bloqueio exige conexão urbana real do catálogo, destino adversário, origem estadual controlada e dentro do alcance, e respeita cessar-fogo. Uma mesma rota não aceita bloqueio duplicado. Paz, expiração ou mudança de controle encerram o efeito.
- **Limite da simulação:** as rotas são conexões de campanha fictícias, não uma representação de estradas, ferrovias ou táticas militares reais. A interrupção de uma rota não interrompe automaticamente todo abastecimento estadual; ela altera o funcionamento urbano daquela rota e os percursos internos do grafo.

### Salas independentes de teste

- O servidor pode manter até **8 campanhas locais** em paralelo, cada uma com relógio, 27 facções, 171 cidades, diplomacia, jogadores, recursos, exércitos e ordens próprios.
- Interface de **lobby** no modal inicial: selecionar uma campanha existente ou criar uma nova antes de escolher seu estado.
- Tokens de sessão de teste são separados por campanha no navegador. Um comandante em uma partida não consegue enviar ordens para a outra usando o mesmo token.
- Endpoints: `GET /api/matches`, `POST /api/matches`, `GET /api/state?matchId=...`, `POST /api/join` com `matchId`, `POST /api/order`, `POST /api/diplomacy`, `GET /api/events`.
- **Persistência em arquivo JSON multissala**: envelope `storeVersion: 1`, com `matches[id].game`. O jogo interno usa schema **10**. Salvamentos antigos de campanha única são migrados automaticamente e recebem backup integral (`.backup-v9`, `.backup-v8` etc.).
- **Aviso:** lobby e sessões são apenas para testes locais. Falta login robusto, limites por usuário, rate limit, validação de ambiente público, banco de dados transacional, recuperação de conta, gestão de salas e sincronização multi-instância. **NÃO publicar na internet ainda.**

## Como executar

```bash
npm start
```

Acesse `http://127.0.0.1:3000`, selecione/crie a sala e escolha seu estado. Para testar outro comandante, use um navegador ou perfil diferente. `TICK_MS=60000 npm start` altera o intervalo entre os turnos para 60 segundos.

## Testes executados

- `npm test`: **94 testes automatizados aprovados** (80 anteriores + 13 de guerra urbana + 1 teste de API/salvamento multissala).
- `python tests/browser_urban_lobby_smoke.py`: desktop e mobile, salas independentes, modais de bloqueio/cerco e ordens confirmadas no servidor.
- Regressão em Chromium: navegação, mapas e centros, inteligência por drones, missões aéreas e construção em desktop/mobile.
- Não inclui testes públicos sob carga, ataques de rede ou verificação de segurança de produção.

## Próximas prioridades

1. **Autenticação de verdade e perfis** no banco, com recuperação de acesso e proteção de sessões.
2. **Motor persistente de produção**, transações e bloqueios de concorrência; partidas independentes em banco em vez de arquivo.
3. **Guerra urbana avançada:** mais modos de socorro, custos por turnos de cerco, rotas com bloqueios visualmente destacadas no mapa e regras de vitória adequadas.
4. **IA dos estados não ocupados**, equilíbrio econômico/militar, chat, notificações e manual de jogo.
5. Reformulação visual completa somente após estabilizar as mecânicas, conforme orientação do criador.
