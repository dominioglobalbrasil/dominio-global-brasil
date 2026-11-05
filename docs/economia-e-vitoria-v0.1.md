# Economia e condições de vitória — Proposta v0.1

**Projeto:** Simulador de Diplomacia e Política | **Campanha:** Crise Sul-Americana, 2030
**Estado:** regras em elaboração, para aprovação e balanceamento. **Sem código e sem deploy.**
**Lema:** poucos jogadores, máxima qualidade e expansão por configuração.

## 1. Visão de jogo
A economia precisa criar escolhas difíceis, não exigir que o jogador opere uma planilha. O governante controla prioridades, tratados e investimentos; o motor calcula efeitos secundários, logística, desgaste político e capacidade militar.
A guerra será profunda na lógica, mas não o caminho automático para vencer. Diplomacia, boa administração e contenção estratégica precisam ser competitivas.
Um país pequeno deve poder vencer por desempenho relativo, alianças e metas próprias; jamais comparar economias apenas pelo valor bruto de sua produção.

## 2. Escala inicial
- Cenário aprovado: América do Sul, história alternativa em 2030; países reais, eventos/governantes fictícios.
- Oito nações inicialmente propostas: Brasil, Argentina, Chile, Bolívia, Paraguai, Uruguai, Peru e Equador.
- Meta inicial: 6 a 8 jogadores, uma única campanha fechada; outras campanhas somente após validar a primeira.
- Proposta de duração: **40 turnos** a **12 horas** cada (= 20 dias reais), ambos configuráveis por cenário. Não decidido definitivamente.
- Início com economia regional agregada: cada país tem parâmetros nacionais + poucas regiões produtivas; não simular cada empresa, cidade, trabalhador ou transação.
- Escalas e metas definidas no cenário; nenhum número de país vira constante no código.

## 3. Tela do gabinete econômico — seis indicadores legíveis
1. **Tesouro:** saldo líquido para decisões, gastos correntes e compromissos futuros.
2. **Receita por turno:** impostos e participações, afetados por estabilidade, comércio, bloqueios e produção.
3. **Estabilidade política:** apoio interno/coesão social; influencia receita, capacidade de fazer reformas e risco de crise.
4. **Capacidade produtiva:** infraestrutura, indústria e produtividade civil/militar; gera bens e impostos com defasagem.
5. **Abastecimento estratégico:** mostra separadamente disponibilidade de alimentos, energia, insumos industriais e material militar.
6. **Dívida e obrigações:** valor e custo previsto por turno; não esconder gastos de manutenção de exércitos ou tratados.

**Números internos:** o motor pode manter variáveis adicionais (rotas, perdas, sanções, estoques, moral, influência, composição industrial), mas a primeira tela exibe apenas prioridades e alertas úteis.

## 4. Unidade econômica e recursos
**Moeda interna:** Créditos de Governo (CG), unidade abstrata fictícia e não conversão de moedas nacionais reais.
**Estoques estratégicos iniciais:** alimento, energia, insumos industriais e material militar. A capacidade logística é uma restrição de transporte por rota/turno, não mais um recurso universal negociável.
A população, capacidade produtiva e infraestrutura são indicadores estruturais — não mercadorias.
Tesouro, estoque e capacidade são conceitos diferentes:
- CG paga salários, obras, importações, manutenção, produção e contratos.
- Estoques físicos sustentam produção, sociedade e forças militares.
- Capacidade logística limita quanto consegue chegar ao destino mesmo com dinheiro e estoque suficientes.
- A produtividade só cresce após investimento com prazo de conclusão e manutenção posterior.
Nenhum estoque pode ficar negativo. Insuficiência resulta em entrega parcial, atraso, desabastecimento ou penalidade explícita; nunca criar recursos do nada.

## 5. Orçamento com escolhas, não microgerência
**Proposta de quatro prioridades orçamentárias permanentes:** serviços e estabilidade interna; infraestrutura e indústria; defesa e manutenção; diplomacia/comércio/instituições.
O jogador define uma orientação (baixa, normal, alta) por prioridade, com visualização imediata de custo e risco. O motor mantém essa política até nova decisão.
Reformas/investimentos estruturais são ordens com custo imediato, custo de manutenção, prazo e retornos esperados. Proposta anterior mantida: até **duas grandes decisões políticas/econômicas por turno**; mudar um orçamento dentro da janela pode contar como uma dessas decisões, a validar na UX.
Toda despesa exibe previsões em três horizontes: agora, próximo turno e médio prazo. Mostrar receita bruta separada de saldo após obrigações.

### Exemplo de escolha
Um país aumenta a prioridade de defesa. Treina reservas e eleva prontidão no médio prazo, mas aumenta manutenção e reduz folga para infraestrutura. Se faltar energia ou material militar, dinheiro não vira munição instantaneamente.
Outro país investe em corredores logísticos: retorno econômico lento em tempo de paz, mas melhora o acesso a suprimentos em uma guerra futura.

## 6. Receita, produção e consumo por turno
**Receita líquida estimada = arrecadação doméstica + receita comercial + transferências recebidas − manutenção civil − manutenção militar − serviço da dívida − compromissos de tratados.**
A arrecadação é influenciada por produção nacional, estabilidade, infraestrutura e comércio; a fórmula exata será especificada e testada posteriormente.
Cada região tem especialização produtiva e gargalos. Não precisa produzir tudo. O comércio e o planejamento são necessários.
A produção/consumo de alimentos, energia, insumos e material militar são calculados separadamente, de modo que uma ruptura comercial tenha consequências observáveis e coerentes.
Infraestrutura danificada ou bloqueada reduz **capacidade efetiva**, não apaga estoques que ainda estão em outros depósitos.
Transferências internacionais não geram novas unidades por serem assinadas: a transferência debita uma contraparte, credita a outra e respeita capacidade e prazo.

## 7. Comércio, tratados, sanções e empréstimos
- **Acordo comercial:** recurso, quantidade por turno, duração, preço CG, rota e origem/destino. Efetivação apenas com aceitação das partes e disponibilidade real.
- **Ajuda ou empréstimo:** tesouro da origem é debitado, destino recebe; empréstimo estabelece principal, taxa, parcelas e vencimentos. Não criar dinheiro sem contrapartida.
- **Sanções:** reduzem acesso a mercados ou capacidade de transporte em rotas; geram custos ao sancionador e efeitos diplomáticos; não bloqueiam arbitrariamente toda a economia.
- **Passagem logística:** autoriza trânsito de suprimento ou forças conforme cláusulas e capacidade de rota; revogação/violação gera eventos com regras claras.
- **Atraso e quebra de obrigação:** aparecem no relatório, alteram reputação/confiança e podem criar dívida ou medidas previstas no acordo.
- **Mercado externo neutro:** opção limitada de importação/exportação com custo, prazo e teto por turno. Evita que falta de jogadores gere paralisação total, sem substituir diplomacia entre países.
- **Preços:** tabela inicial de cenário com ajustes moderados de escassez e comércio, não mercado de alta frequência; nunca permitir arbitragem de compra e revenda infinitas no mesmo turno.

## 8. Dívida, crise e recuperação
Tesouro insuficiente não elimina o país instantaneamente. Há gradação: atraso de obra, corte de gastos discricionários, inadimplência contratual, perda de confiança, desgaste da estabilidade e incapacidade de manter forças.
Limitar endividamento com teto atrelado à capacidade fiscal e custo crescente; bloquear ciclos de empréstimos entre aliados que gerem pontuação fictícia.
Uma crise tem saídas: renegociação, redução militar, reforma fiscal, ajuda condicionada e pactos comerciais.
Nenhuma decisão económica cria vitória imediata por pagar CG entre contas aliadas.

## 9. Economia da guerra e logística militar — integração obrigatória
Cada formação militar consome CG de manutenção, energia/combustível, alimento, munição/material e capacidade de transporte. Treinamento, mobilização, deslocamento e combate têm consumos diferentes.
**Prontidão operacional não é igual a efetivo no papel.** Falta de suprimento reduz mobilidade, fogo, moral e recuperação; manutenção ruim aumenta falhas do equipamento; indústria e rotas condicionam reforços.
Combates afetam perdas de efetivo, equipamentos, estoques, infraestrutura e confiança política. Ocupação cobra guarnição e manutenção; conquistas não convertem imediatamente recursos nem receita a 100%.
Movimentos devem respeitar topologia das rotas, fronteiras, permissões e capacidades por turno; financiamento não permite teletransporte logístico.
O relatório da guerra deve explicar custos e causas, sem expor informações militares sigilosas de outra nação.

## 10. Condições de vitória — sucesso de governo, não só território
**Proposta: pontuação multicritério ao fim da campanha, total de 100 pontos por país:**

| Pilar | Peso | Critério resumido |
|---|---:|---|
| Prosperidade e responsabilidade fiscal | 25 | evolução da capacidade econômica, serviços sustentáveis, reservas e dívida manejável |
| Governo e estabilidade | 20 | legitimidade, estabilidade e cumprimento consistente de políticas |
| Diplomacia e confiabilidade | 25 | influência, acordos cumpridos, mediação e relações duráveis |
| Segurança e soberania | 20 | defesa, prontidão e preservação de território com custo viável |
| Objetivos nacionais | 10 | metas específicas e transparentes do cenário para cada país |

Cada pilar tem escore **0 a 100**, multiplicado por seu peso. Resultado = soma dos cinco componentes.
O escore não compara produção bruta de um país com outro: usa progresso perante objetivos de cenário, indicadores per capita/por capacidade e resultados relativos à condição inicial.
Os objetivos nacionais são diferentes, mas têm **dificuldade e potencial de pontuação equivalentes**, auditados em simulações de balanceamento.

### Regras antiexploração e de justiça
- Não há pontos de vitória diretamente por número de guerras declaradas, unidades destruídas ou área conquistada.
- A soberania inclui capacidade de defesa, mas evitar uma guerra por diplomacia eficaz não reduz automaticamente a pontuação.
- Conquistar região oferece capacidade/posição estratégica real, porém com custos de controle, diplomacia e manutenção; seu valor é contextual e indireto.
- Ficar completamente sem capacidade de governar aciona processo de crise/intervenção ou transição conforme regras, **não um game over súbito** sem aviso.
- Tratados recíprocos feitos apenas para gerar pontos são inelegíveis para pontuação repetida; avaliar benefício executado e custos reais.
- Pontuações não podem ser transferidas entre jogadores nem duplicadas pela criação de campanhas ou mudança de dono da nação.
- Todas as pontuações finais precisam de detalhamento, fonte e versão da regra; a revisão das fórmulas não pode ocorrer no meio de uma campanha sem migração transparente.

**Empate:** primeiro mais pilares acima de 60, depois mais pontos em objetivos nacionais, persistindo empate declara-se liderança conjunta. Critérios ainda sujeitos a teste.
**Vitória antecipada:** nenhuma por mera captura de capital ou país. Capitulação/ocupação é resultado político-militar e não implica automaticamente vitória na campanha.
**Tempo de campanha:** 40 turnos é proposta de teste, não regra fixada.

## 11. Exemplo comparável (valores hipotéticos, não saldo inicial)
Um governo com economia sólida, alianças confiáveis e pouca expansão territorial pode chegar à liderança. Um governo militarmente vencedor mas endividado e politicamente instável pode perder pela soma dos pilares.
A interface explica os componentes em vez de exibir apenas uma posição. Exibir previsões aproximadas de pontuação, com aviso de incerteza para efeitos de guerra, inteligência e metas ainda abertas.
Não transformar o placar num guia para manipular métricas; marcos e resultados causais importam mais do que repetir ações baratas.

## 12. Critérios de aceitação e testes de economia
1. Aumentar orçamento militar eleva custo e depende de suprimentos; não produz força ilimitada.
2. Um país sem alimento/energia não mantém normalidade apenas por ter créditos.
3. Tratado de comércio debita origem, credita destino e respeita rotas/prazos.
4. Repetir a resolução de turno não gera CG, material ou pontos duplicados.
5. Sanção altera o fluxo comercial e afeta também o sancionador quando há interdependência.
6. Forças isoladas sofrem queda de efetividade, coerente e explicável.
7. País menor com estratégia diplomática/econômica eficiente pode superar país maior; ranking não favorece tamanho por padrão.
8. Criar acordos falsos, depósitos cruzados, capitular em sequência ou mobilizar e desmobilizar repetidamente não gera pontos infinitos.
9. Falha durante o processamento do turno não debita gastos parcialmente nem entrega recursos duas vezes.
10. Todas as decisões têm impacto mostrado ao jogador e trilha auditável no backend.

## 13. Decisões para validar antes de implementar
- Confirmar se os pilares de vitória e pesos 25/20/25/20/10 são adequados.
- Confirmar 40 turnos de 12h e nível de competitividade da campanha.
- Fixar quais metas nacionais serão justas para os oito países.
- Definir o primeiro conjunto de equipamentos militares, prontidão e coeficientes de logística.
- Definir políticas de inatividade, substituição de jogadores e capitulação.
- Detalhar fórmulas e tabelas de balanceamento em especificação própria antes de escrever o motor.
- Prototipar no celular as telas de orçamento, tratados e placar, sem backend.

**Próxima entrega recomendada:** especificação do motor militar e dos seus testes de simulação em dois países.
**Restrições:** não programar nem fazer deploy antes de validar o projeto e a navegação mobile.
