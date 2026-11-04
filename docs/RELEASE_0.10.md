# Domínio Global — Campanha Brasil v0.10 (camada municipal leve)

## Escolha de escopo aprovada

O mapa nacional **permanece dividido apenas nas 27 unidades federativas**, com seus **54 centros estratégicos** existentes. **Não** representar os 79 municípios de MS simultaneamente e não subdividir automaticamente todos os estados brasileiros.

A primeira camada municipal piloto contém **8 municípios-chave de MS**: Campo Grande, Dourados, Três Lagoas, Corumbá, Ponta Porã, Naviraí, Aquidauana e Nova Andradina.

- Seus limites foram simplificados e salvos em um JSON de aproximadamente **1,6 KB**, em vez dos aproximadamente **9,3 KB** usados para os 79 municípios.
- O arquivo é carregado **sob demanda**: apenas ao selecionar Mato Grosso do Sul e ampliar o mapa para zoom 2× ou superior.
- Os nomes são consultados ao tocar ou passar o mouse nos marcadores; **não** são escritos sobre o mapa, evitando sobreposições. No mapa nacional não aparecem limites nem marcadores municipais.
- Selecionar outro estado ou reduzir zoom oculta toda a camada municipal.
- Os municípios têm janelas informativas próprias e **ainda não são territórios conquistáveis**; as conquistas de cidades continuam ocorrendo pelos 54 centros estratégicos da v0.9.
- A divisão geográfica é visual e não altera dados de salvamento. As campanhas existentes permanecem compatíveis.

**Expansão futura:** selecionar em média **4 a 8 cidades estratégicas por UF**, conforme sua importância no jogo, sem obrigação de incluir todos os municípios. Esses elementos aparecem apenas quando o jogador dá zoom no estado escolhido. Priorizar centros regionais, industriais, logísticos e de fronteira. Para jogos muito pequenos, alguns estados podem ter menos de quatro.

**Origem geográfica de referência:** arquivos simplificados a partir da malha de municípios de MS distribuída no repositório `henriquemalvar/br-geojson`. Para publicação definitiva, conferir condições de reutilização e preferir dados oficiais do IBGE.

## Estado do desenvolvimento

O motor da v0.10 contém código experimental para cercos e suprimentos urbanos; **isso não significa que essas operações já estejam disponíveis em todas as janelas do jogo**. O pacote deste marco valida a camada municipal leve e mantém os 54 centros urbanos do jogo.

## Validação

```sh
npm test
python tests/browser_municipalities_light_smoke.py
```

Não fazer deploy até concluir testes mais amplos do jogo.
