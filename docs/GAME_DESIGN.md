# DOMÍNIO GLOBAL — Campanha Brasil, design do jogo v0.2

## Conceito
Um grand strategy de guerra moderna em história alternativa, totalmente ambientado no território brasileiro. Foco em guerras interestaduais fictícias, conquistas territoriais, economia, logística e diplomacia.

## Geografia
- Brasil inteiro é o único mapa jogável; não haverá mapas internacionais.
- MVP: 27 unidades federativas (26 estados + DF), cada uma uma facção, com adjacência real entre estados.
- Expansão: mapas com divisões municipais, capitais, cidades estratégicas, portos e aeroportos, sem alterar a fronteira externa do Brasil.
- A conquista de territórios muda o mapa em tempo real para todos os participantes.
- Cartografia simplificada, derivada de fonte GeoJSON vinculada ao IBGE, usada para jogo e não para precisão cartográfica.

## Regras do MVP
- 1 jogador por estado; os demais estados continuam como NPCs inativos, ainda sem IA.
- 1 única sala por servidor; 20 segundos por turno padrão.
- Recursos: créditos, aço, combustível, alimentos e energia.
- Estado inicial equilibrado: 120 unidades terrestres, uma indústria, sem fortificação, recursos idênticos entre estados.
- Cada estado gera recursos em cada turno conforme seu nível de indústria e terreno sintético de jogo.
- Recrutar: 180 créditos, 35 aço, 12 alimentos, 30 unidades em 2 turnos.
- Expandir indústria: 400 créditos, 85 aço, 25 energia em 4 turnos; máximo nível 4.
- Mover tropas entre estados diretamente vizinhos, mantendo 1 unidade na origem; chegada em 2 turnos.
- Ao chegar em estado hostil, ocorre batalha determinística resolvida no servidor. Vitória transfere controle e produção ao atacante.
- Vitória final: controle de todos os 27 estados.

## Evolução planejada
1. Comandos visuais (mapa com zoom e seleção de estados); filtros e acessibilidade de regiões pequenas como DF.
2. Sessões, registro de contas, múltiplas campanhas, chat e lobby.
3. Subdivisões municipais como províncias jogáveis; cidades como núcleos de economia e indústria.
4. Unidades distintas (infantaria, tanques, artilharia, drones, caça, helicópteros e navios) com custos e tempos próprios.
5. Redes de suprimento, rodovias, ferrovias, aeroportos, portos, recursos regionais e consumo militar.
6. Tratados, alianças, acordos comerciais, comércio, sanções e inteligência.
7. IA, equilíbrio econômico, prevenção de trapaças, estatísticas, jornal e notificações.

## Segurança e produção
O servidor calcula e valida as ordens; o cliente não altera diretamente recursos ou tropas. Os tokens de teste locais não são autenticação robusta. A persistência por arquivo JSON não garante escalabilidade/segurança em várias instâncias. Sem publicação antes de implementar autenticação, estados transacionais e motor isolado por campanha.
