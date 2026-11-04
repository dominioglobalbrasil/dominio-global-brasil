# Domínio Global — Campanha Brasil v0.9

## Objetivo desta versão

Criar **conquistas parciais dentro dos estados** sem substituir a simulação territorial da v0.8 e sem introduzir uma geometria municipal inventada.

### Entregue

- 54 centros estratégicos: 27 capitais brasileiras reais (nomeadas) e 27 polos econômicos **fictícios** de jogo.
- Cada centro possui `id`, estado de origem, tipo, controlador, guarnição por classe, coordenadas esquemáticas de marcador e contagem pública de tropas.
- Conquista de centros por ordem `sector_assault` processada no servidor em 2 turnos, apenas a partir de UF controlada dentro do próprio estado ou de estado vizinho; requer infantaria e respeita os cessar-fogos.
- Transferências `sector_reinforce` e `sector_withdraw` com reserva de tropas, impedimento de uso duplicado e preservação de uma unidade na posição de partida.
- Defesa urbana abstrata na capital/polo original, reduzida por ataques. Isso representa infraestrutura defensiva, não tropas novas geradas por trás da API.
- Capturar um centro **não** transfere automaticamente a propriedade da UF nem do outro centro; a posse do estado continua definida pela batalha territorial existente.
- Ocupação de centros redistribui receita de créditos, aço, energia e alimentos por turno; não cria recursos adicionais (arredondamento mínimo de uma unidade quando a parcela é positiva e a produção permite).
- A conquista do país exige o controle dos 27 estados **e** dos 54 centros.
- Capitais sob ocupação inimiga deixam de servir como origem de abastecimento do estado original; bases militares existentes continuam funcionando.
- Interface própria em **Cidades estratégicas**, filtros Todos / Sob meu controle / Em disputa, janela de detalhes e janelas individuais de ataque, reforço e retirada.
- 54 marcadores no mapa quando o filtro “★ Centros” estiver ativo. No celular, os marcadores começam ocultos para não sobrecarregar a leitura e podem ser ativados a qualquer momento.
- API pública não revela composição detalhada de guarnições inimigas, embora a contagem geral seja pública como no sistema estadual atual.
- Migração automática de salvamentos schema 2–6 para schema 7 com backup físico anterior à migração. Nenhuma unidade existente é retirada da guarnição estadual durante a migração.
- `npm test`: 69 testes; `python tests/browser_centers_smoke.py`: integração real Node + Chromium no desktop/mobile.

### Limites claros

- Os **marcadores das capitais são esquemáticos**, baseados no ponto de referência do estado, e não nas coordenadas cartográficas oficiais do centro urbano. Os nomes das capitais são reais; os polos econômicos são regiões fictícias.
- Esta NÃO é ainda uma malha municipal. Não há estradas, pontes, ferrovias ou territórios urbanos com polígonos, nem captura de bairros ou municípios individuais.
- Não há IA, sala de partida, autenticação definitiva, multiplayer com banco transacional, antibot ou servidor público.
- O sistema de combate entre UFs segue existindo em paralelo. Aviação e artilharia de apoio da v0.8 ainda visam estados e não centros específicos.
- Visual permanece provisório conforme decidido. Esta versão é para testes locais e NÃO foi publicada.

## Comandos de teste

```bash
npm test
npm start
python tests/browser_centers_smoke.py
```

Em `http://127.0.0.1:3000`, assuma SP, abra a área **Cidades estratégicas** e inspecione Belo Horizonte. Selecione **Planejar ocupação**, origem São Paulo, 90 soldados e confirme. A operação será resolvida em dois turnos. Para testes automatizados, use uma instância isolada com `TICK_MS=1000`.

## Prioridades seguintes (proposta)

1. **Mapa municipal real:** polígonos oficiais, auditoria geográfica, importação incremental e desempenho mobile (não adicionar municípios arbitrários).
2. **Movimentação local avançada:** deslocamentos centro ↔ centro, cerco, suprimento local e capitais como objetivos de campanha.
3. **Lobby / contas / múltiplas partidas:** camada autoritativa persistida em banco transacional; isolamento de campanhas e sessões.
4. **IA para UFs sem jogadores** e balanceamento com sessões de teste reais.
5. **Reforma visual posterior** com modelo de HUD aprovado e inspeção rigorosa no navegador.
