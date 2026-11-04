# Domínio Global v0.11 — Integração do Brasil estratégico

Data: 03/11/2026 | Etapa local, sem deploy.

## Entregue

- 171 cidades/setores curados distribuídos nas 27 unidades federativas. Cada centro pode ser ocupado, reforçado, abastecido e fortificado pelas ordens existentes. O controle é independente do estado.
- 27 capitais e 27 polos legados mantêm os IDs `uf-capital` e `uf-hub` (mapeados para cidades reais). Os outros 117 têm ID do catálogo.
- 10 funções estratégicas: CAP, LOG, FRO, AGR, POR, IND, ENE, REG, MIN e TEC. A função primária e a secundária determinam renda local independente da renda do estado. Renda sofre redução com cerco e desgaste logístico.
- Rotas abstratas intrafederativas calculadas por conexão mínima e proximidade. Uma cidade ocupada precisa ter ligação por rotas até uma zona de apoio própria; dois nós isolados não geram suprimento indefinido.
- Na visão Brasil somente os estados; ao ampliar uma UF (zoom 1,5+), renderiza exclusivamente suas cidades e rotas, entre quatro e dez cidades por UF. O painel Cidades permite filtrar UF ou consultar todas as 171.
- 171 pontos geográficos aproximados, arquivo de 18 KB, sem polígonos dos 5.570 municípios. A posição é o centroide estimado do polígono municipal, **não a sede urbana**. No DF, três posições indicativas representam regiões administrativas.
- Migração automática do salvamento schema 8 para 9, preservando 54 centros anteriores, tropas, controle, construções, suprimentos, guerras, jogadores, recursos e ordens. Servidor gera `*.backup-v8` antes de modificar o salvamento.

## Restrições conscientemente mantidas

- Os limites das cidades **não** são terrenos conquistáveis individuais. São nós estratégicos, não toda a malha municipal.
- Rotas são abstrações de gameplay, não estradas, ferrovias, pontes ou distâncias reais.
- A captura é calculada pelo sistema de ordens da v0.9; ainda não existe um mapa de combate urbano com setores internos, comboios visuais ou logística multimodal.
- Valores de produção são provisórios e precisam de balanceamento; não correspondem a estatísticas econômicas das cidades reais.
- Ainda não há contas definitivas, IA, lobby, banco de dados de produção, persistência transacional ou infraestrutura online segura.
- Visual continua provisório; projeto não publicado.

## Fonte de referência geográfica

Centróides aproximados derivados de limites municipais do repositório público `henriquemalvar/br-geojson`. O arquivo `build_city_positions.py` recompõe o resumo local de posições usadas. Não incluir os polígonos municipais no frontend.

## Validação

```bash
npm test
python tests/browser_national_cities_smoke.py
python tests/browser_support_smoke.py
python tests/browser_smoke_v08.py
```

Testes específicos: 171 IDs únicos, 27 capitais, rotas simétricas e conectadas por UF, sigilo das guarnições, renda de centro ocupado, migração de 54 pontos, navegação desktop e mobile, exibição seletiva por estado e regressão de missões da v0.8. Teste separado de salvamento em disco confirmou migração para schema 9 e criação do backup antigo.
