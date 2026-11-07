# ESTATUM — Diretriz de jogo: guerra moderna e sistemas não tripulados v0.1

**Decisão de produto (07/11/2026):** o nome do jogo é ESTATUM. A campanha inicial mantém o nome **Crise Sul-Americana — 2030**.
**Diretriz aprovada:** a guerra moderna, fortemente transformada pelos sistemas não tripulados durante o conflito na Ucrânia, será um diferencial estruturante da simulação, não apenas uma unidade militar adicional.
**Status:** concepção de mecânicas. Valores e fórmulas dependem de testes e aprovação. Sem alterações na base de dados ou deploy nesta etapa.
**Princípio:** poucos jogadores, qualidade máxima, jogabilidade mobile, mecânicas expansíveis.

## 1. Identidade do ESTATUM
ESTATUM é um jogo de estratégia geopolítica, política, diplomacia e **guerra moderna**. O jogador governa um Estado com economia e instituições, mas a disputa militar inclui drones, observação, defesa antidrone, guerra eletrônica, capacidade industrial e adaptação tecnológica.

Linha de comunicação provisória: **ESTATUM — Governe. Negocie. Sobreviva à guerra moderna.**
Não reduzir o game a um "jogo de drones": o objetivo é uma simulação estratégica de Estados na qual sistemas não tripulados alteram o equilíbrio entre infantaria, blindados, artilharia, aviação, logística e política.

## 2. Inspiração histórica — com ressalvas
O conflito russo-ucraniano não inventou drones ou guerra eletrônica, mas acelerou seu emprego em larga escala, a competição entre observação e ocultação, a produção de sistemas consumíveis, a integração com forças convencionais e a adaptação contínua de defesas.

Fontes públicas para inspiração de ALTO NÍVEL:
- CSIS, *Lessons from the Ukraine Conflict: Modern Warfare in the Age of Autonomy, Information, and Resilience* (2025): https://www.csis.org/analysis/lessons-ukraine-conflict-modern-warfare-age-autonomy-information-and-resilience
- IISS, *The Uninhabited War in Ukraine* (2026): https://www.iiss.org/publications/strategic-dossiers/2026/uavs-isr-deterrence-and-war/the-uninhabited-war-in-ukraine
- HCSS, *Lessons That Transfer* (2026): https://hcss.nl/report/lessons-that-transfer-observations-from-the-russo-ukraine-war-for-european-land-forces/
- King's College London, *The Russo-Ukraine War: Preliminary Observations for Land Warfare* (2026): https://doi.org/10.1080/13518046.2026.2666976

Essas referências servem para inspiração e equilíbrio de sistemas de jogo, sem reproduzir instruções operacionais, vulnerabilidades técnicas específicas ou táticas reais acionáveis.

## 3. Seis sistemas militares estruturantes
### 3.1 Consciência situacional (a guerra da informação)
Drones de observação, inteligência terrestre e aliados alimentam um indicador de **conhecimento de cada setor**. O jogador vê estados "confirmado", "provável", "desatualizado" ou "desconhecido" em vez de tropas inimigas sempre visíveis.
A quantidade de recursos de reconhecimento não equivale a certeza. Há custo contínuo, desgaste e risco de informação errada.
A interface mostra o que o comandante *sabe*, não o que o motor sabe.

### 3.2 Sistemas não tripulados e defesa antidrone
Categorias abstratas para a estreia: **reconhecimento**, **ataque**, **proteção/interceptação** e **apoio não tripulado** (este último pode ficar para expansão).
Os drones de ataque são munições/ativos consumíveis, com perdas e fabricação próprias. Não são bônus universal de dano.
Defesa antidrone é uma capacidade regional com manutenção, custos e resultados probabilísticos equilibrados; seu efeito depende de preparo e investimento.
O motor representa efeitos agregados no setor, não alvos reais, rotas exatas ou procedimentos técnicos.

### 3.3 Guerra eletrônica e comunicações
Uma camada separada de **resiliência de comunicações** altera qualidade de relatórios, oportunidade de decisões, disponibilidade de reconhecimento e efetividade de recursos não tripulados.
Investimentos defensivos têm custos e compensações; nenhuma tecnologia deve anular permanentemente a adversária.
O motor usa índices agregados, sem modelar frequências, equipamentos comerciais reais ou orientações de interferência.

### 3.4 Logística e indústria de defesa
Drones exigem produção, reposição, treinamento, manutenção e suprimento. Equipamentos convencionais também.
A indústria fica dividida, em nível de jogo, entre capacidade civil, convencional e não tripulada, com custos políticos e econômicos.
Maior consumo em guerra cria dilema estratégico: investir na indústria, adquirir externamente via tratados ou preservar reservas.
Rotas logísticas, capacidade produtiva e prazo de reposição continuam relevantes.

### 3.5 Adaptação doutrinária e pesquisa
Projetos de pesquisa avançam por ciclos, produzindo **versões** de equipamentos e procedimentos de jogo; contramedidas inimigas podem reduzir vantagens antigas.
A inovação é um processo com orçamento, atraso e incerteza, não um "upgrade +50%".
Tecnologia superior sem organização, operadores treinados, suprimento e integração com unidades tradicionais pode ter baixo impacto.

### 3.6 Guerra combinada, desgaste e consequências políticas
Drones alteram o valor de blindados, infantaria, artilharia e defesas, mas não os tornam obsoletos.
O resultado militar considera organização, moral, terreno, proteção, suprimento, inteligência, resiliência de comunicações, tecnologia, prontidão e comando.
Conflitos desgastam finanças, opinião pública, legitimidade e relações internacionais; operações caras e custosas podem gerar derrotas políticas mesmo com ganhos territoriais.

## 4. Como isso vira jogabilidade no celular
Tela **Defesa** terá cinco painéis internos separados:
1. **Situação** — frentes, nível de conhecimento, risco e prontidão.
2. **Forças** — unidades convencionais e grupos não tripulados, em leitura simples.
3. **Drones** — produção, estoques, disponibilidade e prioridades do programa.
4. **Comunicações** — resiliência, guerra eletrônica e defesa antidrone em indicadores abstratos.
5. **Ordens** — missões por região e objetivos estratégicos, com custo, risco e prazo; sem microcontrole do voo de cada drone.

Um overlay do mapa indicará conhecimento e riscos de exposição por setor em níveis. Um relatório explicará **por que uma ação funcionou ou fracassou**, sem revelar informação secreta.

## 5. Primeiro protótipo militar — deliberadamente pequeno
- Países: Brasil e Paraguai, somente em cenário de teste isolado, sem guerra obrigatória na campanha oficial.
- Três setores fictícios, duas formações convencionais por lado, dois tipos de drones (observação e ataque) e proteção antidrone agregada.
- Objetivos de teste: observar um setor; deslocar uma formação; destinar recursos para proteção, produção ou reconhecimento; resolver um turno; receber relatório privado.
- Comparar estados de jogo com diferenças em conhecimento, proteção, capacidade industrial e suprimentos.
- O teste deve demonstrar decisões significativas e resultados reproduzíveis, **sem simular procedimentos operacionais de armamentos reais**.

## 6. Critérios de aceite
- Informação imperfeita importa: decisões com reconhecimento ruim apresentam incerteza mensurável.
- Drones influenciam o combate sem serem invencíveis nem tornarem forças convencionais inúteis.
- Defesa antidrone e resiliência de comunicações trazem benefícios com custo e limites claros.
- Produção, operadores e logística limitam o emprego sustentado de sistemas não tripulados.
- O equilíbrio não depende de um nome de país: trocar catálogo de nações mantém o motor genérico.
- O número de drones ou tropas não é a única variável determinante.
- Ações são transacionais, idempotentes e testadas; nenhum jogador vê ordens sigilosas do outro por API.
- O fluxo completo é utilizável no celular e pode ser expandido para novos países, equipamentos e campanhas sem reescrever o motor.

## 7. Prioridade imediata
1. Aprovar a nova identidade **ESTATUM** e o aspecto visual do mapa.
2. Desenhar no Figma a jornada mobile de governo e defesa moderna, com fluxo de drones, conhecimento e ordens.
3. Aprovar a maquete e os estados de ação; então especificar fórmulas e construir a simulação offline.
4. Implementar e testar antes de ligar a Supabase/Vercel; concentrar mudanças e evitar deploys desnecessários.

**Nota de escopo:** o site publicado ainda usa a identidade antiga; atualizar o branding e a interface em um pacote único depois da aprovação visual.
