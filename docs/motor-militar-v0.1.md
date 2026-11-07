# Motor militar — Especificação de design v0.1

**Projeto:** Simulador de Diplomacia e Política · **Cenário:** Crise Sul-Americana (2030).
**Estado:** PROPOSTA, sem motor executável nem deploy. Histórias e situações são fictícias.
**Atualização vinculante de 07/11/2026:** Decisão 05 fixa **30 minutos** por microciclo militar. Consulte [ciclos militares, ordens, movimento, combate e drones v0.5](ciclos-militares-e-ordens-v0.5.md). Onde este documento antigo pressupõe um único ciclo militar por turno governamental, a regra atual é 24 microciclos por turno de 12 horas.
**Princípio:** profundidade de simulação, simplicidade visual, poucos jogadores, expansão por dados.

## 1. Objetivo do sistema
Criar guerras com resultados coerentes, rastreáveis e dependentes das decisões políticas e econômicas, não somente da quantidade nominal de soldados ou de gráficos animados.
O sistema deve tornar viáveis a dissuasão, a negociação e a retirada estratégica; guerra não será obrigatória nem forma exclusiva de vitória. Uma campanha com oito países pode permanecer em paz.
O jogador gerencia grupos e objetivos; o motor trata os cálculos internos. Cada ordem apresenta prévia de custo, prazo, risco e confiabilidade da informação, nunca uma probabilidade de vitória artificialmente precisa.

## 2. Escala de primeira validação
**Prova de conceito isolada Brasil–Paraguai**, com três a cinco setores de fronteira conectados; **nenhuma guerra é predefinida na campanha oficial**.
- Dois jogadores; até dois grupos militares por lado, com batalhões ou unidades constituintes agregadas.
- Três ordens verificáveis: Defender/Manter posição, Avançar e Recuar.
- Um eixo logístico principal e um secundário com capacidade limitada e possibilidade de interrupção.
- Dois tipos de equipamento terrestre iniciais: infantaria motorizada e blindados; mais uma categoria de apoio, sem combate tático animado.
- Inteligência imperfeita, terreno variável e estoques com consumo real.
- Relatórios: situação antes, decisões, reconhecimento, suprimentos, perdas, objetivos e consequências políticas.
- Os valores da prévia visual são **ilustrativos** e não coeficientes definidos do motor.

## 3. Estrutura de dados para expansão
- **Campaign:** id, versão de regras, cenário, turno, seed, situação diplomática, cronologia.
- **Country:** id, tesouro, produção, política, estoque de reservas, infraestrutura, tratados e política de defesa.
- **Sector:** id estável, countryOwner, controller, terrain, weather, fortification, infrastructure, connectedEdges, supplyNodes, civilImpact.
- **Route/Edge:** origem/destino, tipo, capacidade por turno, custo, integridade, controle, permissões de passagem.
- **Formation:** id, país, setor, missão, comandante/doutrina, prontidão, experiência, moral, fadiga, categoria, equipamentos, pessoal, perdas, manutenção, abastecimento.
- **Stockpile:** país/setor, combustível, alimentos, munição, peças e material de reposição, cap de armazenamento e reservas disponíveis.
- **IntelReport:** emissor, alvo, recência, confiabilidade, faixa de estimativas, origem; visibilidade por jogador e validade.
- **MilitaryOrder:** idempotencyKey, actor, formation, turn, version, orderType, destination, conditions, timestamp, estimatedCost.
- **TurnResult:** seed, versão da regra, snapshot hash, eventos públicos, eventos privados por país, estados anterior e posterior, checksum.

Nomes, quantidades e tipos devem pertencer a catálogos versionados, não a ifs fixos por país. Cada campanha conserva a versão com que começou.

## 4. Comandos e UX da Defesa
**Painel Defesa**: (a) alerta resumido; (b) mapa por setores com contornos e rotas; (c) força selecionada e condições; (d) centro de ordens; (e) relatórios.
No celular, cada assunto deve aparecer em uma aba/página simples, não dezenas de blocos empilhados. O mapa deve ser consultável, não obrigar precisão milimétrica no toque.
Ordens de guerra requerem confirmação dos custos; ações incompatíveis com cessar-fogo são barradas.
Indicadores de inteligência devem distinguir “confirmado”, “estimado” e “desconhecido”; não prometer visão completa.
A prévia offline HTML é uma **maquete navegável**, não demonstra que o motor já existe.

## 5. Cadeia logística — núcleo da profundidade
Reservas nacionais **não** equivalem a suprimentos entregues. O fluxo vai de estoque de origem até formações, respeitando malha de rotas, capacidades, dano, tratados e controle de território.
Consumo depende de missão e material: defesa, deslocamento, combate e recuperação têm taxas diferentes.
Ordens são executadas sob limitações concretas. Se faltar combustível, o agrupamento blindado pode ficar imóvel; sem munição, a força perde poder de combate; falta de manutenção reduz prontidão e aumenta falhas.
Interdição e destruição de infraestrutura afetam capacidade futura e custos de reparo, sem apagar estoque fora do setor.
A distribuição deve ser determinística e justa, com prioridade explícita e limite total: nenhuma rota pode transportar mais do que sua capacidade somada.

## 6. Inteligência e neblina de guerra
O jogador conhece o próprio exército integralmente, mas o inimigo por estimativas e informações datadas.
Níveis propostos: observado, estimado, suspeito, desconhecido. Não apresentar estimativas como valores exatos.
A coleta pode ocorrer por reconhecimento, presença local e pactos de compartilhamento.
Contramedidas produzem redução de confiança, não invisibilidade absoluta.
A API e os relatórios são filtrados no backend por identidade, campanha, país e permissão; nunca confiar em ocultar campos somente por CSS.

## 7. Precedência de execução militar no turno
1. Congelar ordens válidas, snapshot e tratados ativos.
2. Aplicar disponibilidade econômica, manutenção e capacidade produtiva já apuradas.
3. Calcular reconhecimento, status das rotas e suprimentos entregues.
4. Calcular iniciativa/avanço, movimentação e contato simultâneos.
5. Agregar engajamentos por setor/frente com doutrina, terreno, clima, fortificações, fogo, moral, experiência, fadiga e abastecimento.
6. Resolver resultados de combate, perdas, consumo, retirada e controle territorial.
7. Calcular ocupação, reação interna, infraestrutura, reputação e impacto econômico.
8. Confirmar transação completa e produzir relatório público/privado sem segredos vazados.

As fórmulas finais serão publicadas em versão própria e balanceadas com testes de sensibilidade. Não usar uma única soma “poder de ataque versus poder de defesa” como simulador.

### Modelo conceitual, NÃO fórmula final
- **Capacidade efetiva** é uma função limitada por prontidão, suprimento e manutenção, modulada por doutrina e condições locais.
- **Desgaste** decorre da intensidade e duração, afetando material e pessoal de forma separada.
- **Resultado de manobra** depende também da capacidade de se deslocar e manter o setor após a ofensiva.
- **Resolução simultânea** evita vantagem injusta de clicar primeiro.
- **Incerteza** é seedada, delimitada, testável e refletida na confiança da previsão.
- Os resultados devem manter invariantes: recursos conservados, perdas não negativas, capacidade de rota não excedida, nenhum grupo presente em dois setores no mesmo fechamento.

## 8. Política e diplomacia na guerra
A legalidade e a viabilidade diplomática de cada operação dependem do estado de guerra, direito de passagem e acordos ativos.
Guerra custa recursos a todos os envolvidos; ocupação exige guarnição, suprimento e gera impactos civis e diplomáticos.
Governos podem declarar objetivos limitados, buscar cessar-fogo, negociar fronteiras e compensações. A guerra pode terminar sem conquista total.
Indicadores de segurança e soberania não premiam agressões gratuitamente nem incentivam exploração de baixas para farmar pontos.

## 9. Testes obrigatórios, verificáveis e automatizáveis
1. Mesmo snapshot + ordens + seed + versão gera exatamente o mesmo resultado.
2. Duas ordens iguais com mesma idempotencyKey debitam recursos só uma vez.
3. Um bloqueio que reduz abastecimento afeta prontidão e desfecho conforme as regras, sem efeito mágico instantâneo.
4. Blindados sem combustível não mantêm mobilidade máxima.
5. A rota não entrega mais do que sua capacidade, mesmo com grupos adicionais.
6. Uma retirada valida não produz avanço simultâneo contraditório.
7. Tratado de cessar-fogo em vigor bloqueia ações proibidas.
8. Um jogador não acessa ordens e estoques secretos do adversário.
9. Forças e estoques nunca ficam negativos; o setor não possui dois controladores após a resolução.
10. Resolver o turno duas vezes não gera duplicação de ganhos, perdas ou transferências.
11. Cenário com poucos grupos e regiões produz relatório útil e fácil de ler no celular.
12. O motor não referencia países por nome no código: substituição dos dados por outro cenário não altera regras genéricas.
13. Falha de rede ou de execução não comita resultado parcial.
14. Testes de estresse crescem de 2 países para 8 países sem alterar contratos de dados.

## 10. Critérios de aprovação da fase militar
Primeiro entregar um protótipo de interface e **simulações automatizadas offline**. Só se considerará a prova de conceito concluída quando:
- decisões logísticas causarem diferenças relevantes e coerentes no confronto;
- cada combate puder ser reproduzido e auditado;
- relatórios públicos e privados não vazarem informação;
- dois jogadores conseguirem planejar e revisar ordens no celular;
- alterações no número de regiões/países forem feitas por catálogo de cenário.
Não publicar no Vercel nem criar tabelas no Supabase até aprovação expressa da arquitetura e da navegação.

## 11. Questões ainda abertas
- Frequência de turnos (12h proposta), horizonte de preparação e duração de campanha.
- Tamanho real de agrupamentos, quantidade de equipamentos na estreia e diferenças doutrinárias.
- Se combate aéreo/naval entra na primeira campanha ou numa expansão após o sistema terrestre estar validado.
- Representação de desgaste civil e logística de ocupação.
- Fórmulas de balanceamento e parâmetros iniciais baseados no universo fictício.
- Modelo visual final: aprovação do protótipo da Defesa, depois protótipos de Governo e Diplomacia.

**Próxima decisão de projeto recomendada:** validar se a maquete do comando militar comunica claramente *o que sei*, *o que quero fazer*, *quanto custa*, *o que pode dar errado* e *quando será resolvido*.
