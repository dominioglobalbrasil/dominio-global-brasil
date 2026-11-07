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

## Decisões anteriores preservadas
- **ESTATUM** é o nome oficial do jogo.
- Primeira campanha **Crise Sul-Americana — 2030**, países reais e história alternativa.
- Começar pequeno, máxima qualidade, sistemas expansíveis, com foco inicial no celular.
- Guerra moderna complexa, incluindo drones, inteligência, logística, guerra eletrônica, defesa antidrone, indústria e política; apresentação gráfica pragmática.
- Interface atual da Vercel é uma **demonstração visual**; não é motor multiplayer.

**Não fazer deploy só para atualizar documentos de planejamento.**
