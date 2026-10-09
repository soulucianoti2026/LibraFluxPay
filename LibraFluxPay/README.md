# Libra - FluxoPay

React e CSS responsivo para os designs Figma de autenticação (5:3415), visão geral (5:3461) e usuários e grupos (5:3598). Fonte Inter e SVGs originais locais.

## Executar

Requer Node.js 20 e npm. Execute `npm install` e `npm run dev` nesta pasta. O comando inicia o Vite (normalmente http://localhost:5173) e a API em 127.0.0.1:3001.

Conta inicial de desenvolvimento: **mariana.costa@aurorasaude.com.br** / **LibraFlux@2026**. Os quatro usuários de exemplo recebem essa senha inicial; João está inativo. Configure `SEED_PASSWORD` antes da primeira inicialização para usar outra senha. A senha pode ser alterada no CRUD.

Rotas: `#/login`, `#/home` e `#/manage`.

## Implementação

- Login, cookie HttpOnly/SameSite, manter conectado, logout e bloqueio após tentativas excessivas.
- CRUD de usuários e grupos, busca, filtros, paginação, contagens reais, confirmação de exclusão e estados de erro.
- E-mail único, senha com pelo menos 10 caracteres, grupo obrigatório, proteção da própria conta administrativa e bloqueio de exclusão de grupos com usuários vinculados.
- Autorização na API: apenas grupos administrativos podem gerenciar cadastros.
- Persistência em `server/data/db.json` com substituição atômica. Senhas derivadas com scrypt e salt aleatório, nunca retornadas ao cliente.
- Visão geral com os dados demonstrativos do Figma. Indicadores, gráfico, alertas e solicitações são exemplos, não pagamentos reais.

O cadastro começa com os quatro usuários identificados no design, sem inventar as outras 32 pessoas. Por isso contagens e paginação diferem do exemplo estático.

## Integrações pendentes

Microsoft SSO requer aplicativo Entra ID e fluxo OIDC; o botão informa que a integração está pendente. Recuperação de senha orienta a contatar o administrador, que pode redefini-la no CRUD. Não há envio de e-mails.

Solicitações, nova solicitação e relatórios são módulos fora destas três telas; os controles informam sua indisponibilidade. A alçada é cadastrada no grupo, mas não existe ainda um motor de aprovação de pagamentos.

A API foi implementada para execução local, em processo único. Sessões ficam em memória: reiniciar a API exige novo login. Para produção compartilhada, configurar banco transacional, sessões persistentes, HTTPS, `COOKIE_SECURE=true`, credenciais próprias e proxy de mesma origem para `/api`. O build gera apenas os arquivos estáticos da interface.

## Verificação

```sh
npm run lint
npm run build
npx playwright install chromium
npm test
```

Os testes iniciam servidores nas portas 5179 e 3001 e usam `test-results/db.json`, sem alterar os dados locais. Cobrem autenticação, sessão, CRUD, filtros, persistência após recarregar, duplicidade, permissões, exclusão protegida e layout mobile. Capturas e verificação das dimensões originais dos ícones ficam em `test-results/`.

`DATA_FILE` altera a persistência e `PORT` altera a porta da API (ajuste também o proxy Vite).
