# ESTATUM — Registro de decisões oficiais

Registro das escolhas **aprovadas pelo responsável pelo projeto**. Prevalece sobre valores antigos apresentados apenas como proposta nos documentos v0.1. Não altera automaticamente a aplicação hospedada.

## Decisão 01 — Ritmo híbrido do jogo (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** Opção C, sistema híbrido.

- **Política e economia:** ciclos nacionais de **12 horas**, com fechamento, resolução e relatório em horários definidos por campanha.
- **Diplomacia:** conversas, propostas, contrapropostas e acordos podem ocorrer continuamente; obrigações/efeitos com impacto no estado serão aplicados com regras e horário explícitos, evitando paradoxos em turnos.
- **Operações militares:** processamento em ciclos **mais curtos que os governamentais**, com evolução entre os fechamentos econômicos, sem exigir que o jogador fique conectado continuamente.
- **Periodicidade militar EXATA: 30 minutos**, aprovada em 07/11/2026 pela Decisão 05. Em 12 horas há 24 microciclos militares; configurações de horários, corte de ordens e balanceamento seguem detalhamento técnico.
- **Prevenção de sobrecarga:** ordens persistentes, regras de engajamento e prioridades de logística; ausência do jogador não força ações arbitrárias.
- **Consistência:** motor econômico e militar isolados em frequência, integrados por snapshots/versionamento, sem gasto duplo, efeitos retroativos ou violação de tratados.
- **Expansibilidade:** parâmetros são configuráveis por campanha; novos países e mais jogadores não exigem alterar a mecânica de agendamento.

## Decisão 02 — Mapa e divisão territorial (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** Opção C — **mapa hierárquico**, com **42 regiões estratégicas como escala inicial** da campanha.

- **País → região estratégica → pontos estratégicos / setores operacionais**; a interface e o modelo territorial devem ser expansíveis.
- Países reais e geografia real na campanha *Crise Sul-Americana — 2030*, de história alternativa.
- Controle de **cidades, bases, infraestrutura, corredores, forças e linhas logísticas** é distinguido do controle de uma região inteira.
- Uma vitória ou incursão militar **não conquista automaticamente uma macrorregião**.
- O número 42 é a **escala inicial aprovada**, com distribuição proposta Brasil 6, Argentina 6, Chile 5, Bolívia 5, Paraguai 5, Uruguai 4, Peru 6 e Equador 5; a lista de agregações administrativas e pontos específicos ainda requer validação geográfica e de balanceamento antes da implementação.
- O mapa deve ter camadas/zoom adequados ao celular; setores detalhados e dados de inteligência apenas conforme relevância e permissão de cada jogador.
- **Regras de conquista e ocupação:** em detalhamento, não considerar pesos/fórmulas numéricas como aprovados ainda.
- Referências: [proposta cartográfica](mapa-e-divisao-territorial-v0.1.md) e [detalhamento territorial e de conquista](territorios-e-conquista-v0.2.md).

**Pendências:** validar a agregação exata dos estados/províncias, quantidades e locais dos pontos operacionais, métricas de controle/ocupação e intervalos militares.

## Decisão 03 — Soberania, ocupação e anexação (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** opção **C — sistema misto** de conquista.

- Uma ofensiva pode mudar o **controle militar** de pontos e setores; isso não transfere automaticamente a soberania jurídica.
- O ocupante pode estabelecer **controle administrativo parcial**, com efeitos proporcionais, necessidade de suprimento, presença, estabilidade e custo de ocupação.
- A **anexação ou mudança definitiva de soberania** depende de um **tratado de paz, capitulação ou outro processo político expressamente previsto nas regras do cenário**, com evento verificável e auditável.
- A queda de uma capital, a captura de uma única posição ou a ocupação de uma região **não** equivalem automaticamente à anexação, à transferência de todos os recursos ou a vitória na campanha.
- Regras devem conectar o microciclo militar ao turno governamental de 12h, com diplomacia contínua e vigência explícita dos tratados.
- **Ainda não aprovados:** coeficientes, tempo mínimo de consolidação, critérios de capitulação, custos e fórmulas de ocupação; serão tratados separadamente como propostas.
- Especificação: [Conquista, ocupação e capitulação v0.3](conquista-e-ocupacao-v0.3.md).

## Decisão 04 — Capitulação por pressão e continuidade do derrotado (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** opção **C — capitulação por pressão**, com possibilidade de resistência, negociação ou rendição voluntária; em caso de **colapso prolongado e demonstrável**, o sistema pode instaurar processo formal de capitulação com efeitos limitados mesmo sem consentimento do governante.

- **Não há rendição instantânea por uma derrota, perda da capital ou conquista isolada.** Pressão militar, situação econômica, controle territorial e capacidade de governo serão avaliados de maneira proporcional e verificável.
- O governante tem caminhos para **resistir, negociar, aceitar termos, buscar mediação ou recuperar capacidade** antes de eventual imposição.
- **Capitulação forçada exige processo objetivo e anunciado previamente**, continuidade do colapso, notificação e prazo para resposta, regras publicadas antes da campanha e resultado auditável.
- **A capitulação não equivale a anexação integral.** Cessões territoriais e outras obrigações dependem de cláusulas territorialmente específicas e dos limites definidos pelo regulamento.
- **O jogador derrotado não é expulso automaticamente da campanha.** Deve continuar jogando, quando seu país conservar governo/território e conforme regras de continuidade; participar da reconstrução, renegociar obrigações e buscar metas não militares.
- Um país derrotado pode continuar como **soberania reduzida/ocupação parcial**, sob compromissos ou restrições temporárias, sem perder automaticamente a identidade nacional.
- **Antiabuso:** critérios proporcionais para países menores, vedação de duplicação de pressões, resistência sem exploração de estado de guerra, e impossibilidade de o vencedor inventar unilateralmente termos sem regra.
- **Ainda NÃO aprovados:** pesos e limiares de capitulação, tempo mínimo do colapso, duração da resposta, limite máximo de reparações/cessões, condições exatas de continuidade, caso de ocupação total e mecanismos de reversão.
- **Detalhamento de proposta:** [Capitulação, pressão e continuidade v0.4](capitulacao-e-continuidade-v0.4.md).

## Decisão 05 — Ciclo militar de 30 minutos (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** operações militares resolvidas a cada **30 minutos**.

- Governo e economia mantêm os ciclos de **12 horas** da Decisão 01; diplomacia e mensagens permanecem acessíveis continuamente.
- **Reconhecimento, movimentação, suprimentos operacionais, combate, perdas, recuos e controle militar de setores/pontos** são processados no ciclo de 30 minutos, com consistência transacional e resolução simultânea de todos os países envolvidos.
- **Ordens persistentes e editáveis** permitem planejar trajetos, posturas e prioridades sem conexão permanente; cada ciclo usa somente a versão das ordens válida no seu fechamento.
- **Sistemas não tripulados** entram na dinâmica de reconhecimento e combate como capacidades abstratas, sujeitos a estoque, reposição, comunicação, defesa antidrone e informação incompleta.
- **Controle militar** muda em microciclos, enquanto **ocupação administrativa, economia e indicadores nacionais** fecham em 12 horas; a soberania só muda pelos atos políticos formalizados na Decisão 03.
- **Cessar-fogo e tratados** devem prevalecer desde a vigência aplicável, sem permitir ordens posteriores incompatíveis.
- Nenhuma ordem é processada no navegador; o servidor deve oferecer reprocessamento idempotente e log auditável.
- **Detalhamento de engenharia e UX:** [Dinâmica militar e ordens v0.5](ciclos-militares-e-ordens-v0.5.md).
- **Ainda não aprovados:** velocidades por formação e terreno, tabelas de perdas, alcance/duração de missões, consumo, fila/prioridade logística, número inicial de formações e limites de ordens por país. São parâmetros para balanceamento, não novas escolhas presumidas.

## Decisão 14 — Abrangência sul-americana (APROVADA)
**Data:** 08/11/2026.

**Escolha do responsável:** ESTATUM terá abrangência na **América do Sul**, com **países reais jogáveis**.

- Cada jogador governa um **país** e não uma Unidade da Federação brasileira como entidade soberana independente.
- A campanha inicial mantém a premissa ficcional **Crise Sul-Americana — 2030**, com países e geografia reais, governos e eventos fictícios.
- A restrição de mapa somente ao Brasil, 27 UFs, encontrada em um dossiê de continuidade, **não é a regra atual**. A proposta de uma federação exclusivamente brasileira em crise não foi aprovada.
- Países podem conter regiões estratégicas, pontos e setores, mas controle tático e ocupação não equivalem a soberania, conforme Decisões 02 e 03.
- **Referência de aprovação:** [issue #1](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/1).

## Decisão 15 — Oito países jogáveis na estreia (APROVADA)
**Data:** 08/11/2026.

**Escolha do responsável:** opção **A**, oito países controláveis inicialmente, escala inicial de **42 regiões estratégicas**, com expansão posterior.

- **Países jogáveis na primeira campanha:** Brasil, Argentina, Chile, Bolívia, Paraguai, Uruguai, Peru e Equador.
- **Distribuição geográfica inicial do modelo C:** Brasil 6; Argentina 6; Chile 5; Bolívia 5; Paraguai 5; Uruguai 4; Peru 6; Equador 5. **Total: 42.** Os agrupamentos e limites específicos ainda exigem validação cartográfica e de balanceamento.
- A geografia da campanha continua sendo a **América do Sul**, embora os demais países **não estejam disponíveis para seleção no lançamento inicial**. Eles não devem ser tratados como territórios vazios ou automaticamente conquistáveis.
- Os **oito países e as 42 regiões são conteúdo inicial, não limites de arquitetura**. Novos países, pontos e setores devem ser incorporáveis por catálogos versionados.
- Quantidade de regiões não deve equalizar artificialmente população, riqueza, capacidade industrial ou força militar.
- **Aguardam decisão separada:** como funcionam países sem jogador e países não selecionáveis (Decisão 16); condições de vitória e duração da campanha (Decisão 17).
- **Referência de aprovação:** [issue #2](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/2).

## Decisão 16 — Continuidade híbrida e defesa de países sem jogador (APROVADA)
**Data:** 09/11/2026.

**Escolha do responsável:** opção **C — modelo híbrido de continuidade e defesa**.

- **País selecionável ainda sem jogador:** políticas e orçamento persistentes, produção, consumo, arrecadação e obrigações seguem os ciclos de **12 horas**; defesa reativa e ordens persistentes de unidades são executadas pelo servidor nos ciclos de **30 minutos**, limitadas aos recursos, estoques, informações e condições existentes.
- **Sem IA ofensiva arbitrária:** o sistema não inicia guerras, ofensivas, anexações, alianças ou tratados estratégicos em nome de governantes ausentes. Mantém defesa, preservação de forças e compromissos vigentes, sempre conforme regras e posturas documentadas.
- **Entrada do jogador:** assume o estado persistido do país (recursos, perdas, forças, tratados, dívidas e efeitos anteriores) sem reset ou bônus artificial.
- **Demais países sul-americanos representados, mas não selecionáveis na estreia:** conservam soberania, fronteiras e integridade cartográfica; não são territórios vazios nem passíveis de ocupação/conquista até que sua simulação e regras sejam implementadas e aprovadas.
- **Auditabilidade:** registrar decisões humanas, ordens anteriormente configuradas e ações automáticas do servidor; processamento reexecutável sem duplicação de recursos ou efeitos.
- **Parâmetros pendentes:** detalhar a defesa reativa, as posturas padrão e a substituição de jogadores com testes; esta decisão não aprova os coeficientes.
- **Referência de aprovação:** [issue #4](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/4).

## Decisão 17 — Campanha de 20 dias e vitória multicritério (APROVADA)
**Data:** 09/11/2026.

**Escolha do responsável:** opção **A — campanha inicial de 40 turnos de 12 horas reais = 20 dias corridos reais**, com encerramento e classificação ao final; aprovado também o **modelo de vitória multicritério originalmente proposto**.

- **Cinco pilares, total máximo de 100 pontos:** prosperidade e responsabilidade fiscal **25**; governo e estabilidade **20**; diplomacia e confiabilidade **25**; segurança e soberania **20**; objetivos nacionais específicos **10**.
- Cada pilar usa uma escala de desempenho de **0 a 100**, ponderada pelo respectivo peso. A pontuação é calculada por critérios versionados e auditáveis, usando progresso em relação às condições iniciais, métricas per capita/capacidade e metas apropriadas a cada país; não favorece automaticamente potência ou território maior.
- **Vitória não depende de guerra:** captura de capital, capitulação alheia, número de conflitos ou unidades eliminadas não encerram a campanha nem geram pontos automáticos de vitória. Diplomacia, boa administração e segurança são caminhos competitivos.
- **Encerramento:** apuração após o fechamento do **40º turno**, com horário preciso de abertura/fechamento e regras de empate/ordem de processamento a detalhar. Microciclos militares de 30 minutos e vigência de tratados seguem as Decisões 01 e 05.
- **Antiabuso e transparência:** não pontuar artificialmente transferências circulares, tratados sem benefício executado ou ações repetidas; armazenar trilha de cálculo, fontes e versão da regra. Não alterar critérios silenciosamente durante uma campanha.
- **Tempo da campanha versus cenário:** 20 dias são tempo **real**; o cenário fictício é ambientado em 2030. A escala de desenvolvimento de infraestrutura, indústria, tecnologia, demografia e política exige especificação e balanceamento, sem pressupor que 12 horas reais equivalem a 12 horas históricas.
- **Ainda pendentes:** métricas/fórmulas exatas, metas nacionais equivalentes para os oito países, critérios de desempate a validar, horários e congelamento final, durações/efeitos de investimentos e balanceamento. O modelo é aprovado; os coeficientes detalhados ainda não foram testados.
- A duração e os pesos desta campanha são **fixos por decisão de produto**, porém devem ser **parametrizáveis por cenário** no motor futuro, sem alterar temporada em andamento.
- **Referência de aprovação:** [issue #5](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/5).

## Decisão 18 — Objetivos nacionais híbridos (APROVADA)
**Data:** 09/11/2026.

**Escolha do responsável:** opção **C — 5 pontos por objetivo nacional estrutural e 5 pontos por agenda estratégica escolhida pelo jogador**, dentro dos **10 pontos** do componente de objetivos nacionais definido pela Decisão 17.

- **Objetivo estrutural (até 5 pontos):** específico para cada país da campanha, definido em catálogo versionado e contextualizado conforme geografia, população, economia e desafios nacionais do cenário. Progresso avaliado com indicadores verificáveis e coerentes com a situação inicial.
- **Agenda estratégica (até 5 pontos):** o governante escolhe no começo da campanha entre alternativas viáveis para seu país. Áreas candidatas incluem modernização produtiva, integração comercial, estabilidade fiscal, instituições e defesa; **o elenco final de agendas permanece pendente**.
- **Equidade sem nivelamento artificial:** todos dispõem do mesmo potencial de pontuação, mas metas são calibradas por capacidade, baseline e dificuldade viável; não presumir indicadores nacionais idênticos.
- **Sem belicismo obrigatório:** nenhum país precisa declarar guerra, conquistar território ou destruir forças inimigas para atingir a pontuação máxima possível deste componente.
- **Evidências e antiabuso:** aferir evolução observável ao longo dos turnos, evitar pontuação por pico temporário no encerramento e vedar ganho duplicado mediante mudança oportunista de agenda; registrar cálculos, fontes e versão da regra.
- **Pendências a especificar:** objetivos concretos dos oito países, indicadores e faixas de progresso, agendas disponíveis, política de troca e atribuição de agenda a país ainda sem jogador (Decisão 16), alinhamento com 40 turnos e modelo temporal histórico.
- Os demais pesos da vitória multicritério **não** são alterados.
- **Referência de aprovação:** [issue #6](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/6).

## Decisão 19 — Aceleração estratégica do tempo (APROVADA)
**Data:** 09/11/2026.

**Escolha do responsável:** opção **C — cada turno de governo/economia com duração de 12 horas reais representa 7 dias (uma semana) no calendário fictício da campanha**.

- **Campanha inicial:** 40 turnos × 7 dias fictícios = **280 dias ou 40 semanas fictícias**, durante **20 dias reais**, conforme a Decisão 17. Os dois calendários não podem ser confundidos.
- **Resolução militar:** a cada **30 minutos reais**, correspondendo a **7 horas fictícias**. Cada período militar é uma janela estratégica/operacional agregada; o motor não deve tratá-la como evento tático instantâneo, nem permitir movimentos/ataques incompatíveis com esse intervalo.
- **Relógio canônico:** tempo real controla disparo do processamento; tempo ficcional determina duração e efeitos de obras, produção, investigação, mobilização, treinamento, demografia, logística e operações. O mapa temporal real-ficcional é versionado e fixo por campanha.
- **Diplomacia contínua:** propostas e tratados podem ser formalizados a qualquer momento real, com entrada em vigor explícita e sem efeitos retroativos; aplica-se a mesma precedência temporal às resoluções militares/econômicas.
- **Interface:** apresentar data fictícia e horário real do próximo fechamento, com escala temporal informada ao jogador.
- **Realismo:** escala acelerada não autoriza conclusão instantânea de obras de anos, evolução demográfica exagerada ou produção sem recursos. O ritmo de progresso e os marcos dos projetos serão detalhados separadamente.
- **Pendências:** fixar calendário exato de abertura/encerramento, parâmetros de deslocamento, taxas proporcionais, durações de investimento e tratamento de projetos inacabados ao final da campanha.
- **Referência de aprovação:** [issue #7](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/7).

## Decisão 20 — Desenvolvimento por etapas e capacidade produtiva (APROVADA)
**Data:** 09/11/2026.

**Escolha do responsável:** opção **C — projetos com etapas auditáveis e resultados parciais apenas quando funcionalmente justificados**.

- **Etapas:** projetos podem percorrer preparação, execução, comissionamento e operação, conforme a categoria; cada etapa tem pré-requisitos, custos, insumos, mão de obra agregada, capacidade, riscos e duração em semanas fictícias.
- **Prazos coerentes:** aplicar Decisão 19 (7 dias fictícios por turno de governo de 12 horas reais). Obras de vários anos não são artificialmente concluídas dentro dos 40 turnos; projetos menores podem caber na campanha.
- **Benefícios parciais reais:** etapas ou trechos que já funcionem podem produzir efeitos proporcionais, como segmentos logísticos operacionais, capacidade industrial instalada ou pessoal efetivamente treinado. Etapas inacabadas ou preparatórias não entregam capacidade plena.
- **Restrições:** falta de recursos financeiros, insumos, energia, trabalhadores, capacidade logística e infraestrutura provoca atrasos/pausas. Desgaste, dano, reparação e manutenção têm custos verificáveis; nenhum recurso é gerado gratuitamente.
- **Pontuação:** reconhecer benefícios efetivamente realizados, sem premiar apenas iniciação de projetos nem duplicar resultados por etapas.
- **População e mercado de trabalho:** simulação agregada, sem operários individuais. A interface mobile mostra etapa, gargalos, prazos, custos, riscos e efeitos realizados.
- **A definir:** catálogo e parâmetros, limites de projetos simultâneos, progressão, cancelamento, balanceamento e, especialmente, **tratamento de projetos inacabados no fim da temporada** (Decisão 21). Não assumir reinício ou continuidade sem decisão.
- **Referência de aprovação:** [issue #8](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/8).

## Decisão 21 — Campanhas independentes com histórico arquivado (APROVADA)
**Data:** 10/11/2026.

**Escolha do responsável:** opção **A — cada temporada é uma campanha independente, com reinício competitivo a partir de cenário inicial versionado**.

- **Encerramento imutável:** após o turno 40/20º dia real (Decisão 17), apurar vencedor, congelar pontuação e registrar snapshot final, histórico de eventos, tratados, soberania, operações militares, dados econômicos e projetos, inclusive os incompletos.
- **Arquivo histórico consultável:** a campanha encerrada permanece disponível para consulta, com identidade do cenário, dados e versão de regras; não se mistura com o estado operacional de novas campanhas.
- **Nova campanha:** inicia no estado de cenário previamente versionado, sem herdar automaticamente riqueza, tropas, dívidas, obrigações, ocupações, projetos, pesquisas ou qualquer benefício material de campanhas anteriores. Os participantes podem escolher país disponível novamente.
- **Obras e pesquisas não concluídas:** permanecem no arquivo histórico, mas não evoluem nem consomem recursos após o encerramento; benefícios parciais apenas das etapas já operacionais durante a temporada encerrada (Decisão 20).
- **Equidade:** não criar vantagens competitivas a jogadores veteranos por conquistas anteriores; possíveis honrarias históricas não alteram economia e forças de uma nova campanha.
- **Transações e auditoria:** nenhuma resolução atrasada pode reabrir a pontuação já apurada; operações de arquivo e geração de campanha devem ser versionadas e não duplicar recursos nem saldos.
- **Consequência de design:** grandes projetos sem etapa operacional dentro de 40 semanas fictícias não pontuam nem geram efeito econômico na campanha; exibir prazo e retorno efetivo previsto para evitar escolhas enganosas.
- **Pendências técnicas:** esquema de snapshot/retention, regra operacional de início de nova temporada, sala de seleção, datas e horários e fórmula de desempate. Nenhum reset ou arquivamento foi implementado.
- **Referência de aprovação:** [issue #9](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/9).

## Decisão 22 — Base de dados real verificável e história alternativa de 2030 (APROVADA)
**Data:** 10/11/2026.

**Escolha do responsável:** opção **C — condições iniciais fundamentadas em dados reais verificáveis, com diferenças fictícias de 2030 documentadas e auditáveis**.

- **Fontes e rastreabilidade:** cada indicador inicial de país/região precisa de fonte, ano, unidade, conceito, limitações e metodologia de agregação. Estimativas e projeções devem ser rotuladas, e nunca apresentadas como estatísticas oficiais observadas em 2030.
- **História alternativa:** divergências econômicas, políticas, industriais, energéticas e militares do cenário inicial são parâmetros fictícios, com justificativa, causa e impacto registrados no catálogo versionado da campanha.
- **Assimetrias reais:** conservar diferenças estruturais entre países em população, área, produção, recursos, infraestrutura, acesso logístico, capacidade fiscal, indústria e defesa. Justiça na pontuação decorre da normalização de condições de partida e objetivos da Decisão 17, não da equalização artificial de riquezas e forças.
- **Agregação regional:** distribuir capacidade econômica, estoques, infraestrutura, população e outros dados entre as regiões estratégicas preservando totais nacionais e sem dupla contagem; a quantidade de polígonos não gera recursos adicionais.
- **Demografia:** para o Brasil, utilizar fontes do IBGE; para demais países, fontes oficiais nacionais e séries harmonizadas quando disponíveis, documentando cobertura e metodologia. Modelar coortes populacionais agregadas, não pessoas individuais; dados municipais detalhados dependerão da fonte de cada país.
- **Forças e prontidão:** quando informação pública não for suficiente, valores fictícios de design são permitidos se explicitamente identificados, rastreáveis e coerentes; não alegar acesso a dados militares secretos.
- **Congelamento por campanha:** snapshot inicial com versão de cenário e fontes, sem mutações silenciosas durante a temporada. Atualizações entram apenas em futuras campanhas independentes (Decisão 21).
- **Transparência:** disponibilizar ao jogador um resumo dos dados iniciais e da hipótese alternativa de 2030, sem expor informações privadas de adversários.
- **Pendências:** fontes efetivas, catálogo de variáveis, números iniciais, projeções, fórmulas de economia/defesa e teste de balanceamento. Esta decisão **não aprova valores numéricos específicos nem implementação**.
- **Referência da aprovação:** [issue #10](https://github.com/dominioglobalbrasil/dominio-global-brasil/issues/10).

## Decisões anteriores preservadas
- **ESTATUM** é o nome oficial do jogo.
- Primeira campanha **Crise Sul-Americana — 2030**, países reais e história alternativa.
- Começar pequeno, máxima qualidade, sistemas expansíveis, com foco inicial no celular.
- Guerra moderna complexa, incluindo drones, inteligência, logística, guerra eletrônica, defesa antidrone, indústria e política; apresentação gráfica pragmática.
- Interface atual da Vercel é uma **demonstração visual**; não é motor multiplayer.

**Não fazer deploy só para atualizar documentos de planejamento.**
