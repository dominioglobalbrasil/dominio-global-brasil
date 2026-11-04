# DOMÍNIO GLOBAL — v0.14 (Hospedagem gratuita em preparação)

Consulte **[README-ONLINE.md](README-ONLINE.md)** para a versão de nuvem, seus testes e limitações. **Não existe URL pública neste pacote.**

---

# DOMÍNIO GLOBAL — v0.13.1, PREPARAÇÃO PARA HOMOLOGAÇÃO ONLINE

**Não implantado online.** Foi preparada uma configuração dedicada de hospedagem em `render.yaml`, autenticação por convite e armazenamento persistente obrigatório. Ver `docs/RELEASE_0.13.1.md`.

# DOMÍNIO GLOBAL — CAMPANHA BRASIL v0.13 (CONTAS + SQLITE + ORDENS SEGURAS)

**Agora o modo padrão exige conta.** O servidor local usa SQLite para persistir usuários e campanhas, protege senhas com scrypt, usa cookies HttpOnly e recusa ordens repetidas ou conflitantes. O mapa do Brasil, as 171 cidades, logística, cercos e salas da v0.12 foram preservados.

## Iniciar a v0.13

Requer **Node.js 22.16 ou posterior**. Execute `npm start` e abra `http://127.0.0.1:3000`. Crie uma conta, guarde o código de recuperação (exibido uma única vez), selecione a campanha e assuma uma UF. O banco ficará em `.data/dominio-global.sqlite`.

```bash
npm start
npm test
npm run backup -- /caminho/backup.sqlite
```

A v0.13 importa o JSON anterior se ele existir, fazendo uma cópia `backup-before-sqlite`. Os antigos comandos anônimos precisam ser vinculados manualmente ao novo usuário pelo administrador: `node scripts/claim-legacy.mjs brasil-01 usuario sp` após conferir a titularidade. Consulte [RELEASE_0.13](docs/RELEASE_0.13.md).

**Atenção:** o antigo modo de tokens de teste está disponível apenas via `DG_LEGACY_GUEST=1` em localhost para regressões. Não é o modo padrão. A v0.13 continua local, **não está publicada online**, não suporta instâncias distribuídas e mantém o visual provisório.

---

## Referência das mecânicas da versão anterior

# DOMÍNIO GLOBAL — CAMPANHA BRASIL v0.12 (CERCOS, BLOQUEIOS E SALAS DE TESTE)

**Protótipo local de jogo de estratégia multiplayer (história alternativa)**, exclusivamente no mapa brasileiro, com as 27 unidades federativas. A identidade visual é **provisória**, conforme decisão do criador; prioridade atual é implementar mecânicas confiáveis e sistemas bem separados.

## Implementado até agora

- Mapa dos 26 estados e Distrito Federal, território colorido por controle, fronteiras e interação.
- Até 8 campanhas locais independentes, cada uma com até 27 comandos humanos, um por UF. Os comandos ausentes permanecem inativos (IA ainda não implementada).
- Cinco recursos: créditos, aço, combustível, alimentos e energia. Produção por estado e indústria.
- Cinco classes militares (infantaria, blindados, artilharia, aviação e drones), com custos, tempo de produção, força, defesa e velocidade específicos.
- Formações combinadas, movimentação por estados vizinhos, batalhas automáticas, ocupação por infantaria e fortificações.
- Diplomacia: declarar guerra, propostas de paz, aceitar ou recusar, cessar-fogo com duração definida.
- Logística de estoques: alimentação, combustível e energia por turno, inclusive para exércitos em trânsito.
- **v0.7 — Bases militares com níveis 0–3**, construídas por ordem no servidor (custo por nível: 480 créditos, 110 aço, 40 energia, 4 turnos). Cada nível oferece +10 pontos percentuais na base do multiplicador defensivo; níveis 1+ também criam centro logístico e autorizam reconhecimento por drones.
- **v0.7 — Logística territorial:** capitais e bases operacionais são centros de suprimento. O sistema percorre estados controlados adjacentes. A cada fronteira de distância, o teto local cai 12 pontos, limitado a 45%; áreas isoladas têm teto de 40%. O abastecimento real é o abastecimento nacional multiplicado pelo teto local; nunca ultrapassa 100%.
- **v0.7 — Reconhecimento por drones:** partindo de território próprio com base nível 1+ e dois drones, observar um estado adversário vizinho por ordem de 2 turnos (12 combustível, 8 energia). A composição de tropas é capturada em um relatório privado que expira 6 turnos após a conclusão. Essa missão não inicia guerra, não causa dano e não revela dados em tempo real.
- **v0.8 — Aeródromos militares (níveis 0–2) e baterias de artilharia (níveis 0–2)**, com custos, conclusão por turnos, limite por território e persistência.
- **v0.8 — Missões aéreas e bombardeios de artilharia** com alcance por fronteiras do mapa, guerra declarada obrigatória, consumo de recursos, unidades reservadas, dano às tropas adversárias e retorno dos sobreviventes. Não ocupam o território atacado.
- **v0.9 — 54 centros estratégicos ocupáveis:** 27 capitais (nomes reais) + 27 polos econômicos fictícios. Ordens de ocupação, reforço e retirada, guarnições independentes, receitas redirecionadas e capitais integradas à logística. A conquista de uma cidade **não** toma automaticamente o estado inteiro. A vitória exige controlar estados e centros.
- **v0.9 — Tela “Cidades estratégicas”** e marcadores SVG opcionais no mapa. Os marcadores são esquemáticos, não georreferenciamento preciso das capitais.
- **v0.10 — Piloto histórico de MS:** oito municípios destacados apenas para visualização. A antiga camada foi desativada na v0.11 para evitar duplicação dos pontos. Veja `docs/RELEASE_0.10.md`.
- **v0.11 — 171 localidades estratégicas jogáveis** nas 27 UFs (capitais, polos industriais, logísticos, agroalimentares, fronteiras, portos, energia, mineração e pesquisa), a partir do catálogo aprovado. Uma localidade de cada UF substitui o polo fictício antigo com o **mesmo ID**, preservando ordens e guarnições; os 117 pontos novos recebem IDs estáveis exclusivos.
- **v0.11 — Geolocalização leve:** 171 centróides municipais aproximados (e pontos indicativos para as regiões administrativas do DF), sem carregar a malha municipal. No mapa nacional não aparecem marcadores urbanos; ao ampliar uma UF (zoom >=1,5), só aparecem as cidades dela e suas rotas abstratas de campanha.
- **v0.11 — Economia urbana por função:** cada cidade produz um pequeno fluxo de recursos conforme funções primária e secundária. O recurso é recebido pelo **controlador da cidade**, que pode ser diferente do controlador estadual. Cercos e baixa logística reduzem receitas; o modelo de tributação dos 54 centros legados foi mantido.
- **v0.11 — Rotas e logística das cidades:** conexões simétricas e esparsas dentro de cada UF. Cidades capturadas sem caminho até um centro de abastecimento sofrem desgaste gradual. As rotas são **abstratas**, não estradas/ferrovias cartográficas.
- **v0.11 — Navegação separada:** painel de cidades filtra cada UF, ocupação em modal próprio, detalhes econômicos e rotas na janela da cidade; os controles de estados continuam separados. Nenhuma lista de 171 marcadores sobre o mapa.
- **v0.12 — Guerra urbana avançada:** bloqueios temporários por rota, cerco com perda progressiva de suprimentos e produção, socorro da guarnição que desfaz cercos e bloqueios, comboios e defesas urbanas em janelas separadas.
- **v0.12 — Lobby multissala de testes:** seleção/criação de campanhas locais independentes, tokens de sessão exclusivos por sala, isolamento de ordens, recursos e jogadores, persistência multissala com migração e backup do salvamento anterior.
- Interface organizada por módulos; bases em **Construções → Bases militares**, aeródromos e baterias em abas próprias, logística em **Exército → Logística**, apoio em **Exército → Missões especiais**, relatórios em **Inteligência → Relatórios privados**. Ordens abrem em janelas próprias.
- Persistência local em arquivo JSON, simulação autoritativa no servidor, atualizações via SSE e polling de contingência.

## Como jogar localmente

**Pré-requisito:** Node.js 20+ (sem dependências externas NPM).

```bash
npm start
```

Abra `http://127.0.0.1:3000`. Escolha ou crie uma sala de campanha no lobby, assuma um estado e escolha um nome de comandante. Para testar com outro jogador na mesma sala, abra uma janela anônima ou outro navegador. Até oito salas locais para testes; ainda não existe autenticação permanente.

Para acelerar ou desacelerar os turnos:

```bash
TICK_MS=60000 npm start
```

O valor padrão é **20 segundos por turno de teste**, não 20 segundos do lançamento definitivo. As partidas não estão publicadas na internet.

O salvamento da v0.12 usa schema 10, em um envelope multissala (`storeVersion: 1`) e faz backup da versão anterior quando necessário. O salvamento fica em `.data/brasil-session.json` e pode ser alterado com `DATA_FILE=/caminho/arquivo.json`. **Faça backup desse arquivo antes de trocar de versão.** O servidor cria automaticamente uma cópia `*.backup-v9` (ou da versão anterior correspondente) antes de migrar uma campanha legada.

## Testes

```bash
npm test
python tests/browser_centers_smoke.py
python tests/browser_smoke.py
python tests/browser_recon_smoke.py
python tests/browser_smoke_v08.py
python tests/browser_support_smoke.py
python tests/browser_national_cities_smoke.py
```

Os testes de navegador requerem Python Playwright e Chromium no ambiente. O `npm test` cobre 94 casos: motor, diplomacia, compatibilidade de salvamentos, integração HTTP, bases, logística, reconhecimento privado, aeródromos, baterias, alcance e missões especiais. Os testes de navegador usam um servidor Node real e perfis emulado de desktop e celular.

## Regras principais da v0.7

| Ação | Exigências | Resultado |
|---|---|---|
| Construir base militar | Estado seu, recursos, base <3, nenhuma obra de base em curso | Conclui em 4 turnos; +1 nível; centro de suprimento quando nível >=1 |
| Reconhecer com drones | Base nível >=1, 2 drones, adversário vizinho, combustível e energia | Relatório privado após 2 turnos, com expiração em 6 turnos |
| Logística territorial | Conexão por estados controlados até capital ou base | Teto de 100% no centro, -12 pontos por fronteira, mínimo 45% conectado |
| Estado isolado | Nenhum caminho aliado até capital ou base | Teto logístico local de 40%, com penalidade no combate |
| Defender com base | Base concluída e estado sob ataque | Bônus à potência defensiva do território; a base perde um nível na conquista |

Valores são **regras fictícias de balanceamento**, não representação técnica de conflitos reais.

## Novidades da v0.8 — apoio aéreo e de artilharia

| Ordem | Requisitos | Duração / alcance | Custos |
|---|---|---|---|
| Aeródromo militar | Estado próprio, nível inferior a 2 | 4 turnos por nível | 520 créditos, 125 aço, 50 energia |
| Bateria de artilharia | Estado próprio, nível inferior a 2 | 3 turnos por nível | 370 créditos, 95 aço, 28 combustível |
| Missão aérea | Aeródromo 1+, guerra ativa, 2 a 12 aeronaves | 2 turnos, até 2/3 fronteiras (nível 1/2) | 32 combustível + 8 por aeronave + 18 energia |
| Bombardeio | Bateria 1+, guerra ativa, 4 a 24 peças | 1 turno, vizinhos | 22 aço + 2 por peça + 12 combustível |

Missões não conquistam estados. Unidades são reservadas e retornam após a conclusão. Cessar-fogo cancela missões de apoio pendentes. Regras de combate representam balanceamento fictício. A migração das campanhas até schema 8 é automática e faz backup do arquivo anterior. Consulte `docs/RELEASE_0.8.md` para requisitos completos.

## O que ainda NÃO existe

**Não é um jogo pronto para publicação.** O lobby e as campanhas separadas já funcionam apenas localmente. Falta: contas de verdade e recuperação de acesso; banco transacional multi-instância; controle de sessões e antiabuso; IA para comandantes ausentes; expansão para municípios além dos 171 pontos selecionados (não planejada para o mapa nacional); interceptação aérea, alcance por quilômetros e artilharia além do estado vizinho; logística avançada por estradas/ferrovias, mercado e política; pesquisa militar; chat; tutorial; balanceamento com jogadores; efeitos de combate e visual final.

**Não fazer deploy automático.** Validar completamente antes de hospedar publicamente. O protótipo local usa tokens de teste e um único arquivo JSON — inadequado para lançamento online.

Veja `docs/RELEASE_0.12.md` para os novos cercos, bloqueios e salas de teste, `docs/RELEASE_0.11.md` para o cadastro nacional integrado, `docs/RELEASE_0.9.md` para a etapa inicial de cidades, `docs/RELEASE_0.8.md` para apoio militar e `docs/ARCHITECTURE.md` para a arquitetura base.

**Validação da camada municipal:** `python tests/browser_national_cities_smoke.py` (desktop e celular). A antiga camada de contornos municipais da v0.10 foi desativada; não é necessária para a v0.11.

## Novidades da v0.12

O lobby permite criar e escolher campanhas de teste independentes; as ordens militares e os saldos são isolados entre salas. Na janela de cada cidade agora existem operações de **cerco, bloqueio de rota, socorro, suprimento e fortificação**, com validação do servidor. Confira `docs/RELEASE_0.12.md` para custos, durações, limitações, testes e pendências.
