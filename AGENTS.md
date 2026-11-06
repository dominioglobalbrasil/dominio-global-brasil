# AGENTS.md — Simulador Diplomacia e Política / Crise Sul-Americana 2030

## LEITURA OBRIGATÓRIA ANTES DE QUALQUER MODIFICAÇÃO OU DEPLOY

**Instrução permanente para assistentes e agentes que trabalham neste repositório.**

1. **Leia este AGENTS.md do início ao fim**, e consulte o protocolo antirrepetição na issue [UNIFA #191](https://github.com/saicurioso/Corinthians/issues/191) ou a cópia na Biblioteca ChatGPT `/Protocolos de Trabalho/PROTOCOLO_OBRIGATORIO_DE_TRABALHO.md`. Se a fonte cruzada não for acessível, não finja que leu: aplique as regras deste arquivo e declare a lacuna.
2. **Recupere o histórico antes de tentar uma solução**: decisões aprovadas, issues/runbooks, commits e contornos que já funcionaram; não faça de novo o que comprovadamente falhou.
3. Confira identidade correta: projeto, conta conectada, branch, deploy de produção, banco, domínio e o que está aprovado. Não confunda projetos nem invente acessos.
4. Diferencie **proposta, código, commit, CI, preview, deploy READY, domínio oficial e teste funcional real**; não anuncie conclusão baseada apenas em etapa intermediária.
5. Teste alterações no código real, fluxos ponta a ponta, regressões entre telas/rotas, permissões, financeiro virtual e **mobile**. Nunca diga que testou o que não testou.
6. Evite deploys e alterações desnecessários: agrupe correções, valide antes, não altere banco, configurações ou produção sem autorização para esse escopo; em auditoria, somente leitura.
7. Se bloqueado (403, 404, conexão), procure o **contorno registrado** antes de pedir reconexão ou repetir a chamada. Se necessário, explique o impedimento sem supor solução.
8. Toda nova falha recorrente: documente sintoma, causa, alternativa que funcionou, evidência de validação e prevenção. Relate status atual com precisão.


## Guardrails específicos

- O antigo **Domínio Global — Brasil foi encerrado em 04/11/2026**. O repositório atual `dominioglobalbrasil/dominio-global-brasil` agora é o planejamento do novo simulador, cenário alternativo **Crise Sul-Americana, 2030**. Não reativar o jogo antigo, nem tratar o mapa Brasil 27 UFs como escopo atual.
- Antes de alterar, leia `README.md` e os documentos em `docs/`, incluindo documento fundador, cenário, governo/turnos, economia, vitória e motor militar.
- **O site atual é uma prévia visual sem backend.** Nunca dizer que política, economia, diplomacia e guerra reais já funcionam porque a página renderiza.
- Priorizar experiência de jogo mobile, organização por janelas dedicadas e arquitetura escalável para poucos jogadores. Respeitar decisões aprovadas mais recentes.
