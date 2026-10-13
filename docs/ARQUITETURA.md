# Arquitetura — primeira versão

Escopo: a jornada da seção 1.1 de `FUNCIONALIDADES.md` (contas detectadas,
adicionar repo com conta sugerida, terminais na lousa, reabrir de onde parou).
Coordenação entre agentes, worktrees, diff e navegador ficam para depois.

## Partes

```
┌──────────────────────── Electron ────────────────────────┐
│ main (Node)                         tela (React, sandbox) │
│  perfis/   detectar, ambiente,       Barra lateral: contas │
│            conta (auth status)       Lousa (React Flow):   │
│  repos/    sugerir, serviço           moldura por repo +   │
│  terminais/ serviço (node-pty)        quadros de terminal  │
│  estado/   armazém (estado.json)     Terminal (xterm.js)   │
│  handlers/ um arquivo por grupo                            │
│        ▲  ipcMain.handle (zod)   preload  window.lousa  ▲  │
│        └──────────────── contextBridge ──────────────────┘ │
└───────────────────────────────────────────────────────────┘
        │ spawn powershell.exe com ambiente montado do zero
        ▼
   terminal da conta X  →  claude.exe usa só a pasta da conta X
```

- **main** é o dono do estado e de toda decisão: conta, pasta, comando.
- **preload** só repassa (`src/preload/index.ts`).
- **tela** desenha e manda intenções ("abrir quadro q1"), nunca caminhos.

## Pastas

```
src/shared/ipc.ts          canais + LousaApi (contrato)
src/shared/model.ts        tipos do domínio (T1.1)
src/main/index.ts          ciclo de vida do app
src/main/window.ts         janela segura
src/main/security.ts       webPreferences + origem confiável (puro)
src/main/ipc.ts            handle(): valida origem e entrada
src/main/log.ts            único console do app
src/main/smoke.ts          npm run smoke
src/main/perfis/           detectar.ts, ambiente.ts, conta.ts
src/main/estado/           armazem.ts
src/main/repos/            sugerir.ts, servico.ts
src/main/terminais/        servico.ts, spawnReal.ts, smokePty.ts
src/main/handlers/         app.ts, perfis.ts, terminais.ts, repos.ts, lousa.ts
src/preload/index.ts       ponte
src/renderer/src/          App.tsx, componentes/, lousa/, estilos
```

## Tipos do domínio (`src/shared/model.ts`, criado na T1.1)

```ts
export type PerfilId = string // 'principal' para ~/.claude; sufixo de ~/.claude-<sufixo>

export interface Perfil {
  id: PerfilId
  nome: string        // padrão: 'Principal' / sufixo com inicial maiúscula
  cor: string         // '#rrggbb'
  configDir: string   // caminho absoluto da pasta de configuração do Claude
  ehPadrao: boolean   // true só para ~/.claude: roda SEM CLAUDE_CONFIG_DIR
  raizes: string[]    // pastas cujo conteúdo pertence a esta conta (sugestão)
}

export interface StatusConta {
  logado: boolean
  email: string | null
  plano: string | null  // subscriptionType do auth status
  erro: string | null   // ex.: 'Claude Code não encontrado'
}

export interface PerfilComConta extends Perfil { conta: StatusConta }

export interface Caixa { x: number; y: number; largura: number; altura: number }

export interface Repo {
  id: string
  nome: string        // nome da pasta
  caminho: string     // absoluto, como o usuário escolheu
  perfilId: PerfilId  // uma conta só (C13)
  caixa: Caixa        // moldura na lousa (coordenadas da lousa)
}

export type TipoQuadro = 'terminal' | 'claude'

export interface Quadro {
  id: string
  repoId: string
  tipo: TipoQuadro    // 'claude' digita `claude` ao abrir
  titulo: string
  caixa: Caixa        // relativa à moldura do repo
}

export interface Viewport { x: number; y: number; zoom: number }

export type AlvoTerminal =
  | { tipo: 'quadro'; quadroId: string }
  | { tipo: 'login'; perfilId: PerfilId }

export interface EstadoSalvo {        // %APPDATA%\lousa-ia\estado.json
  versao: 1
  perfis: Record<PerfilId, { nome?: string; cor?: string; raizes?: string[] }> // só o que o usuário mudou
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
  ultimoPerfilId: PerfilId | null
}

export interface EstadoTela {
  perfis: PerfilComConta[]
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
}
```

## Canais de IPC (todos em `src/shared/ipc.ts`)

| Canal | Entrada | Saída | Tarefa |
|---|---|---|---|
| `app:info` | — | `AppInfo` | feito |
| `perfis:listar` | — | `PerfilComConta[]` | T1.6 |
| `perfis:renomear` | `{ perfilId, nome }` | `PerfilComConta` | T1.6 |
| `perfis:atualizarConta` | `{ perfilId }` | `StatusConta` | T1.6 |
| `terminais:abrir` | `{ alvo: AlvoTerminal, cols, rows }` | `{ terminalId, bufferInicial }` | T2.3 |
| `terminais:escrever` | `{ terminalId, dados }` | — | T2.3 |
| `terminais:redimensionar` | `{ terminalId, cols, rows }` | — | T2.3 |
| evento `terminais:dados` | — | `{ terminalId, dados }` | T2.3 |
| evento `terminais:saiu` | — | `{ terminalId, codigo }` | T2.3 |
| `repos:escolherPasta` | — | `{ caminho, sugestaoPerfilId } \| null` | T3.2 |
| `repos:adicionar` | `{ caminho, perfilId }` | `Repo` | T3.2 |
| `repos:mudarPerfil` | `{ repoId, perfilId }` | `Repo` | T3.6 |
| `repos:remover` | `{ repoId }` | — | T3.6 |
| `quadros:criar` | `{ repoId, tipo }` | `Quadro` | T3.4 |
| `quadros:remover` | `{ quadroId }` | — | T3.4 |
| `lousa:carregar` | — | `EstadoTela` | T3.5 |
| `lousa:salvarLayout` | `{ repos: {id, caixa}[], quadros: {id, caixa}[], viewport }` | — | T3.5 |

`terminalId`: o id do quadro, ou `login:<perfilId>` para a tela de login.

## Ambiente de cada terminal (`montarAmbiente`, T1.3)

Montado do zero a partir de `process.env`, comparando nomes sem diferenciar
maiúsculas (no Windows `Path` e `PATH` são a mesma variável) e mantendo o nome
original da chave.

| Entra (lista permitida) | Nunca entra |
|---|---|
| `ALLUSERSPROFILE APPDATA COMMONPROGRAMFILES COMMONPROGRAMFILES(X86) COMMONPROGRAMW6432 COMPUTERNAME COMSPEC HOMEDRIVE HOMEPATH LOCALAPPDATA NUMBER_OF_PROCESSORS OS PATH PATHEXT PROCESSOR_ARCHITECTURE PROCESSOR_IDENTIFIER PROCESSOR_LEVEL PROCESSOR_REVISION PROGRAMDATA PROGRAMFILES PROGRAMFILES(X86) PROGRAMW6432 PSMODULEPATH PUBLIC SYSTEMDRIVE SYSTEMROOT TEMP TMP USERDOMAIN USERDOMAIN_ROAMINGPROFILE USERNAME USERPROFILE WINDIR` | qualquer outra, em especial `CLAUDE_CONFIG_DIR` herdado, `HOME`, `CODEX_HOME`, `GITHUB_TOKEN`, `GH_TOKEN`, `ANTHROPIC_*`, `ELECTRON_RUN_AS_NODE`, `OPENCOVE_*`, `*_TOKEN`, `*_KEY`, `*SECRET*` |

Depois de filtrar, acrescenta:
- `CLAUDE_CONFIG_DIR=<configDir>` **só** se `ehPadrao` for falso;
- `TERM=xterm-256color`, `COLORTERM=truecolor`, `LOUSA_PERFIL=<id>`;
- `<USERPROFILE>\.local\bin` no começo do PATH, se ainda não estiver
  (é onde fica o `claude.exe`, que não está no PATH do Windows).

## Terminais (`ServicoTerminais`, T2.1)

- Um terminal por `terminalId`, vivo no main. `abrir` é idempotente: se já
  existe, devolve o buffer guardado e não abre outro shell.
- Guarda as últimas 200 mil letras de saída para a tela redesenhar ao remontar.
- Shell: `powershell.exe -NoLogo`, `cwd` = pasta do repo (login: `USERPROFILE`).
- Quadro tipo `claude`: depois de abrir, escreve `claude\r`. Login: escreve
  `claude auth login\r`.
- Fechar só quando o quadro é removido, o repo muda de conta ou o app fecha.

## Estado salvo (T1.5)

`%APPDATA%\lousa-ia\estado.json` (`app.getPath('userData')`). Gravação atômica
(arquivo `.tmp` e depois renomeia). Arquivo inválido: renomeia para
`estado.json.corrompido-<data>` e começa do padrão. Validado com zod.

## Segurança

- `contextIsolation`, `sandbox`, sem `nodeIntegration`, sem `webview`.
- CSP no build (`electron.vite.config.ts`); navegação e `window.open` negados;
  pedidos de permissão negados.
- IPC: origem conferida (`isTrustedUrl`) e entrada validada (zod) em `handle()`.
- Nenhuma biblioteca de rastreamento; o app não acessa a rede.

## Testes

| Tipo | Onde | Roda em |
|---|---|---|
| Regra pura (detectar, ambiente, conta, sugerir, armazém, serviço com pty falso) | `*.test.ts` ao lado | `npm test` |
| Isolamento real com node-pty (C8) | `src/main/terminais/isolamento.test.ts` | `npm test` (só Windows) |
| Ponta a ponta sem janela | `src/main/smoke.ts` | `npm run smoke` |
| Jornada completa | `docs/plano/fatia-4-entrega.md`, checklist manual | Sidney |

## Stack (versões fixas, ver D2)

Electron 41.10.7 · electron-vite 5.0.0 · Vite 6.4.4 · React 19.3.0 ·
@xyflow/react 12.12.0 · @xterm/xterm 6.0.0 + addon-fit 0.11.0 · node-pty 1.1.0 ·
zod 4.6.7 · TypeScript 5.9.3 · Vitest 4.1.11 · ESLint 10.12.0 · npm.
