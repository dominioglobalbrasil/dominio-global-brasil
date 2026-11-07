# ESTATUM — Proposta de mapa e divisão territorial v0.1

**Status: EM DISCUSSÃO — NÃO APROVADA.**
**Data:** 07/11/2026.
**Campanha:** Crise Sul-Americana — 2030, países reais e eventos ficcionais.

## 1. Princípios
- O mapa ocupa a maior parte da tela em dispositivos móveis.
- Geografia real como base, com fronteiras e nomes fiéis; parâmetros militares/econômicos são ficcionais e balanceados.
- O usuário governa um país, mas disputa controle e logística em escalas menores.
- Qualidade de simulação não exige centenas de territórios ou cidades para estrear; mecanismos e IDs são expansíveis.
- Sequer uma grande região inteira é tomada após uma única vitória tática: o controle depende de posições, guarnição, rotas e consolidação.
- Paisagem e escala importam: selva, montanhas, costa, rios e gargalos condicionam mobilidade, combate e logística.

## 2. Três alternativas ao responsável

### A — Divisões administrativas completas
Estados, departamentos e províncias reais como territórios jogáveis.
**Benefício:** detalhe político-geográfico e reconhecimento imediato.
**Problema:** centenas de polígonos, mais ruído no mapa do celular e muito conteúdo para 6–8 jogadores.

### B — Regiões estratégicas simples
Aproximadamente 40–50 macrorregiões; cada região é unidade única de economia, guerra e controle.
**Benefício:** implementação e compreensão rápidas.
**Problema:** guerras pouco realistas: fronteiras e cidades importantes podem ficar excessivamente agregadas.

### C — Mapa hierárquico, conteúdo inicial pequeno (RECOMENDADO)
**País → região estratégica → pontos estratégicos e setores operacionais**.

- **País:** política, tratados, orçamento nacional e leis.
- **Região estratégica:** produção, infraestrutura, população agregada, estoques, administração e ocupação.
- **Pontos estratégicos:** cidades, capitais, portos, aeroportos, bases, depósitos e infraestruturas essenciais, representados no mapa sem virar governos independentes.
- **Setores de operações/frentes:** subáreas e corredores para posicionar formações, informar observação por drones, risco, acesso, disputas e controle parcial; modelados como grafo de adjacências/corredores e áreas operacionais, não necessariamente como novos estados/municípios.
- **Rotas logísticas:** ligações reais ou plausíveis entre pontos estratégicos e setores, com capacidade por ciclo, custo, condições e direito de passagem.
- **Conquista:** tomar um ponto não dá controle total e automático da macrorregião; controle regional exige condições configuráveis de presença, acesso e estabilidade.

Uma região pode conter muitos pontos visuais e objetos logísticos sem aumentar a quantidade de divisões políticas administradas pelo jogador.

## 3. Primeiro recorte de conteúdo — 42 regiões estratégicas (proposta)

| País jogável proposto | Quantidade | Macrorregiões ilustrativas — fronteiras exatas a construir |
|---|---:|---|
| Brasil | 6 | Amazônia Ocidental; Amazônia Oriental; Nordeste; Centro-Oeste; Sudeste; Sul |
| Argentina | 6 | Noroeste; Nordeste/Litoral; Cuyo; Centro/Pampas; Buenos Aires; Patagônia |
| Chile | 5 | Norte Grande; Atacama; Vale Central; Centro-Sul; Patagônia/Austral |
| Bolívia | 5 | Altiplano; Vales Centrais; Oriente/Santa Cruz; Amazônia; Chaco |
| Paraguai | 5 | Chaco Norte; Chaco Sul; Norte Oriental; Assunção/Centro; Alto Paraná/Sul |
| Uruguai | 4 | Montevidéu/Metropolitana; Litoral; Centro-Norte; Leste |
| Peru | 6 | Costa Norte; Lima/Costa Central; Costa Sul; Serra Norte/Centro; Serra Sul; Amazônia |
| Equador | 5 | Serra Norte/Quito; Serra Sul; Costa Norte; Guayas/Costa Sul; Amazônia |
| **TOTAL** | **42** | Proposta de conteúdo, **não limite estrutural** |

A quantidade por país **não** equivale à força, à riqueza, à dificuldade ou à chance de vitória. Territórios têm áreas, infraestrutura e importância variáveis.

## 4. Mapa visual e fluidez no celular
- **Zoom afastado:** países, fronteiras, relações diplomáticas e grandes frentes.
- **Zoom intermediário:** macrorregiões, economia, alertas, corredores e agrupamentos.
- **Zoom próximo:** pontos estratégicos, infraestrutura, linhas de suprimento, setores de frente e formações agregadas.
- **Toque em região:** abre uma ficha destacável com produção, estabilidade, forças, logística e ações. Não trocar de página só para ver um setor.
- **Mapas temáticos:** político, econômico, inteligência, drones, logística e defesa; somente os indicadores relevantes em cada camada.
- **Inteligência:** posição inimiga é aproximada/oculta quando necessário; mesmo mapa-base, dados filtrados por jogador.
- **Performance:** reduzir/agrupamento de ícones conforme zoom, geometrias vetoriais simplificadas e carregamento sob demanda.

## 5. Fontes técnicas sugeridas
- **Natural Earth ADM0/ADM1:** países e estados/províncias para gerar mapas regionais próprios. Versões fixadas e validação da geometria.
  https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/
- **geoBoundaries:** divisões administrativas nacionais/subnacionais com metadados de licença e ano; revisar licenciamento de cada camada.
  https://www.geoboundaries.org/
- As macrorregiões são agregações de divisões administrativas reais; ajustes geográficos devem ser verificados em mapa interativo, sem inventar fronteiras oficiais.
- Infraestrutura e recursos do cenário alternativo têm dados ficcionais separados da cartografia original.

## 6. Integração com o tempo híbrido aprovado
- Nível **país/região:** orçamento, produção, obras, política e consumo agregado processados a cada 12h.
- Nível **setor/rota/formação:** movimento, reconhecimento, estados de prontidão e conflitos em ciclos militares mais curtos.
- A periodicidade militar ainda será aprovada; **30 minutos é recomendação, não decisão**.
- Estoques, recursos e ordens persistentes são integrados de forma determinística e sem duplicação; consumo operacional pode ser contabilizado por microciclo e consolidado no ciclo econômico.
- Tratados, cessar-fogos e direitos de passagem têm vigência temporal explícita, bloqueando ordens incompatíveis.

## 7. Teste de recorte (antes da expansão)
Prova de conceito isolada numa faixa de fronteira **fictícia**, com duas nações, 2–3 regiões envolvidas, 4–6 pontos estratégicos e algumas rotas. Comprovar:
- Uma força pode ocupar uma posição sem tomar toda a macrorregião.
- Cortar o abastecimento afeta sustentação da posição nos ciclos seguintes.
- Drones alteram o conhecimento dos setores sem entregar visão total do adversário.
- Uma única seleção no mapa é operável com o dedo, sem precisar clicar em polígonos minúsculos.
- A geometria e os pontos são dirigidos por dados; ampliar para 42 regiões não altera a lógica de jogo.

## 8. Perguntas de aprovação
**Decisão 02:** optar por A (divisões administrativas), B (macrorregiões simples) ou C (hierarquia com macrorregiões + setores de frente + pontos estratégicos).
Se C for escolhida: validar se as **42 regiões estratégicas propostas** são escala inicial aceitável e, depois, aprovar os limites dos setores operacionais.
**Nenhum deploy nem implementação autorizado por este rascunho.**
