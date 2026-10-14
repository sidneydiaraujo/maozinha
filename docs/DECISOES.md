# Decisões

Uma linha nova a cada decisão de arquitetura, stack ou regra. Formato: o que
foi decidido, por quê, e o que fica proibido por causa disso.

**D1 — Construir do zero (12/10/2026).** Fork do OpenCove (~248 mil linhas)
seria grande demais para auditar e o isolamento entre contas não cabe no
modelo dele (ver FUNCIONALIDADES §6). Reaproveitar ideias e peças MIT com crédito.

**D2 — Stack e versões fixas (13/10/2026).** O conjunto Electron 41 + Vite 6 +
electron-vite 5 + Vitest 4 + TypeScript 5.9 é o mesmo que o OpenCove usa com
sucesso no Windows. ESLint 10 (o 9 está sem suporte). Versões exatas no
`package.json`, sem `^`. Trocar versão exige linha nova aqui.

**D3 — npm, não pnpm (13/10/2026).** O pnpm não está instalado no PC e o npm
basta para um app só.

**D4 — node-pty 1.1.0 pré-compilado (13/10/2026).** O PC não tem compilador
C++ (Visual Studio Build Tools). A 1.1.0 traz binários prontos para Windows
x64/arm64 e funciona no Node e no Electron (testado por `npm test` e
`npm run smoke`). Proibido adicionar outra dependência nativa sem decisão.

**D5 — Estado em JSON, não SQLite (13/10/2026).** O estado é pequeno (contas,
repos, quadros, posições) e `better-sqlite3` seria uma segunda dependência
nativa (D4). Revisitar se passar de alguns MB ou precisar de busca.

**D6 — Ambiente do terminal montado do zero (13/10/2026).** Lista permitida de
variáveis (ARQUITETURA, "Ambiente"). O perfil principal (`~/.claude`) roda sem
`CLAUDE_CONFIG_DIR`, idêntico ao terminal normal; definir a variável com o
caminho padrão faria o Claude usar outro arquivo de preferências
(`~/.claude/.claude.json`, visto no teste do OpenCove). Proibido repassar
`process.env` inteiro.

**D7 — O main decide tudo (13/10/2026).** Pasta, conta e comando de um terminal
vêm do repo e do quadro salvos no main. A tela manda só ids. Assim um bug ou conteúdo
malicioso na tela não abre terminal na conta errada.

**D8 — Terminais vivem no main (13/10/2026).** `abrir` idempotente e buffer de
saída no main. O React (StrictMode, remontagem de quadros) pode montar o
componente várias vezes sem abrir shells duplicados nem perder a saída.

**D9 — CSP só no build (13/10/2026).** No modo dev o Vite precisa de script
inline e WebSocket. O dev só carrega `localhost`; o app instalado tem CSP.

**D10 — Qualquer conta pode desenvolver a Lousa (13/10/2026, Sidney).** O
projeto pode ser evoluído pela conta pessoal ou pela da empresa. Por isso o
plano, o estado e as decisões ficam neste repositório, não na memória de uma
conta.

**D11 — Duas fatias a mais no escopo da v1: Codex e conta por quadro (14/10/2026, Sidney).**
O teste da v1 pede duas contas distintas (Claude e Claude, ou Claude e
ChatGPT), em repos diferentes ou no mesmo. Por isso: (1) toda conta tem um
`provedor` (`claude` ou `codex`); o ambiente usa `CLAUDE_CONFIG_DIR` ou
`CODEX_HOME`, nunca os dois; (2) a conta é do **quadro**, não do repo (o repo só
tem a conta padrão); (3) quadro `agente` roda o CLI do provedor da conta.
Substitui a trava "um repo, uma conta" (C13 antigo). Proibido: mudar a conta de
um quadro já aberto (remova e crie outro) e ler `auth.json` do Codex (tem tokens).
O Codex não estava instalado no PC em 14/10/2026: o formato do
`codex login status` precisa ser confirmado na T1.4b.
- **D12 (14/10/2026):** instalador com electron-builder 26.15.3, NSIS por usuário (sem administrador), sem assinatura digital por ora; integridade pelo SHA-256 em `release/SHA256.txt`.
