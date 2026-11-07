# Regras do ciclo de governo e do turno — v0.1

**Projeto:** Simulador de Diplomacia e Política.
**Campanha de referência:** Crise Sul-Americana — 2030 (história alternativa com países reais).
**Estado:** proposta para discussão; números são parâmetros ajustáveis, não decisões definitivas.
**Atualização oficial de 07/11/2026:** foi aprovada a **opção C, ritmo híbrido**: política/economia por ciclos de 12 horas, diplomacia contínua e operações militares em ciclos mais curtos. O intervalo militar foi **aprovado como 30 minutos em 07/11/2026 (Decisão 05)**. Detalhes operacionais: [Ciclos militares e ordens v0.5](ciclos-militares-e-ordens-v0.5.md). Ver [Registro de decisões](decisoes-oficiais.md). As descrições antigas de resolução militar apenas a cada turno governamental são propostas anteriores superadas por essa decisão.
**Princípio:** poucos jogadores, máxima qualidade e expansão sem reconstrução.
**Escopo desta fase:** regras e experiência do jogador. Não implementar, publicar ou reutilizar dados do Domínio Global.

## 1. Objetivo de experiência
O jogador deve conseguir governar seu país sem precisar aprender dezenas de menus. Uma sessão rápida deve permitir: ler a situação, fazer decisões políticas, negociar e emitir ordens militares. O jogador que quiser aprofundar-se no sistema militar encontrará logística, comandantes, doutrina e inteligência, mas essas camadas não devem bloquear um principiante.

A campanha inicial terá uma proposta de oito países controláveis e seis a oito jogadores. O mapa pode conter outros países apenas como contexto. A quantidade de países disponíveis é conteúdo de campanha, nunca limite estruturante do sistema.

## 2. Ritmo do jogo
- **Proposta:** turno de 12 horas em tempo real, configurável por campanha.
- **Estados do turno:** Aberto (ordens editáveis) -> Encerramento (congela submissões) -> Resolução (servidor) -> Publicação de resultados -> Próximo turno.
- A interface mostra horário de fechamento, ordens enviadas, compromissos ativos e o impacto estimado.
- Todas as ordens e decisões guardam versão e identificador único; reaplicar um mesmo turno não duplica custos, efeitos ou movimentos.
- A ausência do governante preserva políticas vigentes e posturas militares defensivas previamente estabelecidas; não cria guerras nem acordos em nome do ausente.
- A resolução não depende de o navegador do jogador estar aberto.

### Jornada principal em uma sessão
1. **Gabinete:** relatório da situação (o que mudou desde o turno anterior, riscos e prazos).
2. **Decidir:** propostas políticas/econômicas com custo e possíveis consequências.
3. **Negociar:** responder acordos e ultimatos pendentes; mensagens diplomáticas livres enquanto o turno está aberto.
4. **Comandar:** confirmar ordens a formações militares, com visualização do alcance e riscos estimados.
5. **Revisar:** resumo único de decisões, compromissos e ordens, com edição antes do fechamento.
6. **Receber:** relatório do turno após processamento, dividido entre fatos públicos e informações exclusivas.

## 3. Economia e política interna — simples na tela, conectadas à guerra
Indicadores iniciais propostos:
- **Tesouro:** caixa do governo e compromissos futuros.
- **Receita:** geração por região, comércio e impostos.
- **Estabilidade:** riscos de distúrbio, produção e coesão política.
- **Legitimidade:** capacidade de governar e tolerância a medidas impopulares.
- **Capacidade produtiva:** reposição civil e militar.
- **Influência externa:** poder de negociação; separado de reputação e relações bilaterais.

Todas as decisões terão custo, prazo, impactos diretos e efeitos de segunda ordem. Ex.: elevar gasto militar aumenta prontidão, mas reduz espaço fiscal; sancionar um país atinge suas cadeias de suprimento e pode prejudicar importações nacionais.

**Proposta de limite de burocracia:** até 2 decisões estruturais de governo por turno, com políticas contínuas mantidas automaticamente. Negociação diplomática e emissão de ordens militares não consomem essas vagas. Esse limite é uma escolha de UX, não simplificação das consequências.

Não usar somente um medidor genérico de 'felicidade'. A reação política depende do tipo de medida, condições e grupos afetados, com resultado explicado ao jogador em linguagem objetiva.

## 4. Diplomacia: acordos que o motor cumpre
- O chat diplomático é livre. Somente propostas formalizadas viram efeitos mecânicos.
- Propostas possuem remetente, destinatários, cláusulas estruturadas, prazos, recursos envolvidos e condições de entrada em vigor.
- Tipos iniciais: acordo comercial, passagem/logística, ajuda econômica, pacto de não agressão, defesa mútua, cessar-fogo e paz.
- **Ciclo:** rascunho -> enviada -> contraproposta/aceita/rejeitada/expirada -> em vigor -> cumprida/violada/encerrada.
- Nenhum tratado produz efeitos antes de todas as aceitações exigidas.
- O rompimento gera consequências previstas (reputação, confiança e eventuais obrigações contratuais), não punição arbitrária.
- Acordos podem ter duração e cláusulas de saída. Um cessar-fogo interrompe novas ordens ofensivas incompatíveis a partir de sua vigência, segundo regras explícitas.
- Política e diplomacia não servem apenas de pretexto para a guerra: integração comercial, mediação e estabilidade precisam ser rotas relevantes ao sucesso.

## 5. Ordens militares: fáceis de enviar, profundas de resolver
Ações visíveis: selecionar formação no mapa ou painel, escolher missão, definir objetivo, avaliar suprimentos e confirmar.
Missões militares de primeira prova: manter posição/defender, avançar e retirar; sistemas posteriores podem incluir reconhecimento, bloqueio, interdição, fortificação, apoio, escolta e ataque aéreo.
As ordens são validadas no servidor: autoria, formação, localização, alcance, permissões, custo, capacidade e restrições por tratado.

**Modelo interno previsto por formação:**
- Efetivos e equipamento por categoria; perdas e reposição distintas.
- Experiência, moral, fadiga, prontidão, doutrina e cadeia de comando.
- Munição, combustível, peças, alimentos, manutenção e capacidade logística.
- Localização e deslocamento por rede de regiões/rotas; terreno, clima e linhas de suprimento.
- Conhecimento imperfeito sobre o inimigo, com idade da informação e nível de confiança.

**Resolução em fases:** validação de ordens -> inteligência/reconhecimento -> abastecimento/manutenção -> mobilidade e manobra -> engajamentos simultâneos -> baixas, recuo e captura -> ocupação e efeitos políticos/econômicos.
Resolver todas as ordens com o mesmo snapshot do fechamento. Resultados utilizam aleatoriedade controlada por semente persistida e podem ser reproduzidos durante testes.
Informação pública difere de relatórios privados; o jogo não vaza tropas inimigas escondidas, estoques ou ordens secretas.

**Exigência de profundidade:** tropas numerosas sem suprimento podem perder para força menor melhor abastecida; superioridade tecnológica não anula terreno e manutenção; conquista territorial pode ser insustentável politicamente.

## 6. Resolução conjunta do turno: ordem dos efeitos
1. Travar decisões e registrar um snapshot canônico com versão.
2. Resolver aceitação de tratados e condições de vigência, sem privilégio de quem enviou primeiro.
3. Calcular economia, tributos, produção e manutenção comprometidas.
4. Aplicar políticas, sanções, gastos e mudanças logísticas.
5. Processar inteligência e reconhecer movimentos.
6. Resolver manobras e combates usando os recursos e restrições daquele turno.
7. Apurar perdas, ocupações, desgaste político, relações e obrigações.
8. Persistir transacionalmente o novo estado e o livro de eventos.
9. Publicar boletim geral e relatórios privados de cada nação.

Os detalhes da precedência serão testados com exemplos para evitar paradoxos, como um pacto aceito e um ataque incompatível no mesmo fechamento.

## 7. Exemplo narrativo do turno 1 (não é roteiro fixo)
Brasil recebe proposta de passagem logística e escolhe investir em infraestrutura.
Paraguai analisa acesso à rede comercial e decide negociar garantias.
Argentina recebe uma proposta de integração comercial e contrapropõe financiamento.
Um jogador altera a postura de uma formação na fronteira. Outro destina combustível para garantir prontidão.
Ao fechar o turno, o motor aplica tratados assinados, calcula renda e suprimentos, resolve movimentos militares e emite um relatório: impactos econômicos, relações políticas e situação das frentes.
Nenhum país precisa obrigatoriamente entrar em guerra. Diplomacia pode evitar conflitos custosos.

## 8. Interface mínima exigida
**Cinco áreas principais:** Painel do Governo, Diplomacia, Economia, Defesa e Relatórios.
Mapa contextual acessível na Defesa e na Diplomacia; não fazer uma página interminável com tudo empilhado.
Cada decisão importante exibe: **o que muda, custo, prazo, risco e confirmação**.
Na tela inicial: três assuntos urgentes no máximo, com acesso a detalhes; não exibir números vazios só para preencher painéis.
A experiência deve ser utilizável por toque no celular antes de desenvolver o banco ou motor.

## 9. Estrutura para expansão
Novos países, regiões, recursos, doutrinas, tipos de tratados e unidades pertencem a catálogos versionados por cenário.
Separar simuladores de economia, política, diplomacia e guerra através de contratos de dados e eventos. Um novo sistema não deve exigir reescrever os anteriores.
O backend deve suportar campanhas isoladas, escalonamento de processamento e recuperação segura caso um turno falhe.

## 10. Testes de aceitação obrigatórios antes da alfa
- Dois usuários entram em uma campanha, cada um com seu país.
- Tratado com contraproposta, aceitação, vigência, efeitos e violação demonstrados.
- Ordem militar sigilosa não aparece na API de outro jogador.
- Forças em terreno similar, com suprimento distinto, produzem resultado coerente e explicado.
- Mesmo snapshot, ordens e semente geram o mesmo desfecho.
- Repetir fechamento não duplica custos ou tropas.
- Reinício não apaga o jogo nem executa turno extra.
- Interface de governo e comando funciona em celular sem rolagem horizontal.

## 11. Próximas decisões
1. Fixar duração do turno: 12h proposto versus outro ritmo.
2. Fixar formas de vitória: prosperidade, influência, metas nacionais, pontuação combinada.
3. Definir orçamento e principais recursos do primeiro cenário.
4. Especificar unidades e equipamentos da primeira prova militar.
5. Elaborar o protótipo navegável das cinco telas, sem backend ainda.

**Nenhum código nem deploy autorizado por este documento.**
