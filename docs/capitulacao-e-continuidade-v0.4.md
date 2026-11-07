# ESTATUM — Capitulação por pressão, rendição, resistência e continuidade v0.4

**Data:** 07/11/2026
**Campanha:** Crise Sul-Americana — 2030; países reais, acontecimentos fictícios.
**Decisão 04 APROVADA:** modelo C: capitulação por pressão, com direito de resistir, negociar ou render-se, e processo formal de capitulação imponível diante de colapso comprovado e prolongado.
**Importante:** os direitos gerais, o modelo C e a continuidade do jogador estão aprovados. Os valores numéricos, duração das fases, penalidades e limites concretos abaixo são **propostas de balanceamento**, não decisões finais do usuário.
**Não há motor executável, partida multiplayer ou deploy decorrente deste documento.**

## 1. Objetivo da capitulação

Derrotar um exército não deve eliminar imediatamente um jogador nem transformar o país vencedor em proprietário de toda a nação derrotada. No ESTATUM, capitulação significa que um Estado perdeu a capacidade de sustentar a guerra **sob condições formais e auditáveis**. É distinta de controle militar, ocupação administrativa, soberania e derrota na classificação da campanha.

O modelo preserva tanto a possibilidade de vitória militar decisiva quanto a relevância da diplomacia, da economia, da reconstrução e da gestão de governos enfraquecidos.

**Princípios inegociáveis estabelecidos pela Decisão 04:**
- Não há capitulação automática por perda isolada da capital, derrota em uma batalha ou ocupação de uma região.
- O jogador em dificuldades pode optar entre resistência, propostas de paz, mediação, aceitação de rendição e reestruturação de sua capacidade.
- Imposição sem consentimento somente por **colapso prolongado, verificável, com prévia notificação, janela para reagir e processo configurado antes da campanha**.
- Capitulação não transfere automaticamente soberania, caixa nacional, todas as forças ou todas as regiões ao vencedor.
- A continuidade do jogador é preservada por regras explícitas; não se expulsa automaticamente da campanha por perder a guerra.

## 2. Avaliação de pressão (proposta para testes)

Cada país em guerra possui `capitulationPressure` de 0–100 como **indicador estratégico agregado**, atualizado no ciclo governamental de 12 horas. Não é a soma direta de baixas nem porcentagem de mapa conquistado.

### Domínios que devem entrar no indicador

1. **Integridade militar:** capacidade *relativa* de organizar forças utilizáveis, reserva e manutenção em comparação com a estrutura inicial e necessidades defensivas do país.
2. **Controle administrativo:** proporção ponderada de pontos estratégicos e capacidade de administrar regiões, não quantidade bruta de quilômetros quadrados.
3. **Sustentabilidade econômica:** capacidade efetiva de manter serviços, suprimentos, produção e pagamentos essenciais, sem presumir que nações menores são mais frágeis.
4. **Continuidade institucional:** existência de autoridade funcional, capacidade de executar decisões e acesso à administração; perder a capital eleva risco, não define derrota instantânea.
5. **Apoio internacional e possibilidade de recuperação:** cessar-fogo, mediação, ajuda pactuada e recuperação material efetiva podem reduzir a pressão. Promessas vazias não anulam evidências de colapso.

**Proposta de regra de acionamento:** um procedimento compulsório só pode abrir quando houver **pelo menos dois domínios independentes em colapso crítico**, evidência de incapacidade prolongada de sustentar a guerra e superação de um limite configurado de pressão por uma duração mínima.

Não somar o mesmo fato duas vezes: perda de um depósito pode afetar suprimento e economia, mas o motor deve usar critérios e pesos que evitem tratar o mesmo efeito como múltiplos colapsos.

### Faixas indicativas (SOMENTE propostas)

| Pressão | Estado visual | Consequência |
|---|---|---|
| 0–39 | Operacional | Nenhuma ameaça de capitulação iminente |
| 40–69 | Sob pressão | Alertas e recomendação de negociação ou recuperação |
| 70–84 | Crise de guerra | Incentivo a cessar-fogo, reorganização e proposta de paz |
| 85–100 | Risco extremo | Pode habilitar investigação de colapso, **não impõe rendição por si** |

**Hipótese de teste:** persistência de 4 fechamentos governamentais consecutivos (48 horas) e janela posterior de resposta. Esses prazos são **parametrizáveis e ainda não aprovados**. Reavaliar o tempo para uma campanha com duração curta. Pequenas flutuações devem ter histerese para evitar notificações repetidas.

## 3. Fluxo formal do sistema

```text
GUERRA EM ANDAMENTO
    |
    +--> Rendição voluntária proposta pelo governante
    |         |
    |         +--> Termos/aceitação e ato formal de capitulação
    |
    +--> Aumento persistente da pressão
               |
          ALERTA DE CRISE
               |
          COLAPSO VERIFICADO (critérios objetivos)
               |
          ABERTURA DO PROCEDIMENTO
               |
          NOTIFICAÇÃO + JANELA DE RESPOSTA
               |
     +---------+----------+------------------+
     |                    |                  |
 RESISTIR/RECUPERAR    CONTRAPROPOR      ACEITAR TERMOS
     |                    |                  |
 PRESSÃO DIMINUI?     NEGOCIAÇÃO        CAPITULAÇÃO
     |                    |
     |          ACORDO / MEDIADOR / PRAZO
     |
    NÃO + prazo cumprido + rechecagem objetiva
               |
         DECISÃO FORMAL DO MOTOR
               |
        CAPITULAÇÃO COMPULSÓRIA LIMITADA
               |
        REGIME PÓS-GUERRA E CONTINUIDADE
```

**Uma notificação não é capitulação.** O processo pode ser suspenso, encerrado, retomado ou convertido em tratado, conforme fatos objetivos e ações registradas. A regra de adiamento e reentrada deve impedir tanto a extinção arbitrária quanto o abuso de propostas vazias para protelar indefinidamente.

## 4. Opções do jogador sob pressão

### A. Continuar resistindo
- Pode manter defesa, recuar, reorganizar forças, priorizar suprimento e negociar apoio.
- O custo de prosseguir uma guerra difícil é real e não pode ser neutralizado por inatividade.
- Se houver recuperação concreta antes da decisão formal, o procedimento fica suspenso/encerrado de acordo com os limites de pressão.
- Resistência não dá imunidade nem cria recursos inexistentes.

### B. Negociar
- Solicitar cessar-fogo, mediação, garantias de segurança, retirada por etapas, limites de armas, reparações ou tratado de paz.
- Propostas estruturadas possuem validade, contrapropostas, requisitos de aceite e efeitos auditáveis.
- A trégua só passa a valer na hora definida após aceitação; enviar proposta não congela a guerra.
- Negociação de boa-fé pode suspender certos prazos **se previsto nas regras**, com limite para evitar abuso.

### C. Rendimento voluntário
- O governante pode oferecer capitulação antes de atingir o limite compulsório.
- O pedido abre fluxo de termos e confirmação; não constitui transferência instantânea de soberania.
- O ato de capitulação pode estabelecer cessação das hostilidades, limitações temporárias, reparações e compromissos políticos, dentro dos limites de cenário aprovados.
- **Nenhum jogador pode impor a outro uma cessão arbitrária apenas por ter maior pontuação militar.**

### D. Intervenção formal após colapso
- Exige evidência persistente, notificação, prazo, reavaliação dos indicadores e decisão transacional.
- O derrotado não precisa aprovar **o início** do processo se todas as condições pré-publicadas foram atendidas; não pode escapar dele apenas deixando a conta inativa.
- O resultado **não será decidido unilateralmente** pela interface do vencedor. Cláusulas compulsórias permitidas, limites territoriais, reparações máximas e duração devem estar definidos antecipadamente e sujeitos a auditoria.
- Se os parâmetros da campanha não estiverem aprovados, a capitulação compulsória **não pode ser ativada no motor**.

## 5. Consequências de uma capitulação (modelo aprovado + limites propostos)

Possibilidades delimitadas pelo regulamento:
- Fim das operações ofensivas e entrada em vigor de um cessar-fogo ou paz.
- Retirada de forças de pontos determinados em prazo definido.
- Reparações limitadas ao que a economia consegue suportar, com proibição de impostos impossíveis e exploração de perdas infinitas.
- Desmilitarização temporária ou limite de prontidão/produção quando estipulado em cláusula válida.
- Garantias de passagem e segurança ou administração temporária de pontos definidos.
- **Cessão territorial somente quando existir base jurídica expressa, identificando território exato, data, signatários e mecanismo de transferência.** Nem rendição voluntária nem imposição dão anexação irrestrita.
- Restituição ou fim de ocupação, indenização, garantias internacionais e normalização gradual podem integrar o mesmo acordo.

**Proposta de limite:** o sistema de imposição deve priorizar **encerramento da guerra, segurança e obrigações proporcionais**; anexação territorial compulsória exige um conjunto estreito e pré-aprovado de cláusulas, com proteção da continuidade do país derrotado. Definir o teto de reparações, extensão territorial cedível e prazo de restrições em decisão própria.

## 6. Como o jogador derrotado continua jogando

**Diretriz aprovada:** perder uma guerra não elimina automaticamente o usuário da partida.

### Situações possíveis
- **Derrotado, mas ainda soberano em território remanescente:** jogador continua controlando orçamento, políticas, diplomacia, reconstrução e forças permitidas pelos termos. Metas de prosperidade, recuperação, estabilidade e relações ainda importam.
- **Território parcialmente ocupado:** administra as áreas que restam, negocia recuperação, mantém instituições e reestrutura economia; regiões ocupadas e soberania têm estados separados.
- **Ocupação quase total:** abre um modo de **continuidade governamental** simplificado, sem inventar cidades ou recursos. O jogador mantém representação diplomática, histórico de atos e ações permitidas pelos tratados e regulamento. Esse modo é **proposta de design**, precisa de limites e condições de restabelecimento aprovados.
- **Soberania formal inteiramente extinta por evento legal de cenário:** caso excepcional e ainda não regulado. Não assumir que o jogador passa a governar o país vencedor ou ganha ações sem território; a continuidade da participação/transferência deve ser objeto de regra específica antes de sua introdução.

### Ações pós-capitulação
- Elaborar orçamento de reconstrução, recuperar infraestrutura e reativar produção.
- Negociar renegociação de reparações, repatriação e garantias.
- Estabelecer relações diplomáticas e alianças permitidas.
- Restaurar estabilidade e, quando permitido, gradualmente recompor capacidade de defesa.
- Cumprir metas de campanha que não dependam de guerra.
- Participar dos relatórios, ranking, histórico e encerramento da campanha.

### Jogo justo
- Não deixar o derrotado totalmente imobilizado por muitos dias: ao menos uma ação estratégica relevante deve permanecer disponível em cada ciclo.
- Não dar a ele um bônus automático de retorno que anule a vitória adversária.
- Não permitir que a vitória sobre um país transfira a conta, a identidade do jogador ou o seu inventário.
- Penalidades temporárias exigem prazo final, condição verificável de extinção ou mecanismo de revisão; não prender o derrotado em bloqueio permanente sem saída.
- Países menores recebem regras proporcionais: cair em crise não pode depender apenas do volume absoluto do PIB, soldados ou mapa.

## 7. Pontuação e vitória na campanha

A **vitória militar** pode ser reconhecida no resultado de uma guerra sem ser automaticamente **vitória na campanha**. Outros países continuam jogando. A pontuação geral por política, economia, diplomacia e objetivos nacionais deverá levar em conta custos, compromissos e estabilidade.

O derrotado mantém possibilidade de obter pontos por reconstrução, tratados, melhoria econômica e metas compatíveis com a situação. Limites de vitória e pesos finais pertencem à especificação econômica e de pontuação, ainda em aprovação.

A consolidação de resultados acontece por ciclo de governo de 12h, mas eventos diplomáticos podem vigorar em momentos definidos e os microciclos militares continuam ocorrendo enquanto não houver cessar-fogo eficaz.

## 8. Integração com o tempo híbrido e a diplomacia

| Fato | Processamento | Garantia |
|---|---|---|
| Movimento/combate/retirada | Microciclo militar, duração exata ainda pendente | Não declara capitulação |
| Controle dos pontos e perdas | Microciclo militar, com eventos próprios | Não altera soberania automaticamente |
| Pressão de capitulação | Fechamento de 12h, a partir de eventos do período | Agregação sem contagem dupla |
| Alerta / início do procedimento | Após constatação sustentada | Notificação clara e auditável |
| Resposta / proposta / aceite | Continuamente | Autorização e prazos próprios |
| Cessar-fogo | Na vigência contratada | Rejeita ordens ofensivas posteriores incompatíveis |
| Decisão formal de capitulação | Serviço jurídico-político do jogo | Condições verificadas antes de escrever o resultado |
| Mudança de soberania | Apenas por ato jurídico-político com cláusula territorial | Territórios explícitos, sem propagação |
| Reconstrução | A cada 12h e nas interações previstas | Mantém continuidade do jogador |

## 9. Modelo de dados e permissões

Entidades propostas:
- `war_participant_status`: guerra, colapso, pressão, histórico e elegibilidade à capitulação.
- `capitulation_assessment`: campanha, país, fechamento, fontes, domínios, pesos/versionamento, pressão, evidências e hash do snapshot.
- `capitulation_case`: estado do processo, abertura, janelas, notificações, recursos e resultado.
- `surrender_terms`: condições formalizadas, cláusulas permitidas, prazo, signatários e validação.
- `ceasefire`: estado, vigência, restrições e histórico.
- `postwar_regime`: restrições e direitos de continuidade, calendário de obrigações e expiração.
- `sovereignty_transfer`: objeto territorial específico, base jurídica, versão, data e evento de vigência.
- `country_player_role`: vinculação segura do jogador ao país, sem remoção automática por capitulação.

Estados de processo propostos:
`none → warning → eligible → notified → negotiation|resistance|voluntary_surrender → resolved|recovered|cancelled`.

Regras de sistema:
- Todos os atos exigem `campaignId`, `countryId`, `ruleVersion`, `eventId`, `effectiveAt` e trilha de autoria.
- A avaliação usa dados privativos no servidor; a interface só mostra informação pública ou a que o jogador tem direito.
- Somente a função de **resolução formal** altera regime pós-guerra e, se expressamente autorizado, invoca transferência territorial.
- Não pode haver duas capitulações concorrentes ou duas transferências sobre o mesmo objeto em versões conflitantes.
- Processamento idempotente e retomável: repetir job não duplica sanção, reparação, transferência ou pontuação.
- Inatividade deve obedecer protocolo pré-publicado; nunca substituir falta de resposta por assinatura fictícia.

## 10. Interface mobile necessária

### Painel "Situação de guerra"
Mostrar pressão com **explicação das causas**, sem porcentagem de vitória falsa. Exemplos: "prontidão militar comprometida", "parte da administração regional paralisada", "capacidade de suprimento reduzida". Avisos por estado: *Sob pressão*, *Crise de guerra*, *Procedimento de capitulação aberto*.

### Tela "Termos e negociação"
Acesso isolado, com quem propôs, cláusulas, efeitos territoriais precisos, reparações, prazos, consequências e opções **resistir / apresentar contraproposta / pedir mediação / aceitar termos**. Nenhuma função destrutiva deve depender de um toque acidental.

### Tela "Reconstrução nacional"
Quando capitulado: recursos disponíveis, restrições temporárias, obrigações, prazos e ações permitidas por turno. Exibir claramente o que o jogador **ainda pode fazer**.

### Mapa
Separar cor da **soberania** de hachuras de **ocupação**, com pontos e áreas contestadas. Não pintar automaticamente todo o país na cor do vencedor.

## 11. Testes de aceitação obrigatórios

1. Perder a capital isoladamente não capitula nem altera soberania.
2. País pequeno e país grande sob impactos proporcionais são tratados de modo comparável.
3. Sofrer várias derrotas que repercutem no mesmo suprimento não multiplica pressão sem limite.
4. Pressão extrema em apenas um fechamento não ativa imposição sem persistência.
5. Recuperação comprovada durante janela de resposta interrompe ou suspende o procedimento segundo regra configurada.
6. Jogador ativo pode resistir, aceitar, negociar e pedir mediação; todas têm resultado previsível e registrado.
7. Jogador ausente não assina tratados por silêncio, mas não bloqueia eternamente processo compulsório objetivamente válido.
8. Capitulação negociada não transfere território ausente das cláusulas.
9. Capitulação imposta só pode criar cláusulas dentro de catálogo/tetos aprovados.
10. A capitulação não transfere automaticamente todo o caixa ou forças de um país.
11. Tratados de paz interrompem ações ofensivas incompatíveis a partir da vigência, sem apagar histórico anterior.
12. A mesma transação processada duas vezes não duplica sanções, eventos ou anexações.
13. Derrotado com território preservado consegue utilizar Governo, Economia e Diplomacia.
14. Ocupação parcial e capitulação são coerentes com informação secreta e não vazam posições.
15. País com ocupação quase total acessa modo de continuidade apenas se aprovado, sem renda/recursos fictícios.
16. Todas as limitações de pós-guerra possuem prazo, condição de revisão e informação visível.
17. Teste com seis a oito jogadores comprova que uma guerra encerrada não fecha a campanha inteira.
18. É possível auditar: por que o procedimento começou, quais requisitos permaneceram válidos e quem aprovou cada termo.

## 12. Propostas ainda dependentes de decisão

- **Critérios numéricos:** pesos dos domínios e gatilho de pressão; valores e mecanismos antiabuso.
- **Prazo mínimo de colapso e notificação:** hipótese 48h/4 ciclos, pendente.
- **Poder do vencedor:** catálogo de cláusulas compulsórias, teto de reparações, cessões territoriais e duração de restrições.
- **Ocupação integral e continuidade excepcional:** limites do modo de representação de governo sob ocupação total.
- **Número de microciclos militares:** **30 minutos aprovados em 07/11/2026**, conforme [especificação v0.5](ciclos-militares-e-ordens-v0.5.md).
- **Peso da derrota e reconstrução na pontuação da campanha:** pendente.

**Regra de implementação:** não ativar capitulação compulsória antes da aprovação dos parâmetros e testes de invariantes. Nenhum deploy autorizado por esta documentação.
