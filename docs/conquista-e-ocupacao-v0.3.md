# ESTATUM — Mecânicas de conquista, ocupação e capitulação · v0.3

**Data:** 07/11/2026.
**Campanha de referência:** Crise Sul-Americana — 2030 (países reais, história alternativa).
**Decisão 03 APROVADA:** sistema misto de soberania. Conquistas militares podem gerar ocupação parcial e controle administrativo, mas anexação definitiva depende de tratado de paz, capitulação ou processo político explicitamente previsto.
**Status:** arquitetura de regras proposta para validação. Não confundir mecanismos sugeridos, pesos e números com decisões aprovadas.
**Produto:** jogo de estratégia para poucos jogadores, complexo nas consequências e simples de operar no celular.

## 1. A experiência de conquistar um território

O jogador não precisa pintar um mapa inteiro de outra cor. O objetivo é ocupar posições que realmente importam, sustentar linhas logísticas e construir condições políticas para impor ou negociar resultados.

Uma campanha pode terminar em paz, cessar-fogo, recuo estratégico, ocupação parcial, território desmilitarizado, reparação de guerra ou transferência de soberania, sem que toda guerra vire anexação.

**Separação obrigatória dos estados:**

| Estado | O que significa | Quem pode alterar |
|---|---|---|
| Soberania (`sovereignCountryId`) | Titularidade jurídica de região ou ponto reconhecida pelas regras do cenário | Ato político/jurídico formal validado |
| Controle militar (`militaryControllerId`) | Quem domina materialmente o setor/ponto no microciclo | Motor militar |
| Controle administrativo (`adminControllerId` / `adminControlLevel`) | Quem consegue operar serviços, arrecadar parcialmente e manter infraestrutura | Motor político-econômico em ciclo de 12h |
| Estado de ocupação (`occupationStatus`) | Não ocupada, contestada, provisória, sustentada, consolidada | Estado derivado de eventos militares, logísticos e políticos |
| Estabilidade local (`localStability`) | Capacidade de manter a área funcional sob guerra/ocupação | Motor político-econômico |
| Conhecimento (`intelVisibility`) | O quanto um governo sabe sobre posição, forças e controle dos setores | Filtro de inteligência por país |

Não usar `region.owner` como campo único que confunde todos os conceitos. Uma região pode ser soberanamente de um país, militarmente disputada e administrativamente dividida.

## 2. Máquina de estados da conquista — proposta

```text
SOBERANIA ORIGINAL
       |
       v
SETOR SOB AMEAÇA / INCURSÃO
       |  combate e controle de ponto
       v
PONTO/SUBSETOR DISPUTADO OU CAPTURADO
       |  manter acesso, ordem, presença e ligação logística
       v
OCUPAÇÃO PROVISÓRIA
       |  sustain + serviços + controle de nós importantes
       v
OCUPAÇÃO SUSTENTADA / CONTROLE PARCIAL
       |  estabilidade + ciclo político-econômico
       v
CONTROLE ADMINISTRATIVO CONSOLIDADO
       |                                        \
       | decisão político-jurídica válida        \ perda de controle, tratado
       v                                          v
MUDANÇA FORMAL DE SOBERANIA                 RETIRADA / RESTITUIÇÃO
```

- Uma formação pode **atravessar** um setor sem ocupar suas cidades, pontos e instituições.
- Capturar uma instalação gera benefício militar ou econômico **relativo à instalação**, não o controle de uma macrorregião.
- Se forças adversárias ainda controlam pontos centrais e rotas, a região continua **contestada**.
- Se o ocupante perde suprimento, a capacidade de operar pontos e manter ocupação **degrada gradualmente**, segundo regras definidas e com avisos, sem reversão aleatória imediata.
- Cada mudança de controle precisa de um evento com causa, instante, versão de regras e atores.
- Não exigir a conquista de cada rua/cidade; utilizar pontos estratégicos e setores que emergem de operações reais do cenário.

## 3. O que sustenta uma ocupação?

**Fatores obrigatórios de modelagem:**
1. Presença de formação e capacidade de manter o controle da área.
2. Linha de suprimentos e trânsito militar válidos, inclusive rotas, estoques e distância agregada.
3. Estado das infraestruturas necessárias ao funcionamento civil e militar.
4. Segurança e previsibilidade dos serviços públicos, sem converter população em simples "barra de submissão".
5. Continuidade temporal da administração e cumprimento de compromissos.
6. Restrições de tratados, cessar-fogo, direito de passagem e acordos de paz.

**Mecânica recomendada:** indicador de `capacidadeDeOcupacao` de 0 a 100 **por região**, calculado a partir da posse de pontos relevantes e das condições acima. NÃO é uma barra de conquista que sobe automaticamente por esperar; pode subir, cair ou estagnar.

**Faixas VISUAIS sugeridas — ainda não aprovadas:** Contestada, Ocupação frágil, Ocupação sustentada, Administração consolidada. Os limites numéricos serão definidos por testes, não por arbitragem política ou uma regra fixa de dias.

**Guarnições:** a mesma formação não pode ao mesmo tempo ocupar, avançar e defender outra frente sem dividir efetivos. O custo de manter posição reduz disponibilidade de força para novas ofensivas.

## 4. Relação com logística, drones e guerra moderna

- O motor de drones e inteligência modifica o **conhecimento do setor** e certos fatores de prontidão/combate, mas não captura um governo sozinho.
- Informação precisa não significa controle territorial: reconhecimento e ocupação são sistemas distintos.
- Indisponibilidade de suprimento/energia/peças/manutenção afeta capacidade de manter a posição ao longo de microciclos.
- Defesa antidrone e guerra eletrônica são índices agregados que protegem ou degradam capacidade operacional; não anexam regiões nem alteram soberania.
- Controle de um entroncamento logístico pode **restringir capacidades de abastecimento por rotas** para ambos os lados. O estado de cada rota é explicitado por eventos.
- Um ataque a infraestrutura gera custos civis e políticos abstratos, e não uma vantagem de pontuação ilimitada. O jogo não premia condutas abusivas contra civis.

## 5. Rendas, estoque e administração de regiões ocupadas

Uma região tem base produtiva e população agregadas, mas os rendimentos são derivados de instalações efetivamente acessíveis, estabilidade, rotas e capacidade administrativa.

**Regras:**
- Receitas e produção **não se duplicam** entre soberano e ocupante. O cálculo parte de uma única produção disponível com eventuais perdas.
- O ocupante somente pode utilizar **parte efetiva** de renda/serviços ou estoques vinculados a instalações sob controle e funcionais. Dinheiro nacional não é capturado por conquistar um único ponto.
- Custos de reparação, manutenção, guarnição, segurança e provisão de serviços podem superar receitas.
- A receita do país soberano pode cair por interrupção das suas atividades e rotas, sem que a diferença apareça como renda mágica para o ocupante.
- Em região contestada, cada parte recebe somente rendimentos que conseguir efetivamente sustentar; no fechamento de 12h os valores são ajustados **uma vez**.
- Os estoques em depósitos são quantitativos localizados. Transferências precisam debitar origem, respeitar capacidade e creditar destino; sem criação de recursos por captura/ciclo.
- Reações políticas, serviços e confiança local podem modificar a capacidade de administrar; evitar mecânicas que incentivem violência contra civis por vantagens de jogo.

## 6. Condições de guerra e legalidade de ordens

- `peace`, `crisis`, `war`, `ceasefire`, `armistice` e `treatyPeace` são estados diplomáticos distintos, com vigência temporal.
- Ordens ofensivas transfronteiriças necessitam da permissão definida pelo estado de guerra e pelo cenário. O motor deve rejeitar ações incompatíveis com cessar-fogo em vigor.
- Direito de passagem militar **não** concede propriedade de terreno ou autorização irrestrita de ocupação.
- Uma vitória em combate não transfere legitimidade política nem gera tratado automaticamente.
- O processo militar guarda a autoridade e a vigência da ordem; mudanças diplomáticas são aplicadas respeitando timestamp de entrada em vigor e o snapshot de cada microciclo.
- Ausência de jogador preserva ordens e postura configuradas; não autoriza invasões arbitrárias.

## 7. Capitulação e fim da guerra — proposta para decisão posterior

**Decisão 03 já assegura três vias formais possíveis de anexação:**
1. **Tratado de paz negociado**: signatários, cláusulas, cronograma de retirada/cessão, eventuais indenizações; só entra em vigor após as aceitações exigidas.
2. **Capitulação formal**: ato político-militar de rendição ou resultado de mecanismo de capitulação que esteja explicitamente aprovado para aquela campanha; os critérios exatos permanecem PENDENTES.
3. **Processo político especial do cenário**: regra conhecida antes da campanha, com condições públicas, prazo, contestação e efeitos rastreáveis.

**Proposta de etapas da capitulação:**
- Desgaste militar/econômico e perda de pontos estratégicos geram **pressão de capitulação**, não rendição instantânea.
- A pressão pode abrir um **ultimato/termos de rendição**, com janela para resposta, mediação, retirada ou contraproposta.
- A capitulação **não é sinônimo de o atacante receber tudo**: resultados têm cláusulas limitadas, custos de ocupação e fronteiras definidas.
- Nenhuma capital isolada gera fim automático da partida. Um governo pode perder uma região e continuar disputando a campanha.
- Estados derrotados podem continuar jogáveis com restrições políticas, obrigações, economia e oportunidade de reconstrução, evitando expulsão imediata de jogador.
- Se o jogador estiver inativo, não aceitar/recusar em seu nome sem regra de abandono previamente publicada.

**Questão para a próxima Decisão 04:** a capitulação será exclusivamente voluntária; imposta automaticamente por critérios objetivos; ou negociada sob pressão com condições especiais de imposição após colapso prolongado? A proposta inicial é a terceira, com salvaguardas contra abusos e vitória automática.

## 8. Integração do ritmo híbrido aprovado

| Evento | Momento | Resultado |
|---|---|---|
| Ordem militar validada | Durante a janela de ordens | Fica pendente, pode ter regras de execução persistente |
| Reconhecimento e manobra | Microciclo militar (frequência exata PENDENTE) | Conhecimento, movimento e contato atualizados |
| Combate e controle de pontos | Microciclo militar | Mudanças territoriais de controle militar registradas |
| Custo militar variável | Microciclo, consolidado sem duplicações | Consumo de estoques e obrigações do setor |
| Ocupação administrativa | Fechamento governamental a cada 12h | Progresso/retrocesso de administração, serviços, produção, renda |
| Proposta/negociação de paz | Continuamente | Mensagens, cláusulas e aceitações disponíveis |
| Ratificação / entrada em vigor | Segundo vigência explícita do tratado ou capitulação | Mudança formal de soberania somente nos objetos previstos |
| Noticiário/relatórios | Após eventos/fechamentos | Dados públicos e privados filtrados para cada país |

Um microciclo não pode aplicar antecipadamente renda de um turno que ainda não ocorreu. Um fechamento econômico não pode copiar resultados militares duas vezes. Se uma transação falhar, o processamento deve ser retomável e idempotente.

## 9. Exemplo fictício: disputa por um corredor de fronteira

**Objetivo:** demonstrar que o controle é gradual e reversível, usando uma área abstrata, sem prescrever táticas reais.
- País A ordena avanço para um setor de fronteira do país B. O sistema confirma permissões diplomáticas, rota, mobilidade e custo.
- O contato militar é resolvido no microciclo. A consegue controlar um ponto logístico, mas as demais áreas da região seguem sob B.
- O relatório de A indica que o ponto está ocupado, mas que a sustentação depende de suprimentos e presença de formação.
- Um ciclo depois, o país B conserva a administração de outros pontos e propõe cessar-fogo.
- A aceita um acordo que suspende operações e prevê retirada de um setor com compensação econômica. **Nenhuma soberania muda**, pois o tratado não contém cessão.
- Em outro teste, uma capitulação formal pode conter cessão de um ponto ou região; somente após a entrada em vigor ocorre evento de `sovereigntyTransferred` com cláusula validada.
- Nenhum passo concede controle total por captura de um ponto ou movimenta um estoque inexistente.

## 10. Informações e interface no celular

Ao tocar um **setor ou ponto**, abrir ficha curta e contextual, nunca uma tela lotada:

- **Soberania:** bandeira e país formal.
- **Controle militar:** controlador confirmado ou estimado conforme inteligência.
- **Estado:** seguro, contestado, ocupado provisoriamente, sustentado ou consolidado.
- **Acessos:** suprimento, rotas e estado de infraestrutura conhecido.
- **Consequências:** uso de instalações, custos e perspectivas de manutenção.
- **Ações úteis:** visualizar forças, emitir ordem, consultar logística, abrir proposta de paz.

**Destaques visuais por zoom:**
- Distante: fronteiras nacionais, regiões ocupadas/contestadas, frentes.
- Médio: regiões e corredores, pontos relevantes e alertas.
- Próximo: pontos, setores ativados, formações e informação incompleta.
- Usar contorno, sobreposição e padrões de disputas; não substituir fronteiras legais por uma cor única que cause confusão sobre soberania.
- Identificar quando um dado é **estimado**, **desatualizado** ou **secreto**, sem transmitir informação sigilosa do servidor.

## 11. Estrutura sugerida para implementação (não iniciada)

**Entidades:** `campaign`, `country`, `region`, `strategic_point`, `operational_sector`, `supply_route`, `formation`, `military_order`, `treaty`, `territorial_control_event`, `occupation_record`, `surrender_proposal`, `sovereignty_transfer`.

**Eventos:** `sectorContested`, `positionCaptured`, `routeAccessChanged`, `occupationStarted`, `occupationWeakened`, `adminControlUpdated`, `ceasefireEffective`, `treatyRatified`, `surrenderRatified`, `sovereigntyTransferred`, `territoryRestored`.

**Mecanismo transacional:** todos os eventos têm `campaignId`, `tickId`, `eventId`, `cause`, `ruleVersion`, `recordedAt` e atores com permissão. `sovereigntyTransferred` exige `legalBasis` validado e evidência de vigência.

**Regra defensiva:** eventos de ocupação jamais alteram `sovereignCountryId` diretamente. Uma única função autorizada de resolução jurídico-política aplica transferências específicas ao catálogo territorial.

## 12. Testes obrigatórios antes de dizer "conquista funcional"

1. Uma posição capturada não altera soberania nem transfere toda a renda regional.
2. Uma região com pontos controlados por países diferentes aparece contestada e calcula renda sem duplicar.
3. Uma formação isolada sofre desgaste de ocupação e não aumenta controle por mera espera.
4. Ocupação pode retroceder com perda de logística ou de posições, com explicação e sem saltos arbitrários.
5. Cessar-fogo válido bloqueia ordens ofensivas posteriores; ordens de períodos anteriores seguem política de encerramento pré-definida.
6. Tratado de paz sem cláusula territorial nunca muda soberania.
7. Tratado ratificado com cessão de ponto/região transfere **somente os objetos explicitamente definidos**.
8. Capitulação não é ativada pela simples perda da capital; condições futuras são configuradas por campanha e aprovadas antecipadamente.
9. País derrotado não perde automaticamente seu jogador; sua continuidade depende de regras explícitas.
10. Retornar a processar um microciclo não duplica perdas, ocupações, estoque ou pontuação.
11. O jogador não vê as ordens, posições ou reservas secretas adversárias pela API.
12. A visualização de controle parcial é legível por toque em celular pequeno.
13. O mesmo mecanismo funciona num cenário com 2 países e, depois, 8/42 regiões usando somente dados adicionais.
14. Nenhum tipo de evento de natureza militar escreve `sovereignCountryId` sem `legalBasis`.

## 13. Decisões pendentes após esta etapa

- **04 — Capitulação:** **opção C aprovada** em 07/11/2026: capitulação por pressão, com direito de resistência, negociação e continuidade do jogador. Gatilhos numéricos, prazos e limites de cláusulas ainda pendentes. Ver [detalhamento da Decisão 04 v0.4](capitulacao-e-continuidade-v0.4.md).
- **05 — Tempo militar:** intervalo dos microciclos (30 minutos como hipótese, não decisão).
- **06 — Ocupação:** fórmula de controle administrativo, número de microciclos para consolidar, custos e elasticidade de resistência.
- Pontos estratégicos e geometria real de cada macrorregião, inclusive ilhas e capitais especiais.
- Escala inicial dos equipamentos, tipos de formação e unidades não tripuladas.

**Restrição:** não implementar backend, bancos, processamento de capitulação nem publicar site com estas regras até aprovação das condições relevantes e dos testes. Documentos não são motor executável.
