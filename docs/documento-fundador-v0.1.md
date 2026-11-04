# Simulador de Diplomacia e Política — Documento Fundador v0.1

**Status:** proposta de design para discussão (não é especificação aprovada).
**Data:** 04/11/2026.
**Nome do jogo:** provisório.
**Código:** não iniciado. **Deploy:** não autorizado nesta fase.

## 1. Princípio do produto
**Poucos jogadores. Máxima qualidade. Expansão sem reconstrução.**
A complexidade estará nas consequências das decisões, não na quantidade de telas, cidades ou animações.
Cada ação relevante deve ser inteligível: custo, risco, prazo, informação disponível e resultado.
Todo conteúdo territorial e político deve ser dirigido por dados e configurável por campanha.

## 2. Primeiro cenário — PROPOSTA, não decisão final
Campanha regional alternativa, situada por volta de 2030, com geografia reconhecível mas eventos, líderes e condições iniciais fictícios.
**Oito nações inicialmente jogáveis:** Brasil, Argentina, Chile, Bolívia, Paraguai, Uruguai, Peru e Equador.
Outros países existem apenas como vizinhos diplomáticos/mercados não jogáveis; não precisam de simulação integral.
**Jogadores-alvo:** 6–8 simultâneos na primeira campanha; infraestrutura preparada para múltiplas campanhas isoladas.
**Territórios:** sugestão de 4–6 regiões estratégicas por país na primeira versão, sem cidades individuais jogáveis.
O continente completo não precisa ser liberado na estreia.
Série de expansão: regiões adicionais → nações adicionais → cenários paralelos; nunca exigir reescrever a simulação.

## 3. Dinâmica de turno
Jogo assíncrono. Cada campanha escolhe sua duração do turno (valor inicial candidato: 12 horas).
Turno dividido em planejamento, fechamento das ordens, resolução atômica no servidor e relatório.
Jogadores podem planejar e revisar ordens até o fechamento; após o fechamento não podem alterar resultados já comprometidos.
Todas as ações recebem identificador idempotente, horário e registro auditável.
Ausência de jogador não suspende o mundo: políticas permanentes e ordens defensivas permanecem; o sistema não toma decisões políticas arbitrárias.

## 4. Política e diplomacia
Indicadores iniciais: legitimidade, estabilidade, tesouro, produção, influência externa e apoio social.
O gabinete governa por decisões limitadas e de impacto real, sem microgerenciamento excessivo.
A diplomacia inclui mensagens, propostas e contrapropostas, acordos comerciais, tratados, garantias, alianças, sanções, ultimatos e negociação de paz.
Tratados têm signatários, obrigações verificáveis, vigência, penalidades e histórico. Quebras de tratado afetam reputação e relações.
Não confundir reputação com alinhamento: uma nação pode ter influência alta sem ser popular.
A guerra afeta política e economia; o cenário econômico afeta a capacidade de sustentar operações militares.

## 5. Núcleo militar: profundidade lógica, representação gráfica simples
Não implementar movimento de centenas de soldados individuais ou 3D.
O mapa mostra fronteiras, regiões, principais rotas, unidades/agrupamentos, frentes e informações conhecidas.
Organização militar por formações e equipamento: efetivos, material disponível, experiência, prontidão e doutrina.
Cada formação precisa de cadeia de comando e suprimentos; munição, combustível, manutenção, reforços e rotas limitam a operação.
Inteligência imperfeita: reconhecimento, sigilo, desinformação e grau de certeza; não mostrar ao adversário informações privadas.
Resolução em fases: reconhecimento → logística → manobra → combate → recuo/ocupação → recuperação.
Resultados dependem de terreno, clima, linhas de suprimento, moral, experiência, tecnologia, ordem recebida, concentração, defesa e desgaste.
Dados aleatórios apenas com semente reproduzível por campanha/turno; decisões simultâneas são resolvidas sem privilégio de quem clicou primeiro.
Vitória tática não significa vitória estratégica; ocupação gera custos e resistência.
Relatórios militares devem mostrar fatores explicativos sem revelar inteligência secreta do outro lado.

### Primeira prova de conceito obrigatória
Duas nações adjacentes, poucas regiões, unidades com equipamentos distintos e três ordens: defender, avançar, recuar.
Comprovar que cortar suprimentos altera materialmente o resultado de uma ofensiva.
Comprovar que equipamento/terreno/moral têm efeitos distintos.
Comprovar sigilo e resultados iguais na repetição com mesma semente.
Só então ampliar tipos de tropas, doutrinas, manobras, inteligência e armas.

## 6. Interface: antes do backend
Entregar protótipo mobile navegável do gabinete nacional, painel diplomático, mapa militar, centro de decisões e relatório de turno.
Uma ação principal por tela; hierarquia clara e textos curtos; ações importantes com confirmação e custo/risco visíveis.
A experiência deve ser testada e aprovada no celular antes de implementar operações reais.
Nenhum componente de interface depende de hardcode de número de países ou duração do turno.

## 7. Arquitetura proposta
- GitHub existente para código e versões; novo produto em projeto separado conceitualmente.
- Vercel para aplicativo web (frontend e ações leves); não depender de servidor Node permanente.
- Supabase Postgres para estado e histórico por campanha; autenticação e RLS; dados sensíveis nunca expostos no frontend.
- Resolução de turno transacional, idempotente e reexecutável no backend; função agendada, com controle de concorrência, logs e retomada.
- Realtime apenas para notificações e atualizações; o estado canônico vem do banco.
- Regras puras em módulo próprio com testes determinísticos; fronteiras, política, tropas e economia carregadas por dados versionados.
- Limites iniciais de campanha são produto, não travas estruturais.
- Não copiar credenciais do Supabase no GitHub; não reaproveitar dados das contas do jogo encerrado.

## 8. Critérios de aceitação do primeiro protótipo funcional
1. Dois jogadores registram contas e controlam países distintos dentro da mesma campanha.
2. Uma proposta diplomática é negociada, assinada e produz efeito mensurável no turno seguinte.
3. Cada jogador transmite uma ordem militar sigilosa; a resolução é simultânea, verificável e persistente.
4. Uma ofensiva logística/terreno desfavorável tem resultado explicável; decisões militares não são somente comparação de números.
5. Após reiniciar a hospedagem, permanecem país, tratados, ordens, histórico e recursos.
6. Nenhum jogador acessa ordens secretas alheias por API.
7. Interface mobile completável sem usar computador; nenhum deploy oficial antes de validar a jornada integral.

## 9. Fases e limites de escopo
**Fase A — Design:** validar cenário, duração de turnos, objetivos, escala regional e interface.
**Fase B — Protótipo:** mobile navegável, sem dados reais e sem deploy público.
**Fase C — Núcleo:** motor militar e diplomático com testes automatizados.
**Fase D — Vertical slice:** dois jogadores, um tratado, um conflito, persistência.
**Fase E — Alfa restrita:** 6–8 jogadores; testes de custo, carga, abuso e uso real.
**Fase F — Expansão:** novos países/partidas e novos sistemas condicionados à qualidade comprovada.

## 10. Decisões ainda abertas
- Países reais com história alternativa (proposta acima) versus países totalmente fictícios.
- Exatamente quais oito países e quantas regiões iniciais.
- Ritmo de turnos (12 horas proposto) e duração ideal das campanhas.
- Objetivo das campanhas: vitória por influência/estabilidade, metas políticas, ou pontuação multi-critério.
- Grau de granularidade militar, níveis de tropas e mecânicas de aviação/marinha na estreia.
- Nome definitivo e identidade visual.

**Regra de execução:** não criar novos sistemas, refazer a interface nem publicar outro site até que o documento fundador e o protótipo sejam aceitos.
