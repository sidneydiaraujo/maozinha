# Fatia 4 — Entrega

Entrega: a Lousa instalada no PC do Sidney, com atalho, e a jornada da seção
1.1 aceita por ele.

---

## T4.1 Instalador

**Arquivos:** `electron-builder.yml`; `package.json` (script e dependência);
`docs/DECISOES.md` (linha D11 com a versão escolhida).

**Regras:**
- Adicionar `electron-builder` na versão exata `26.15.3` (`npm i -D -E`).
- Script: `"dist": "electron-vite build && electron-builder --win --publish never"`.
- `electron-builder.yml`:
  ```yaml
  appId: ia.lousa.app
  productName: Lousa.ia
  directories: { output: release }
  files: [out/**, package.json]
  asarUnpack: [node_modules/node-pty/**]   # binários e conpty.dll precisam ficar fora do asar
  win: { target: nsis }
  nsis: { oneClick: true, perMachine: false }  # por usuário, sem administrador
  ```
- Sem assinatura digital por enquanto (FUNCIONALIDADES §4: hash publicado).
- Gerar o SHA-256 do instalador em `release/SHA256.txt`
  (`Get-FileHash -Algorithm SHA256`).

**Pronto quando:** `npm run dist` gera o instalador em `release/`; depois de
instalar, o executável instalado (procure em `%LOCALAPPDATA%\Programs\` e
anote o caminho exato no `ESTADO.md`) rodado com `--smoke` termina com
código 0 (num terminal sem `ELECTRON_RUN_AS_NODE`).

**Commit:** `chore: Windows installer with electron-builder`

---

## T4.2 Aceite da jornada (com o Sidney)

**Arquivos:** `README.md` (como instalar e usar, em 10 linhas);
`docs/aceite/2026-xx-xx.md` com o resultado e prints.

**Checklist** (o Sidney executa; o Claude prepara e registra):
1. Instalar pelo `release/` e abrir pelo atalho do Menu Iniciar.
2. A barra mostra as contas do PC com e-mail. Renomear "Principal" para "Empresa".
3. Conta sem login: "Entrar" abre o login e, ao terminar, o e-mail aparece.
4. Adicionar um repo pessoal (em `C:\Users\sidne\pessoal\`): "Pessoal" já
   vem marcado; Enter confirma.
5. Adicionar um repo da empresa: escolher "Empresa" (1 clique).
6. **Duas contas Claude, repos diferentes:** "+ Agente" em cada moldura;
   `/status` mostra a conta certa em cada uma, lado a lado.
7. **Duas contas, mesmo repo:** no repo da empresa, "+ Agente ▾" na conta Pessoal
   abre um segundo Claude na mesma moldura, em outra conta; `/status` confere.
8. **Claude e ChatGPT:** "+ Nova conta" → ChatGPT (Codex) → Entrar; "+ Agente ▾"
   com essa conta abre o Codex lado a lado com um Claude (mesmo repo ou outro).
9. Num terminal da conta pessoal: `$env:GITHUB_TOKEN`, `$env:HOME` e
   `$env:CODEX_HOME` vazios, `$env:CLAUDE_CONFIG_DIR` = pasta pessoal. Num da
   empresa: os quatro vazios.
10. Fechar e abrir: tudo no lugar, cada quadro na sua conta.
11. Adicionar o mesmo repo de novo: a Lousa recusa e orienta a usar "+ Agente" nele.

**Pronto quando:** os 11 itens passaram e estão registrados com prints.
Itens que falharem viram tarefas novas no `ESTADO.md`.

**Commit:** `docs: acceptance of the two-account journey`

---

## Depois da primeira versão (não fazer agora)

Na ordem sugerida: retomar a conversa do Claude no quadro certo (B4); estado
"esperando você" com brilho e som (B3); worktree por quadro (D1); barramento
de coordenação entre agentes da mesma conta (E1–E3). Cada um ganha sua fatia
em `docs/plano/` antes de começar.
