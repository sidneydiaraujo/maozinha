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
- **D13 (14/10/2026):** lousa livre. Quadros soltos na lousa (pasta no cabeçalho), sem moldura de repo; conta e pasta escolhidas no mesmo gesto (arrastar a conta, duplo clique no vazio ou "+ Agente" no cartão). Some a "conta padrão do repo"; a pasta guarda só a última conta usada, como sugestão. Motivo: teste do Sidney — a moldura limitava o canvas e havia três caminhos para a mesma ação.
- **D14 (17/10/2026, Sidney):** o quadro é o trabalho, a conta é só quem paga. O quadro mostra a pasta em destaque e um selo com a conta; trocar a conta do quadro (`quadros:trocarConta`) mantém lugar, pasta e conversa: o Lousa dá a cada agente do Claude um id de conversa (`--session-id`), copia o arquivo da conversa para a pasta da outra conta e retoma (`--resume`). Substitui a proibição de D11 ("mudar a conta de um quadro já aberto"). Limites: memórias e skills globais continuam vindo da pasta da conta (contexto 100% igual só com a T1.8); `/clear` ou `/resume` dentro do Claude mudam a conversa e o quadro continua retomando a do id dele; passar uma conversa da empresa para a conta pessoal leva o conteúdo junto. A barra lateral fica só com contas; pastas ficam na janela "Novo quadro".
- **D15 (18/10/2026, Sidney):** contas viram ícones numa barra no alto (desenho do provedor na cor da conta; clique abre o cartão; engrenagem abre o painel com todas as contas e "+ Nova conta"). A lateral passa a ser um explorador das pastas em uso, copiando o jeito do Explorer do VSCode 1.142 (lido no código instalado: esconde `.git` e afins, pastas primeiro com ordem natural, filhos lidos só ao abrir, vigia recursivo com eventos juntados por 75 ms, marca de "alterado" que sobe para as pastas, binário = byte zero nos primeiros 512 bytes). Nossas escolhas: `fs.watch` recursivo do Node em vez de `@parcel/watcher` (sem dependência nativa nova); o vigia ignora também `node_modules` e pastas de build; a tela só manda `repoId` + caminho relativo e o main confere que fica dentro da pasta; "Abrir fora" só para documentos e mídia (lista permitida, nunca script ou executável; o resto só "Mostrar na pasta"); md formatado com `markdown-it` 14.3.2 com `html: false` (HTML do arquivo vira texto), links `http(s)` pelo main e imagens como texto. Dependência nova: `markdown-it` 14.3.2 (JS puro; a 14.3.3 tinha 2 dias e ficou de fora).
