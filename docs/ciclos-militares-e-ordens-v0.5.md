# ESTATUM — Ciclos militares, movimentação, combate e ordens persistentes v0.5

**Data:** 07/11/2026
**Campanha-base:** Crise Sul-Americana — 2030 (história alternativa).
**Decisão oficial 05:** **ciclo militar fixado em 30 minutos**. Em um ciclo nacional de 12 horas, ocorrem 24 resoluções militares. Política/economia permanecem em 12h; diplomacia e negociação contínuas.
**Status:** especificação de projeto, **não é motor de jogo implementado**. A duração do ciclo está aprovada; velocidades, coeficientes e tabelas de unidades são propostas de balanceamento.
**Referências internas:** [decisões oficiais](decisoes-oficiais.md), [ciclo nacional](ciclo-de-turno-v0.1.md), [motor militar v0.1](motor-militar-v0.1.md), [guerra moderna e drones](estatum-guerra-moderna-e-drones-v0.1.md), [soberania e conquista](conquista-e-ocupacao-v0.3.md).

## 1. O que o jogo faz a cada 30 minutos

Os jogadores emitem ordens a qualquer momento, mas **todas as ordens e ações militares são avaliadas juntas** no próximo fechamento militar, de maneira independente de qual jogador clicou primeiro ou ficou online.

### Relógios do cenário
- **Microciclo militar:** 30 minutos exatos, configurado na campanha. Proposta técnica: fechamentos alinhados ao minuto 00 e 30 de um relógio canônico UTC; a interface apresenta horários no fuso do jogador.
- **Macrociclo nacional:** 12 horas, em dois fechamentos por dia, cujos **horários locais ainda não foram aprovados**. Corresponde a 24 microciclos por fechamento macro.
- **Diplomacia:** mensagens e negociação disponíveis continuamente. A vigência de tratado/cessar-fogo é timestamp preciso e deve ser considerada no fechamento do microciclo afetado.
- **País ausente:** ordens já publicadas persistem; políticas existentes e posturas defensivas continuam; a ausência não cria novas invasões ou declarações de guerra.

### Exemplo de tempo (hipótese para teste)
1. Às 14h07, o jogador confirma uma ordem para o Grupo Alfa.
2. Até 14h29, pode substituir ou cancelar a ordem sem custo de execução já realizado.
3. Às 14h30, o servidor fixa o snapshot e resolve em conjunto as ordens válidas; ordens recebidas exatamente após o corte entram no próximo fechamento.
4. A interface publica o relatório desse microciclo e o próximo horário de resolução (15h00).
5. Às 15h00, a mesma missão continua automaticamente, se ainda for possível e se o jogador não a alterou.

**Nota:** o exemplo não significa movimento instantâneo às 14h30; progresso depende de velocidade abstrata, rotas, suprimentos e obstáculos. Os horários usados são ilustrativos e os parâmetros de velocidade ainda precisam de testes.

### Ciclo de execução proposto
1. Fechar inscrições da janela por **relógio do servidor**, fixando `tickId`, `ruleVersion`, estado diplomático e ordem válida de cada formação.
2. Validar autoria, país/partida, localização, autoridade, tratados, capacidade do equipamento, custos, rotas e recursos.
3. Atualizar acesso a rotas, manutenção, suprimentos disponíveis e condições agregadas do setor.
4. Gerar **observações de inteligência** para o cálculo de contato; não entregar visão completa ao cliente.
5. Calcular progressos de deslocamento **simultaneamente**, com entradas/saídas de rotas e possibilidade de contato.
6. Resolver combates concorrentes usando o mesmo snapshot, levando em conta forças, prontidão, terreno, recursos, informação e capacidades agregadas de drones/defesa.
7. Resolver baixas, recuos, falhas de missão, consumo e mudanças de controle de pontos/setores.
8. Gerar eventos públicos e relatórios **privados por país**, filtrados por inteligência.
9. Persistir resultados, estoques, posições e comandos transacionalmente, com idempotência e histórico.
10. Publicar atualização e agendar próxima janela. Em falha, retomar com a mesma semente/snapshot e sem cobrança duplicada.

## 2. Mapa e movimento: sem teleporte

Usar a hierarquia aprovada: **42 regiões econômicas/administrativas + pontos estratégicos + setores operacionais ativados + rotas**. Os pontos podem representar cidades, bases, instalações e passagens; setores podem representar frentes e posições onde há forças ou disputa.

Cada formação ocupa **uma posição canônica**: nó de mapa, setor ou progresso em um segmento de rota. Pode ter subunidades agregadas, mas não aparecer em duas regiões ao mesmo tempo.

### Ordem de deslocamento
- Jogador seleciona um agrupamento e um objetivo permitido em mapa ou lista.
- O sistema propõe **itinerário de jogo** por conexões válidas, custos de deslocamento, condição da rota, risco e estimativa de ciclos.
- Jogador confirma a missão; ela fica persistente até concluir, ser cancelada, falhar ou precisar de intervenção.
- A cada microciclo, o motor avança uma fração calculada da rota conforme capacidade, terreno, condições, suprimentos, manutenção, fadiga e obstáculos.
- Uma rota pode ser parcialmente percorrida; se o jogador fechar o app, o movimento continua no próximo ciclo.
- Recalcular caminho **não ignora** trecho já percorrido; o estado canônico guarda `edgeId`, `progress` e posição de origem/destino.
- Sem caminho, combustível ou direito de passagem, a formação **fica detida** com explicação e recomendação de ação; não se teletransporta, não recebe combustível grátis.
- Cruzamentos simultâneos e entrada concorrente em um ponto são processados em conjunto; não existe vantagem por clique antecipado.

**Equilíbrio pendente:** velocidade nominal por tipo de formação, área de deslocamento em um ciclo e capacidade das rotas. Não definir números a partir de medidas militares contemporâneas reais.

## 3. Ordens militares: simples na tela, previsíveis na execução

### Missões iniciais do teste
- **Manter/Defender:** proteger a posição atual e reagir sob regras de engajamento configuradas.
- **Avançar:** deslocar por rota até objetivo definido, respeitando fronteiras, conflito e prioridade.
- **Retirar:** deslocar para posição acessível e segura, sujeito a obstáculos e perdas simuladas.

### Missões de expansão, já previstas mas ainda sujeitas a prioridade de implementação
- **Reconhecer:** observar setor e atualizar a qualidade de informação.
- **Escoltar:** aumentar segurança de fluxo/agrupamento de jogo.
- **Apoiar:** melhorar fatores agregados de força aliada em um setor sem duplicar posição.
- **Patrulhar/Monitorar:** manter presença e alertas de uma área.
- **Proteger rota:** priorizar segurança e abastecimento.
- **Reorganizar:** recuperar prontidão, manutenção, treinamento ou condição onde possível.

### Objeto de ordem e persistência
`orderId`, `idempotencyKey`, `campaignId`, `formationId`, `issuedBy`, `createdAt`, `effectiveTick`, `version`, `missionType`, `destination`, `waypoints` opcionais, `doctrine`, `engagementPolicy`, `priority`, `conditions`, `state`.

Fluxo de ordem: `draft → submitted → validated → queued → executing → completed|blocked|cancelled|superseded`.

- Cada formação deve ter **apenas uma ordem primária vigente**; editar gera nova versão, e a versão antiga é superada no fechamento aplicável.
- Ordens de apoio podem ser **efeitos ou módulos vinculados** à formação, não múltiplas ordens principais contraditórias.
- **Cancelar** interrompe ciclos futuros, não reverte combates/consumos já resolvidos; abortar uma missão não cria recuo instantâneo.
- Ordem impossível é rejeitada claramente sem gastar recursos; perda parcial de capacidade durante execução pode colocá-la em estado `blocked` ou mudar para postura de segurança prevista.
- O servidor limita duplicações e concorrência e rejeita alterações de unidades que o usuário não controla.
- **Autonomia enquanto offline:** executar objetivo aprovado e regras de proteção; para atacar outro país ou fazer mudança política, exigir autorização configurada do jogador e estado de guerra válido.

### Exemplo de interface
**Grupo Alfa · missão: Avançar**
`Partida: 001 · Objetivo: setor fictício 12 · ETA: estimada 3 ciclos · Logística: regular · Informação: parcial`
Botões: `Confirmar`, `Editar rota`, `Manter posição`, `Retirar`.
Depois de confirmar: `Ordem registrada • próxima avaliação 14h30`; ao processar: `Em deslocamento • 1/3 estimado • atraso possível`.
Números acima são apenas demonstração, sem pressupor velocidade oficial.

## 4. Combate: simultâneo, transparente no relatório, não determinista sem controle

**Regra central:** cada lado define ações antes do fechamento, e o motor resolve o contato usando **o mesmo estado inicial**, sem executar cada exército na ordem em que as ordens chegaram.

O motor leva em conta índices agregados de:
- força e composição de equipamento; prontidão, moral, experiência, doutrina, desgaste;
- terreno, tempo e características do setor **representadas abstratamente**;
- capacidade de suprimento, manutenção e munição disponível; 
- estado das fortificações e presença de apoio;
- inteligência, reconhecimento, comunicações, drones, defesa antidrone e guerra eletrônica;
- capacidade de retirada, continuidade de objetivo e proteção de pontos.

### Resultado de cada microciclo
`nenhum contato` / `contato detectado` / `engajamento inconclusivo` / `defesa mantida` / `progresso` / `recuo` / `ponto capturado` / `força desorganizada`.

- Um único combate **não significa** captura da região estratégica inteira.
- Forças com números superiores não vencem automaticamente, nem uma única tecnologia garante sucesso.
- Não usar "dano por segundo" nem cliques instantâneos de ataque; calcular resultados por ciclo.
- Em encontros simultâneos, uma mesma unidade **não pode ser contabilizada duas vezes**.
- Aleatoriedade controlada por **semente persistida + versão de regras** para permitir reconstrução e detecção de inconsistência.
- Relatório separa perdas próprias confirmadas, perdas inimigas estimadas, informação desatualizada e mudanças de controle.
- Valores concretos de perdas, alcance, proteção e probabilidade precisam de **balanceamento separado e testes automatizados**.

## 5. Drones: a mecânica característica do ESTATUM

Não transformar drones em "tanque voador". No jogo são **capacidades persistentes e consumíveis**, que mudam a forma de observar, proteger e disputar setores.

### 5.1 Reconhecimento não tripulado
- O jogador designa **esforço de reconhecimento** abstrato por frente ou região.
- A missão de observação é resolvida no microciclo, consumindo disponibilidade/estoque e capacidade de operação conforme regras.
- Cada contato gera relatório de inteligência com `observedAt`, `confidence`, `areaId`, `sourceClass`, `expiresAt`, **dados percebidos e incerteza**.
- O jogador visualiza **Confirmado / Provável / Desatualizado / Desconhecido**. Observações caducam com o tempo, e perder capacidade de observação não apaga retroativamente o que já foi visto.
- Mais drones melhoram cobertura potencial mas enfrentam custos, perdas, comunicação e capacidade de reposição; quantidade não equivale a visão perfeita.

### 5.2 Sistemas de ataque não tripulados
- São um **recurso agregado de apoio em combates simulados**, dependente de disponibilidade, inteligência suficiente, regras de engajamento e cadeia de suprimento.
- Emprego consome ou compromete estoque/operadores conforme a categoria do sistema; não há disparo infinito ou dano garantido.
- **Não introduzir seleção de alvos civis reais, trajetórias, frequências ou instruções operacionais.** A mecânica é de equilíbrio estratégico fictício.

### 5.3 Defesa antidrone e guerra eletrônica
- **Defesa antidrone:** índice de proteção do setor que pode mitigar disponibilidade/efetividade de sistemas não tripulados, com custo e desgaste.
- **Guerra eletrônica:** índices abstratos de interferência e resiliência que podem afetar confiança da inteligência, coordenação e disponibilidade.
- Defesas não criam imunidade permanente, e um jogador não precisa manter o app aberto para operarem.
- O relatório deve **explicar** alterações por termos de jogo ("perda de contato", "observação limitada", "proteção eficiente"), sem exposição de detalhes técnicos reais.

### 5.4 Atualização tecnológica
- Projetos, indústria e reposição são decisões da economia/política em ciclos de 12 horas; **microciclos militares consomem as disponibilidades já adquiridas**, não inventam produção a cada 30 min.
- Capacidade industrial e manutenção determinam sustentabilidade das operações; sistemas consumíveis são escassos.

## 6. Tratados, cessar-fogo e ordens

Uma negociação é contínua, mas o combate é discreto em microciclos. Para não haver paradoxo:
1. Toda cláusula tem `effectiveAt` em tempo canônico e objeto de aplicação explícito.
2. Antes de fechar o microciclo, o servidor consulta **tratados vigentes ao instante do fechamento**.
3. Se cessar-fogo entrou em vigor antes do fechamento, qualquer ordem ofensiva incompatível **não executa naquele fechamento**, mesmo que tenha sido enviada antes.
4. Mudanças após o fechamento não revertem resultados já persistidos; aplicam-se ao próximo ciclo.
5. O cliente apresenta imediatamente o estado diplomático e o próximo ciclo afetado para não parecer que um tratado foi ignorado.
6. Cessar-fogo pode permitir ações defensivas, retirada e manutenção segundo cláusulas previamente definidas.
7. Uma proposta de paz sem aceite **não interrompe a guerra**.

**Observação:** a política exata para vigência no meio de um intervalo e interrupção de ações em andamento deverá ser validada com testes de fronteira temporal. Ninguém pode usar atraso de processamento para invalidar acordo retroativamente.

## 7. Logística e orçamento integrado

**A cada 30 minutos:** avaliar acessibilidade de rotas, consumo de estoque entregue, desgaste da formação, manutenção operacional e efeitos de bloqueio, sem arrecadar impostos nem gerar novo orçamento a cada microciclo.

**A cada 12 horas:** consolidar custos debitados por microciclo, processar produção/recursos, receitas, construção, decisões políticas, ocupação administrativa e pressão de capitulação. Não cobrar o mesmo insumo duas vezes.

**Conservação:** recursos têm fonte, destino, estoque, compromisso e evento de consumo. Não deixar equipamentos/combustível de depósito distante aparecerem na formação instantaneamente. Um ponto capturado não rende todo o PIB da região.

**Prioridades:** quando há escassez, usar prioridades explícitas e previsíveis por jogador/formaçāo; não privilegiar quem clicou primeiro. A fila logística será balanceada posteriormente.

## 8. Ocupação, progresso territorial e capitulação

- Microciclo de 30 min pode atualizar **controle militar** de posição, setor, instalação e rota.
- **Administração** de regiões e renda passa pelo ciclo nacional de 12 h: custos, serviços, estabilidade e capacidade de guarnição.
- **Soberania** só muda pelos atos de paz, capitulação formal ou processo político previsto na Decisão 03; capturar posição não altera fronteira jurídica.
- A **capitulação por pressão** da Decisão 04 considera colapso prolongado e verificável nos fechamentos nacionais, não uma derrota isolada de 30 minutos.
- Uma nação derrotada pode continuar governando e reconstruindo, conforme seu regime pós-guerra.

## 9. UX de guerra moderna no celular

### Mapa
- **Zoom distante:** soberania, regiões e frentes relevantes, sem mostrar centenas de ícones.
- **Zoom médio:** formações agregadas, setores, rotas e pontos importantes.
- **Zoom próximo:** informação operacional que o jogador pode conhecer, linhas de movimento e ficha de unidade.
- **Marcadores:** `em deslocamento`, `defendendo`, `sem suprimento`, `contato detectado`, `ordem pendente`; agrupar ícones por zoom.
- **Névoa de guerra real:** dados secretos **não são enviados pela API**, não somente escondidos na tela.

### Fluxo compacto de ordem
1. **Toque na formação** (abre a ficha com missão, estado e inteligência).
2. **Escolha da missão** (Defender / Avançar / Retirar).
3. **Escolha do destino** no mapa ou lista; o sistema apresenta caminho permitido.
4. **Revisão** de custos, condições e ciclos estimados com aviso de incerteza.
5. **Confirmação** explícita e status `aguardando próximo ciclo`.
6. **Relatório** com progresso, perdas, novos contatos e motivos de bloqueio; possibilidade de alterar para ciclos futuros.

A ação NÃO fica "pendurada" enquanto o jogador espera. Ao fechar a tela, servidor mantém estado. Ao retornar, mostrar diferença entre último acesso e estado atual. Sem notificações a cada 30 minutos por evento irrelevante: agrupar alertas urgentes e publicar relatório coerente.

### Painéis separados
- **Forças:** formações, prontidão e agrupamentos.
- **Drones:** reconhecimento, disponibilidade, missão, reposição.
- **Comunicações:** confiabilidade e medidas agregadas de resiliência.
- **Operações:** ordens, alvos de jogo, rotas e frentes.
- **Relatórios:** acontecimentos por microciclo e consolidados por governo.

Não recriar dashboard empilhado: predominância do mapa, fichas compactas e navegação contextual; interface com identidade de jogo.

## 10. Dados e arquitetura (proposta)

Entidades: `campaign_schedule`, `military_tick`, `formation`, `military_order`, `order_revision`, `formation_position`, `route_edge`, `sector_state`, `stockpile`, `recon_mission`, `intel_report`, `drone_pool`, `ew_status`, `combat_event`, `occupation_event`, `diplomatic_effect`, `country_report`.

**Snapshot:** `campaignId`, `tickId`, `scheduledCloseAt`, `ordersRevision`, `ruleVersion`, `seed`, `hash`, `closedAt`.

**Implementação sugerida:** processamento transacional e exclusivo por campanha/ciclo, com único registro imutável por `campaignId+tickId`, bloqueio de concorrência, tentativas de reprocessamento e checksum; **nunca computar guerra no JavaScript do navegador**. O jogador só recebe visão autorizada do seu país.

**Fuso:** timestamps internos canônicos UTC e apresentação local, sem deslocar fechamentos com horário de verão do cliente.

**Falha de execução:** não executar dois ciclos sobre o mesmo snapshot nem pular décadas de jogo. Recuperar pendências na ordem e avisar manutenção em vez de duplicar custos, perdas ou movimentação.

## 11. Testes mínimos antes de implementar 42 regiões

1. Dois países enviam avanço ao mesmo ponto no mesmo ciclo: resolução simultânea e determinística.
2. Ordem enviada depois do fechamento entra no próximo ciclo; não altera histórico.
3. Jogador offline mantém ordem persistente válida sem criar nova guerra.
4. Editar/cancelar missão não reverte progresso ou perda já persistida.
5. Não há deslocamento por ligação inexistente ou em tempo nulo.
6. Falta de suprimento bloqueia ou degrada avanço conforme regra, sem saldo negativo mágico.
7. Mesmo equipamento e formação não são consumidos em dois combates simultâneos.
8. Reconhecimento atualiza visão com tempo/confiança e não envia localizações ocultas ao adversário.
9. Missão de drones consome disponibilidade sem produção extra no microciclo.
10. Defesa antidrone e comunicação não garantem invulnerabilidade nem detecção perfeita.
11. Cessar-fogo efetivo antes do fechamento bloqueia avanço incompatível nesse ciclo.
12. Cessar-fogo posterior não altera resultado já concluído.
13. Capture de cidade não altera soberania nem receita de macrorregião instantaneamente.
14. Eventos logísticos do microciclo aparecem uma única vez no fechamento governamental.
15. Reexecutar mesmo `tickId` não duplica ordens, perdas, saques, estoque ou mudança de controle.
16. Uma campanha com oito jogadores e 42 regiões permanece processável, e os dados secretos permanecem filtrados.
17. Teste de toque e legibilidade em telas mobile pequenas (320–390 px) com cinco áreas navegáveis.
18. Simular indisponibilidade do servidor e recuperação sem movimento duplo ou vantagem para país específico.

## 12. Propostas e decisões ainda pendentes

**Decisão 05 aprovada:** microciclo militar de **30 minutos**. Não reabrir essa duração sem solicitação do responsável.
**Decisão 06 recomendada:** definir o **grau de autonomia das ordens persistentes**, principalmente o que fazer quando a formação encontrar resistência, ficar sem suprimentos ou perder contato: (A) parar e pedir confirmação; (B) persistir até impossível, com políticas automáticas; (C) três posturas configuráveis por formação, com limites e necessidade de autorização explícita para escalar guerra.
**Ainda pendentes de balanceamento:** ritmo de deslocamento por trecho, consumo por missão, perdas, tecnologia e eficácia de drones, quantidade de agrupamentos, custos de reposição, fronteiras e unidades iniciais. Não aprovar por inferência.
**Também pendentes:** horário dos fechamentos de governo em fuso de campanha, critérios numéricos de ocupação e capitulação, limites do jogo pós-derrota e número de pontos estratégicos por região.

**Restrição de execução:** este documento não implementa backend, DB, regras de combate nem envia ordens. Não fazer deploy do site apenas por revisão de design.
