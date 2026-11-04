# v0.7 — Bases, rede logística e inteligência privada

## Mudanças implementadas

1. **Salvamento v5.** Novos campos de `base`, `supplyDistance` e `intelligence`. Migração automática da versão v4, mantendo composição de unidades, operações, jogadores e diplomacia. Backup `*.backup-v4` antes da conversão no servidor.
2. **Construção de bases.** Níveis 0-3, custos em créditos, aço e energia, resolução em 4 turnos. Verificações de posse, recursos e duplicação; obra não é entregue após perda do território.
3. **Abastecimento local.** BFS pelas fronteiras de estados de uma mesma facção, com fontes em sua capital se ainda for controlada e nos territórios com base nível >=1. O teto logístico cai com a distância. Sem caminho, o teto cai a 40%. Consumo nacional por turno permanece intacto.
4. **Efeito nas batalhas.** Defesa recebe bônus pela base e ataque passa a respeitar o suprimento da origem capturado no lançamento da operação; a base conquistada sofre redução de nível.
5. **Reconhecimento com drones.** Missão de 2 turnos, exige base, drones, vizinhança hostil e recursos. O resultado é uma fotografia privada do inventário e infraestrutura adversários; expira em 6 turnos. A missão não causa dano nem declara guerra.
6. **Interface.** Aba Construções → Bases militares; Exército → Logística por estado e por conexão; Inteligência → Fronteiras / Relatórios privados / Missões em andamento; janelas de ordem separadas.

## Limitações

- Centros logísticos são abstratos: ainda não existe mapa de rodovias, rotas comerciais, ferrovias ou combustível por comboio.
- A observação por drones é uma abstração do jogo; não há detecção nem contraespionagem.
- Não há várias partidas independentes, contas persistentes ou partidas hospedadas.
- O layout é propositalmente temporário. As imagens de referência do visual aprovado ainda não foram reproduzidas fielmente.

## Próximo pacote sugerido — v0.8

- Missões especiais de aviação e artilharia com regras de custo, alcance e combate próprias.
- Construções aeroportuárias, instalações terrestres e limitações de efetivo por nível.
- Melhor modelo de suprimentos com infraestrutura e rotas logísticas interrompidas pela guerra.
- Auditoria de ações, recuperação de campanha e limites antiespionagem/antiabuso.

**Critério de aceite:** regras executadas no servidor, sem vazamento de inventários inimigos, compatibilidade com os salvamentos anteriores e testes no desktop/mobile antes de qualquer publicação.
