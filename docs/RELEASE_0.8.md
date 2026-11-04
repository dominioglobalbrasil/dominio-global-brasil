# DOMÍNIO GLOBAL — CAMPANHA BRASIL v0.8

**Natureza da atualização:** mecânicas de apoio militar, sem reformulação estética nem publicação online.

## Novidades implementadas

### Instalações militares

| Instalação | Níveis | Custo por nível | Conclusão | Finalidade |
|---|---:|---|---:|---|
| Aeródromo militar | 0–2 | 520 créditos + 125 aço + 50 energia | 4 turnos | Permite missões aéreas; nível 1 = até 2 fronteiras, nível 2 = até 3 fronteiras |
| Bateria de artilharia | 0–2 | 370 créditos + 95 aço + 28 combustível | 3 turnos | Permite bombardeios a estados inimigos vizinhos |

As instalações são específicas de cada estado e requerem propriedade e recursos suficientes. Uma obra por instalação em cada estado; o servidor bloqueia duplicações e níveis acima do limite. Conquistas podem danificar instalações capturadas.

### Missões especiais (calculadas no servidor)

| Missão | Requisitos | Custo da ordem | Duração | Alcance |
|---|---|---|---|---|
| Missão aérea | Aeródromo 1+, guerra declarada, de 2 a 12 aeronaves | 32 combustível + 8 por aeronave + 18 energia | 2 turnos | 1 + nível do aeródromo, em fronteiras |
| Bombardeio de artilharia | Bateria 1+, guerra declarada, de 4 a 24 peças | 22 aço + 2 por peça + 12 combustível | 1 turno | Apenas estados vizinhos |

As unidades usadas são retiradas da guarnição ao receber a ordem, reservadas enquanto a missão está em andamento e devolvidas na conclusão, sujeitas a perdas defensivas. O cálculo combina quantidade, suprimento na origem, suprimento nacional no momento do impacto, nível da instalação e resistência defensiva. O dano é distribuído entre as cinco classes de tropas do alvo.

As missões **não ocupam territórios**, nem declaram guerras automaticamente. A ocupação continua dependendo das operações terrestres e da infantaria. O servidor rejeita ataques a estados neutros, próprios, fora de alcance ou sob cessar-fogo. Caso uma negociação encerre a guerra durante a missão, ela é cancelada no impacto e as unidades retornam. Para impedir ordens duplicadas, só pode existir uma missão do mesmo tipo por estado de origem por vez.

### Interface e organização

- **Exército → Missões especiais**: tela própria com instalações, guarnições e botões de missão por estado.
- **Construções → Aeródromos / Baterias**: novas abas separadas das bases logísticas, fortificações e indústrias.
- Cada missão tem sua própria janela para seleção de alvo, quantidade e custos recalculados antes de confirmar.
- **Exército → Ordens ativas** mostra operações aéreas e de artilharia, as unidades destacadas e os turnos restantes.
- **Janela do estado** disponibiliza atalhos de construção e de operações separados.

### Migração de campanhas

- O schema passa de versão **5 para 6**.
- As campanhas anteriores são migradas; aeródromos e baterias entram no nível zero, sem mexer em tropas, diplomacia, recursos ou construções existentes.
- Antes de migrar, o servidor gera backup do JSON anterior (`*.backup-v5` ou da versão carregada).
- Missões pendentes de uma campanha v0.8 permanecem pendentes após recarregar o salvamento.

### Testes verificados nesta entrega

- `npm test`: **53 testes aprovados**, cobrindo 41 testes anteriores + 12 específicos de v0.8.
- `python tests/browser_smoke_v08.py`: navegação geral e integração com servidor no desktop e mobile.
- `python tests/browser_support_smoke.py`: instalação de janelas, seleção de alvos, custos, ordens de missões aéreas e de artilharia no desktop e mobile, com persistência real via servidor HTTP.

## Limitações importantes

- O alcance é calculado por **fronteiras entre UFs**, não por quilômetros, radares reais ou espaço aéreo real.
- As missões são abstrações de jogo, não simulações militares realistas. Ainda não há interceptação tática, munição por depósito, bases aéreas de manutenção, alerta antecipado ou alcance por tipo de aeronave.
- O mapa ainda usa estados como territórios únicos, e não setores ou municípios.
- Não há lobby, autenticação definitiva, IA, antitrapaça, banco transacional multi-instância ou deploy público.
- A UI permanece provisória, seguindo a decisão de priorizar regras e estabilidade.
- Os tempos padrão do protótipo são acelerados apenas para testes e não representam os do lançamento.
