# ESTATUM — Territórios, mapa e regras de conquista v0.2

**Campanha:** Crise Sul-Americana — 2030 (países reais; história alternativa).
**Decisão oficial nº 02:** opção C, **mapa hierárquico**; escala inicial **42 regiões estratégicas / 8 países propostos**.
**Estado deste arquivo:** detalhamento técnico de design **proposto**. A *estrutura hierárquica* e o *alvo de 42 regiões* estão aprovados; os nomes, agregações, pontos e números de controle precisam de validação cartográfica/balanceamento. Nenhum motor implementado.

## 1. Hierarquia que o jogador realmente controla

```text
CAMPANHA
└─ País soberano (governo, tratados, política, economia)
   └─ Região estratégica (produção, população agregada, infraestrutura, ocupação)
      ├─ Pontos estratégicos (cidade, capital, porto, base, depósito, entroncamento)
      ├─ Setores operacionais (zonas de frente/contato, criadas onde há disputa)
      └─ Rotas / corredores (capacidade, passagem, suprimento, deslocamento)
```

- **Países (8 jogáveis inicialmente):** controles político e diplomático nacionais, integridade territorial e metas.
- **Regiões (42 para o início):** agregações de unidades administrativas reais (ADM1), com ID estável `BR-01`, etc. NÃO precisam ter tamanho ou poder semelhantes.
- **Pontos:** nós de interesse e infraestrutura no mapa; a conquista de um ponto não altera automaticamente a região toda.
- **Setores:** criados ou ativados para operações, frentes e disputas; não obrigamos o jogador a comandar todos os pixels do território.
- **Rotas:** grafo com ligações terrestres, marítimas ou aéreas abstratas; controle, condição, capacidade e tratados importam.
- **Terrenos reais:** floresta, deserto, serra, áreas urbanas, cursos d'água e litoral afetam fatores militares do jogo.
- **Geografia real, atributos de jogo ficcionais:** não usar números demográficos, industriais ou militares reais sem revisão; cenários não são previsões políticas.

## 2. Proposta de 42 macrorregiões

Agregações **sugeridas** de estados, províncias, regiões e departamentos reais. Essas agregações devem ser confrontadas com polígonos oficiais ADM1 antes da implementação; a nomenclatura administrativa varia por país.

### Brasil — 6 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `BR-01` | Amazônia Ocidental | Acre, Amazonas, Rondônia, Roraima | Manaus, Porto Velho, Rio Branco |
| `BR-02` | Amazônia Oriental | Amapá, Pará, Tocantins | Belém, Macapá, Palmas |
| `BR-03` | Nordeste | Maranhão, Piauí, Ceará, Rio Grande do Norte, Paraíba, Pernambuco, Alagoas, Sergipe, Bahia | Salvador, Recife, Fortaleza |
| `BR-04` | Centro-Oeste | Distrito Federal, Goiás, Mato Grosso, Mato Grosso do Sul | Brasília, Goiânia, Campo Grande |
| `BR-05` | Sudeste | Minas Gerais, Espírito Santo, Rio de Janeiro, São Paulo | São Paulo, Rio de Janeiro, Belo Horizonte |
| `BR-06` | Sul | Paraná, Santa Catarina, Rio Grande do Sul | Curitiba, Porto Alegre, Florianópolis |

### Argentina — 6 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `AR-01` | Noroeste | Jujuy, Salta, Tucumán, Catamarca, Santiago del Estero | Salta, Tucumán |
| `AR-02` | Nordeste e Litoral | Formosa, Chaco, Corrientes, Misiones, Entre Ríos | Resistencia, Corrientes, Posadas |
| `AR-03` | Cuyo | Mendoza, San Juan, San Luis, La Rioja | Mendoza, San Juan |
| `AR-04` | Centro e Pampas | Córdoba, Santa Fe, La Pampa | Córdoba, Rosario, Santa Rosa |
| `AR-05` | Buenos Aires | Buenos Aires (província), Ciudad Autónoma de Buenos Aires | Buenos Aires, La Plata |
| `AR-06` | Patagônia | Neuquén, Río Negro, Chubut, Santa Cruz, Tierra del Fuego | Neuquén, Comodoro Rivadavia, Río Gallegos |

### Chile — 5 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `CL-01` | Norte Grande | Arica y Parinacota, Tarapacá, Antofagasta | Arica, Iquique, Antofagasta |
| `CL-02` | Norte Chico e Atacama | Atacama, Coquimbo | Copiapó, La Serena |
| `CL-03` | Vale Central | Valparaíso, Metropolitana de Santiago, O’Higgins, Maule | Santiago, Valparaíso, Talca |
| `CL-04` | Centro-Sul | Ñuble, Biobío, La Araucanía, Los Ríos, Los Lagos | Concepción, Temuco, Puerto Montt |
| `CL-05` | Austral | Aysén, Magallanes | Coyhaique, Punta Arenas |

### Bolívia — 5 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `BO-01` | Altiplano | La Paz, Oruro, Potosí | La Paz, Oruro, Potosí |
| `BO-02` | Vales Centrais | Cochabamba, Chuquisaca | Cochabamba, Sucre |
| `BO-03` | Oriente | Santa Cruz | Santa Cruz de la Sierra |
| `BO-04` | Amazônia | Pando, Beni | Cobija, Trinidad |
| `BO-05` | Chaco e Sul | Tarija | Tarija |

### Paraguai — 5 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `PY-01` | Chaco Norte | Alto Paraguay, Boquerón | Filadelfia, Fuerte Olimpo |
| `PY-02` | Chaco Sul | Presidente Hayes | Villa Hayes |
| `PY-03` | Norte Oriental | Concepción, Amambay, San Pedro, Canindeyú | Concepción, Pedro Juan Caballero |
| `PY-04` | Assunção e Centro | Asunción (distrito capital), Central, Cordillera, Paraguarí, Caaguazú | Asunción, San Lorenzo, Caaguazú |
| `PY-05` | Alto Paraná e Sul | Alto Paraná, Guairá, Caazapá, Itapúa, Misiones, Ñeembucú | Ciudad del Este, Encarnación, Pilar |

### Uruguai — 4 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `UY-01` | Montevidéu e Metropolitana | Montevideo, Canelones, San José | Montevideo, Las Piedras |
| `UY-02` | Litoral | Colonia, Soriano, Río Negro, Paysandú, Salto | Colonia del Sacramento, Paysandú, Salto |
| `UY-03` | Centro-Norte | Artigas, Rivera, Tacuarembó, Durazno, Flores, Florida | Rivera, Tacuarembó, Durazno |
| `UY-04` | Leste | Maldonado, Rocha, Lavalleja, Treinta y Tres, Cerro Largo | Maldonado, Rocha, Melo |

### Peru — 6 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `PE-01` | Costa Norte | Tumbes, Piura, Lambayeque, La Libertad | Piura, Chiclayo, Trujillo |
| `PE-02` | Lima e Costa Central | Áncash, Lima, Callao | Lima, Callao, Huaraz |
| `PE-03` | Costa Sul | Ica, Arequipa, Moquegua, Tacna | Ica, Arequipa, Tacna |
| `PE-04` | Serra Norte e Central | Cajamarca, Huánuco, Pasco, Junín, Huancavelica | Cajamarca, Huancayo |
| `PE-05` | Serra Sul | Ayacucho, Apurímac, Cusco, Puno | Cusco, Puno, Ayacucho |
| `PE-06` | Amazônia | Amazonas, San Martín, Loreto, Ucayali, Madre de Dios | Iquitos, Pucallpa, Puerto Maldonado |

### Equador — 5 regiões

| ID | Região | Agregação administrativa **proposta** | Exemplos de pontos estratégicos (não escolhidos como alvos) |
|---|---|---|---|
| `EC-01` | Serra Norte | Carchi, Imbabura, Pichincha, Cotopaxi | Quito, Ibarra, Latacunga |
| `EC-02` | Serra Sul | Tungurahua, Bolívar, Chimborazo, Cañar, Azuay, Loja | Ambato, Cuenca, Loja |
| `EC-03` | Costa Norte e Insular | Esmeraldas, Manabí, Santo Domingo de los Tsáchilas, Galápagos | Esmeraldas, Manta, Puerto Ayora (nó insular) |
| `EC-04` | Guayas e Costa Sul | Guayas, Santa Elena, Los Ríos, El Oro | Guayaquil, Machala, Santa Elena |
| `EC-05` | Amazônia | Sucumbíos, Orellana, Napo, Pastaza, Morona Santiago, Zamora Chinchipe | Nueva Loja, Tena, Puyo |


### Notas de integralidade, ilhas e capitais especiais
- Inventário proposto: **42 regiões** construídas a partir de **162 unidades ADM1/capitais especiais**: Brasil 27, Argentina 24, Chile 16, Bolívia 9, Paraguai 18 (17 departamentos + Asunción), Uruguai 19, Peru 25 (Callao distinto), Equador 24.
- Os totais acima são **contagem interna de design**, não validação geométrica externa. A validação deve checar cobertura, duplicações e nomenclatura em cada fonte cartográfica.
- **Galápagos** integra `EC-03` administrativamente, mas será um **componente insular separado**, sem falso corredor terrestre até o continente; a conexão precisa ser marítima/aérea e restrita.
- **Rapa Nui / Ilha de Páscoa**, associada à região de Valparaíso, será tratada como ponto insular remoto, nunca adjacente por terra ao Chile continental.
- **Tierra del Fuego** exige conexões marítimas e restrições geográficas realistas; não inventar pontes terrestres.
- Fronteiras ou ilhas com situação internacional disputada serão objeto de uma **política cartográfica específica e neutra**, sem o jogo apresentar alegações territoriais controversas como fato simples.

## 3. Quantidade inicial de pontos e setores — recomendação de qualidade
- Ao começar, **1–3 pontos estratégicos visíveis por região**, dando de 42 a 126 pontos no catálogo inicial. A quantidade não tem de ser uniforme, nem todos precisam ser construíveis.
- Pontos estratégicos são base para governo, economia e logística; nem todo ponto precisa ter guarnição militar.
- **Setores operacionais só são ativados onde há forças, operações ou disputa**. Regiões em paz permanecem com estado agregado de defesa e segurança.
- Uma disputa pequena pode usar **2–3 setores por frente**, sem subdividir toda a América do Sul em centenas de hexágonos.
- Uma expansão acrescenta pontos/setores/países por dados e ajustes de balanceamento, sem reescrever o contrato de campanha.
- Para celular: zoom distante = países; zoom intermediário = regiões e frentes; zoom próximo = pontos, formações e rotas relevantes. Agrupar ícones e filtrar por inteligência.

## 4. Quatro conceitos de posse — não confundir
1. **Soberania (`legalOwner`):** a quem a região pertence juridicamente segundo o estado geopolítico do jogo. Não muda por invasão instantânea.
2. **Controle militar (`controller` de ponto/setor):** quem consegue permanecer e operar naquele local no ciclo militar. Pode mudar em combate.
3. **Controle administrativo regional (`adminController` / `adminControl`):** capacidade real de administrar/tributar a região após manutenção de presença e acesso. Pode ser parcial, disputada ou separada do soberano.
4. **Estabilidade de ocupação (`occupationStability`):** medida de capacidade de sustentar uma ocupação, com custos de guarnição, serviços, controle de fluxos e desgaste político.

**Exemplo:** o Paraguai controla militarmente um ponto no extremo oeste do Brasil em uma guerra fictícia. A soberania brasileira da região continua existindo; o Paraguai não passa a receber automaticamente toda a produção da Amazônia Ocidental.

## 5. Etapas de conquista

```text
FORÇA ENTRA NO SETOR
  ↓ resistência e ordens defensivas
POSIÇÃO DISPUTADA
  ↓ presença e resultado do ciclo militar
PONTO/SETOR SOB CONTROLE MILITAR
  ↓ manter acesso, suprimento, guarnição e nós essenciais
OCUPAÇÃO / CONTROLE ADMINISTRATIVO PARCIAL
  ↓ persistência + condições políticas e logísticas
CONTROLE ADMINISTRATIVO CONSOLIDADO
  ↓ SOMENTE com tratado, capitulação/termo político ou regra de cenário explícita
MUDANÇA FORMAL DE SOBERANIA (quando aplicável)
```

- **Incursão:** entra ou ameaça um setor, sem capturar toda região.
- **Combate/retirada:** ordens simultâneas determinam quem segura o setor no ciclo militar.
- **Controle de um ponto:** permite efeitos proporcionais à função do ponto (ex.: limitar a capacidade de uso daquela infraestrutura); não transfere automaticamente toda a renda regional.
- **Ocupação parcial:** requer continuidade da presença, linha logística viável e controle de pontos relevantes, com efeitos graduais e custos.
- **Consolidação:** avaliada no ciclo governamental de 12h, quando houver presença sustentada e condições suficientes. Fórmulas, pesos, tempo mínimo e resistência interna **ainda não definidos**.
- **Soberania:** só muda quando previsto nas regras diplomáticas/políticas de encerramento do conflito, nunca pelo simples clique de avanço.

## 6. Como será a ocupação na economia e política
- Região possui renda e produção agregadas; produção sob disputa sofre interrupções por infraestrutura, acesso e segurança.
- **Receita capturada é proporcional ao controle administrativo efetivo, com perdas e custos**, não à porcentagem do mapa pintada com outra cor.
- Custos de guarnição, reparação, logística e tensão política consomem recursos; uma grande ocupação pode ser insustentável.
- O estado soberano pode continuar com capacidade administrativa em pontos não ocupados; receita não pode ser coletada duas vezes.
- Recursos físicos não surgem do nada: estoque capturado/retido está associado a um nó específico e conserva quantidade.
- A população não é uma barra de "lealdade" que desaparece em um turno: existem efeitos políticos graduais, segurança e serviços, com alternativas de negociação e desocupação.
- Capitais e centros econômicos têm grande importância contextual, porém **capturar capital não gera game over automático**.

## 7. Rotas, movimento e acesso entre regiões
- O mapa armazena **adjacências físicas** entre polígonos e **rotas operacionais** entre pontos com capacidades próprias.
- Fronteira física **não** garante passagem legal ou capacidade logística; tratados, controle, terreno e estado de guerra alteram disponibilidade.
- O deslocamento respeita posição e recursos de cada formação. Nenhuma unidade teletransporta ou ocupa duas posições simultaneamente.
- Corredores marítimos ligam pontos costeiros/insulares sem fabricar fronteiras terrestres; transporte aéreo é uma opção condicionada a disponibilidade abstrata.
- Interdição/bloqueio representa alteração de capacidade de rotas no sistema de jogo, com recuperação e manutenção, sem instruções técnicas sobre infraestrutura real.
- O controlador de uma rota pode diferir do controlador de pontos; não transformar isso em controle instantâneo de províncias.

## 8. Drones, inteligência e guerra eletrônica por setor
- **Reconhecimento:** altera a qualidade, idade e abrangência das estimativas de forças e posições por setor. Nunca revela tudo.
- **Sistemas não tripulados:** disponibilidade e emprego alteram capacidades agregadas nos engajamentos; precisam de suprimento, reposição, operadores e comunicação.
- **Defesa antidrone:** reduz determinados efeitos sob condições de jogo, com custo e desgaste; não concede imunidade.
- **Guerra eletrônica:** modelada como índices de resiliência/interferência de comunicações sem representar frequências ou vulnerabilidades de equipamentos reais.
- **Névoa de guerra:** o mapa político pode mostrar fronteiras conhecidas, mas informações de forças, suprimentos e ordens inimigas são filtradas no servidor.
- No celular, exibir `confirmado` / `provável` / `desatualizado` / `desconhecido` na ficha do setor, não centenas de números permanentes.

## 9. Relação com o modo híbrido aprovado
- **Cada 12h:** política, economia regional, receita líquida, efeitos administrativos, serviços, consolidar ocupação e relatório de governo.
- **Microciclos militares (intervalo exato pendente):** reconhecimento, ordens persistentes, manobra, engajamentos, mudança de controlador de pontos/setores e consumo operacional.
- **Diplomacia contínua:** tratados têm vigência precisa; cessar-fogo impede ordens incompatíveis desde sua entrada em vigor. Efeitos econômicos fecham em calendário definido.
- Os microciclos preservam um livro de eventos e obrigações; o processamento de 12h consome esses eventos sem duplicar custos, perdas ou controle.
- O servidor processa operações mesmo sem jogador conectado, com ordens pré-definidas e regras de engajamento configuradas.

## 10. Caso demonstrativo fictício — fronteira Brasil–Paraguai
1. Na região `BR-04` (Centro-Oeste), um setor junto à fronteira é contestado numa campanha de testes.
2. Uma formação avança sobre um **ponto regional**. O combate pode mudar o controlador do ponto sem afetar todos os demais.
3. O mapa marca a posição sob controle militar e apresenta a região como **contestada**, não integralmente conquistada.
4. Ao longo dos ciclos, a presença, a logística e outros nós relevantes determinam ocupação parcial; quem perdeu o ponto conserva áreas não controladas pelo adversário.
5. No fechamento de 12h, o motor apura dano, produção efetiva, controle administrativo, guarnição e estabilidade.
6. Um tratado de paz pode obrigar retirada, cessão formal acordada, indenização, desmilitarização ou restabelecimento da administração, conforme cláusulas assinadas.
7. Todas as informações do relatório respeitam a inteligência disponível a cada lado, sem revelar ordens sigilosas.

**O teste não significa que esses países estarão em guerra na campanha oficial.**

## 11. Modelo de dados e validação futura
- Tabelas / estruturas futuras: `countries`, `regions`, `admin1_source_units`, `points`, `sector_templates`, `operational_sectors`, `route_edges`, `occupations`, `formation_positions`, `ownership_events`, `intel_reports`.
- Chaves estáveis e versionamento da campanha; conteúdo separado de lógica. Não usar país ou quantidade fixa no motor.
- **Cartografia:** gerar polígonos unindo ADM1 de uma base versionada, verificar cobertura sem lacunas/duplicações e correspondência de nomes/IDs de origem.
- **Geometrias:** não alterar fronteiras nacionais reais para justificar macros; bordas internas são agregações de ADM1. Ilhas são MultiPolygon ou nós externos com rota explícita.
- **Validação de peso:** dimensão territorial, produção, número de nós, densidade urbana e gargalos são atributos separados. País com 4 regiões pode competir com país de 6.
- **Fonte cartográfica candidata:** [Natural Earth Admin-1 10m](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-1-states-provinces/) (a própria fonte diz estar em beta, portanto conferir cobertura e política de territórios contestados); [geoBoundaries](https://www.geoboundaries.org/) como base complementar quando necessário.
- **Licenças, nomes, ilhas, sobreposições, CABA/Callao/Asunción e territorialidade contestada:** revisão obrigatória antes da importação.

### Invariantes técnicas obrigatórias
1. Cada ponto/setor possui no máximo um controlador militar final por microciclo.
2. Uma região pode estar disputada, mas não duplicar soberania, renda nem estoques.
3. Uma ordem só atinge adjacências/rotas válidas e permissões permitidas pela situação política.
4. Entradas idempotentes e resolução simultânea por versão e semente, sem vantagem de quem clicou primeiro.
5. Conquista de um ponto NÃO dá automaticamente soberania nem controle administrativo pleno.
6. A ocupação diminui ou desaparece se as condições logísticas/políticas deixarem de existir, sem reversão arbitrária instantânea.
7. O estado pode ser reconstruído por histórico, independentemente do jogador estar conectado.
8. A expansão de 42 para centenas de regiões exige adicionar dados, não alterar invariantes.
9. O jogador não recebe coordenadas/unidades secretas do adversário pela API.
10. As telas do mapa devem funcionar com toque em celular e clusters por zoom.

## 12. Decisões ainda NÃO aprovadas (sequência de planejamento)
- **Quais pontos e setores serão ativos no primeiro teste**; as cidades deste documento são exemplos cartográficos e não bases/objetivos militares automaticamente definidos.
- **Fórmula de controle administrativo**, pesos de capitais/portos/guarnição, duração da consolidação, custos e formas de resistência.
- Se o mapa mostrará uma camada de **ocupação territorial com controle parcial** pintada e quais critérios determinam área colorida.
- **Intervalo dos microciclos militares**: exemplo de 30 minutos, ainda não confirmado.
- **Quais oito países estarão definitivamente disponíveis** e o equilíbrio econômico/militar final.

**Regra de execução:** nenhum novo deploy só para documentação. A implementação aguarda o aceite do recorte territorial, da experiência mobile e do motor mínimo.
