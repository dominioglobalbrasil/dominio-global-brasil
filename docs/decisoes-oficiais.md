# ESTATUM — Registro de decisões oficiais

Registro das escolhas **aprovadas pelo responsável pelo projeto**. Prevalece sobre valores antigos apresentados apenas como proposta nos documentos v0.1. Não altera automaticamente a aplicação hospedada.

## Decisão 01 — Ritmo híbrido do jogo (APROVADA)
**Data:** 07/11/2026.

**Escolha do responsável:** Opção C, sistema híbrido.

- **Política e economia:** ciclos nacionais de **12 horas**, com fechamento, resolução e relatório em horários definidos por campanha.
- **Diplomacia:** conversas, propostas, contrapropostas e acordos podem ocorrer continuamente; obrigações/efeitos com impacto no estado serão aplicados com regras e horário explícitos, evitando paradoxos em turnos.
- **Operações militares:** processamento em ciclos **mais curtos que os governamentais**, com evolução entre os fechamentos econômicos, sem exigir que o jogador fique conectado continuamente.
- **Periodicidade militar EXATA:** **NÃO DEFINIDA**; 30 minutos é o exemplo/recomendação inicial apresentado, sujeito a validação de carga, jogabilidade e disponibilidade de jogadores.
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

## Decisões anteriores preservadas
- **ESTATUM** é o nome oficial do jogo.
- Primeira campanha **Crise Sul-Americana — 2030**, países reais e história alternativa.
- Começar pequeno, máxima qualidade, sistemas expansíveis, com foco inicial no celular.
- Guerra moderna complexa, incluindo drones, inteligência, logística, guerra eletrônica, defesa antidrone, indústria e política; apresentação gráfica pragmática.
- Interface atual da Vercel é uma **demonstração visual**; não é motor multiplayer.

**Não fazer deploy só para atualizar documentos de planejamento.**
