# Homologação online v0.13.1

**Estado:** pacote preparado e testado localmente; não implica que exista URL online. O serviço não foi publicado.

O projeto usa `node:sqlite` e o motor de turnos depende de um processo Node contínuo, com **uma única instância**, armazenamento persistente e HTTPS. O blueprint `render.yaml` configura um web service com disco em `/var/data`, cookies Secure, validação de convite e health check. É necessário escolher uma conta Render, conectar um repositório Git e confirmar o plano/disco (podem gerar custos). Não hospedar este servidor em funções serverless nem usar a camada Free com disco efêmero: isso pode apagar contas e partidas.

## Para colocar em homologação (sem divulgar antes dos testes)

1. Criar um repositório exclusivo para este projeto (sem pastas `.data`, `.sqlite`, segredos ou dados de jogadores).
2. Conectar Render e autorizar a implantação a partir desse repositório.
3. Conferir o plano com disco persistente, região, gastos e `render.yaml` antes de criar serviço.
4. Definir `DG_INVITE_CODE` privado com ao menos 16 caracteres na configuração do serviço. Não colocar o segredo no repositório nem publicar no chat.
5. Conferir `/api/health`, registrar dois jogadores com convites, entrar em uma partida, movimentar/recrutar e recarregar a página.
6. Reiniciar o processo: verificar a persistência de contas, ordens e progressão da partida.
7. Só depois distribuir o acesso ao grupo fechado; NÃO tratar a homologação como lançamento público.

## Proteções adicionadas

- Em modo online (`DG_PUBLIC_TEST=1`), o servidor **não inicia** sem HTTPS para cookies (`DG_SECURE_COOKIES=1`) e convite válido (16+ caracteres).
- Cadastro com convite obrigatório; entradas incorretas retornam 403.
- Limites de tentativas para cadastro, login e recuperação por endereço de origem (janela de 15 min); autenticação por senha já tinha limite por conta/IP.
- Continuam ativos `SameSite=Strict`, `HttpOnly`, `Secure`, identificação idempotente de ordens, revisão de campanha e checagem de origem.

## Limites ainda importantes

**Não é um lançamento público**: falta auditoria profissional de segurança, testes de carga, observabilidade, rotina externa de backup, ferramentas admin e recuperação de dados por usuários. A recuperação de senha usa um código de uso único. A homologação deve manter entrada restrita a convidados e apenas uma instância, pois SQLite não permite escalar horizontalmente sem uma arquitetura diferente. O plano com disco pode exigir assinatura. Se o deploy falhar, não inventar URL nem usar filesystem temporário como fallback.
