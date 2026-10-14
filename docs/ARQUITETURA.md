# Arquitetura — primeira versão

Escopo: a jornada da seção 1.1 de `FUNCIONALIDADES.md` (contas Claude e Codex
detectadas ou criadas, adicionar repo com conta sugerida, terminais na lousa com
qualquer conta, no mesmo repo ou em repos diferentes, reabrir de onde parou).
Coordenação entre agentes, worktrees, diff e navegador ficam para depois.

## Partes

```
┌──────────────────────── Electron ────────────────────────┐
│ main (Node)                         tela (React, sandbox) │
│  perfis/   detectar, ambiente,       Barra lateral: contas │
│            conta (auth status)       Lousa (React Flow):   │
│  repos/    sugerir, serviço           quadros soltos (D13) │
│  terminais/ serviço (node-pty)        + "Novo quadro"      │
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
export type Provedor = 'claude' | 'codex' // Claude Code (Anthropic) ou Codex CLI (login ChatGPT)

export type PerfilId = string
// claude: 'principal' para ~/.claude; o sufixo em minúsculas de ~/.claude-<sufixo>
// codex:  'cx:padrao' para ~/.codex; 'cx:<sufixo>' para ~/.codex-<sufixo>

export interface Perfil {
  id: PerfilId
  provedor: Provedor
  nome: string        // 'Principal' / sufixo com inicial maiúscula / 'Codex' / 'Codex <Sufixo>'
  cor: string         // '#rrggbb'
  configDir: string   // pasta da conta: CLAUDE_CONFIG_DIR (claude) ou CODEX_HOME (codex)
  ehPadrao: boolean   // true só para ~/.claude e ~/.codex: rodam SEM a variável
  raizes: string[]    // pastas cujo conteúdo pertence a esta conta (sugestão)
}

export interface StatusConta {
  logado: boolean
  email: string | null
  plano: string | null  // subscriptionType do auth status
  erro: string | null   // ex.: 'Claude Code não encontrado'
}

export interface PerfilComConta extends Perfil { conta: StatusConta }

export interface Posicao { x: number; y: number }
export interface Caixa extends Posicao { largura: number; altura: number }

// Pasta onde os quadros trabalham (D13: sem moldura na lousa; aparece no cabeçalho do quadro).
export interface Repo {
  id: string
  nome: string        // nome da pasta
  caminho: string     // absoluto, como o usuário escolheu
  perfilPadraoId: PerfilId // última conta usada nesta pasta: só sugestão, cada quadro tem a sua
}

export type TipoQuadro = 'terminal' | 'agente' // 'agente' digita o CLI do provedor da conta (claude ou codex)

export interface Quadro {
  id: string
  repoId: string
  perfilId: PerfilId  // conta DESTE quadro; fixa. Trocar de conta = remover e criar outro
  tipo: TipoQuadro
  titulo: string
  caixa: Caixa        // posição e tamanho na lousa
}

export interface Viewport { x: number; y: number; zoom: number }

export type AlvoTerminal =
  | { tipo: 'quadro'; quadroId: string }
  | { tipo: 'login'; perfilId: PerfilId }

export interface EstadoSalvo {        // %APPDATA%\lousa-ia\estado.json
  versao: 2           // 1 = lousa com molduras, migrada ao carregar (estado/migrar.ts)
  perfis: Record<PerfilId, { nome?: string; cor?: string; raizes?: string[]; provedor?: Provedor; criada?: boolean }>
  // só o que o usuário mudou; criada = conta criada pelo app (a pasta pode estar vazia)
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
| `perfis:criar` | `{ provedor, nome }` | `PerfilComConta` | T1.8 |
| `terminais:abrir` | `{ alvo: AlvoTerminal, cols, rows }` | `{ terminalId, bufferInicial }` | T2.3 |
| `terminais:escrever` | `{ terminalId, dados }` | — | T2.3 |
| `terminais:redimensionar` | `{ terminalId, cols, rows }` | — | T2.3 |
| evento `terminais:dados` | — | `{ terminalId, dados }` | T2.3 |
| evento `terminais:saiu` | — | `{ terminalId, codigo }` | T2.3 |
| `repos:escolherPasta` | — | `{ caminho, sugestaoPerfilId } \| null` | T3.2 |
| `repos:adicionar` | `{ caminho, perfilId }` | `Repo` (a existente, se a pasta já estava cadastrada) | T3.2, T5.1 |
| `repos:remover` | `{ repoId }` | — | T3.6 |
| `quadros:criar` | `{ repoId, tipo, perfilId, posicao? }` | `Quadro` | T3.4, T5.1 |
| `quadros:remover` | `{ quadroId }` | — | T3.4 |
| `lousa:carregar` | — | `EstadoTela` | T3.5 |
| `lousa:salvarLayout` | `{ quadros: {id, caixa}[], viewport }` | — | T3.5, T5.1 |

`terminalId`: o id do quadro, ou `login:<perfilId>` para a tela de login.

## Ambiente de cada terminal (`montarAmbiente`, T1.3)

Montado do zero a partir de `process.env`, comparando nomes sem diferenciar
maiúsculas (no Windows `Path` e `PATH` são a mesma variável) e mantendo o nome
original da chave.

| Entra (lista permitida) | Nunca entra |
|---|---|
| `ALLUSERSPROFILE APPDATA COMMONPROGRAMFILES COMMONPROGRAMFILES(X86) COMMONPROGRAMW6432 COMPUTERNAME COMSPEC HOMEDRIVE HOMEPATH LOCALAPPDATA NUMBER_OF_PROCESSORS OS PATH PATHEXT PROCESSOR_ARCHITECTURE PROCESSOR_IDENTIFIER PROCESSOR_LEVEL PROCESSOR_REVISION PROGRAMDATA PROGRAMFILES PROGRAMFILES(X86) PROGRAMW6432 PSMODULEPATH PUBLIC SYSTEMDRIVE SYSTEMROOT TEMP TMP USERDOMAIN USERDOMAIN_ROAMINGPROFILE USERNAME USERPROFILE WINDIR` | qualquer outra, em especial `CLAUDE_CONFIG_DIR` herdado, `HOME`, `CODEX_HOME`, `GITHUB_TOKEN`, `GH_TOKEN`, `ANTHROPIC_*`, `ELECTRON_RUN_AS_NODE`, `OPENCOVE_*`, `*_TOKEN`, `*_KEY`, `*SECRET*` |

Depois de filtrar, acrescenta (nunca as duas variáveis juntas):
- conta **claude** e `ehPadrao` falso: `CLAUDE_CONFIG_DIR=<configDir>`;
- conta **codex** e `ehPadrao` falso: `CODEX_HOME=<configDir>`;
- conta padrão (`~/.claude` ou `~/.codex`): nenhuma das duas, idêntico ao terminal normal;
- `TERM=xterm-256color`, `COLORTERM=truecolor`, `LOUSA_PERFIL=<id>`;
- `<USERPROFILE>\.local\bin` no começo do PATH, se ainda não estiver
  (é onde fica o `claude.exe`, que não está no PATH do Windows). O `codex`
  instalado por npm fica em `%APPDATA%\npm`, que já vem no PATH.

## Terminais (`ServicoTerminais`, T2.1)

- Um terminal por `terminalId`, vivo no main. `abrir` é idempotente: se já
  existe, devolve o buffer guardado e não abre outro shell.
- Guarda as últimas 200 mil letras de saída para a tela redesenhar ao remontar.
- Shell: `powershell.exe -NoLogo`, `cwd` = pasta do repo (login: `USERPROFILE`).
- Quadro tipo `agente`: depois de abrir, escreve o comando do provedor da conta
  do quadro (`claude\r` ou `codex\r`). Login: `claude auth login\r` ou `codex login\r`.
  Quadro tipo `terminal`: shell puro, mas já com o ambiente da conta do quadro.
- A conta é do **quadro**, não do repo: dois quadros do mesmo repo podem estar
  em contas diferentes (mesmo provedor ou não), lado a lado.
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
