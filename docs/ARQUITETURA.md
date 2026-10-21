# Arquitetura — primeira versão

Escopo: a jornada da seção 1.1 de `FUNCIONALIDADES.md` (contas Claude e Codex
detectadas ou criadas, adicionar repo com conta sugerida, terminais na lousa com
qualquer conta, no mesmo repo ou em repos diferentes, reabrir de onde parou).
Coordenação entre agentes, diff e navegador ficam para depois. Cópia separada por agente (git worktree): Fatia 10, D18.

## Partes

```
┌──────────────────────── Electron ────────────────────────┐
│ main (Node)                         tela (React, sandbox) │
│  perfis/   detectar, ambiente,       Barra de cima: contas │
│            conta (auth status)        (ícones + engrenagem)│
│  repos/    sugerir, serviço          Lateral: pastas (T7)  │
│  arquivos/ listar, ler, vigia        Leitor: md e código   │
│  terminais/ serviço (node-pty)       Lousa (React Flow):   │
│  estado/   armazém (estado.json)      quadros soltos (D13) │
│  handlers/ um arquivo por grupo      Terminal (xterm.js)   │
│        ▲  ipcMain.handle (zod)   preload  window.lousa  ▲  │
│        └──────────────── contextBridge ──────────────────┘ │
└───────────────────────────────────────────────────────────┘
        │ spawn powershell.exe com ambiente montado do zero
        ▼
   terminal da conta X  →  claude.exe usa só a pasta da conta X
```

- **main** é o dono do estado e de toda decisão: conta, pasta, comando.
- **preload** só repassa (`src/preload/index.ts`).
- **tela** desenha e manda intenções ("abrir quadro q1"), nunca caminhos absolutos. Arquivos
  (T7.1) vão como `repoId` + caminho relativo, e o main confere que ficam dentro da pasta.

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
src/main/quadros/          servico.ts, sessoes.ts
src/main/copias/           regras.ts, git.ts, servico.ts, juntar.ts (cópia separada, T10 e T11)
src/main/arquivos/         regras.ts, servico.ts, vigia.ts, disco.ts (T7.1)
src/main/handlers/         app, perfis, terminais, repos, quadros, lousa, arquivos
src/preload/index.ts       ponte
src/renderer/src/          App.tsx, topo/, explorador/, leitor/, componentes/, lousa/, estilos/
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
  copia?: Copia       // pasta que é cópia separada (git worktree) de outra (T10, D18)
}

export interface Copia { origemId: string; branch: string; apelido: string } // 'lousa/claude-3', 'claude-3'
export interface ResumoCopia { // o que a cópia tem para juntar (T11)
  branch: string; branchAlvo: string; commits: number
  arquivos: Array<{ caminho: string; mais: number; menos: number }>; totalArquivos: number; pendente: boolean
}
export type FimDaCopia = // o que aconteceu com a cópia ao fechar o último quadro dela
  | { copia: 'nenhuma' } | { copia: 'apagada' } | { copia: 'branchGuardada'; branch: string }
  | { copia: 'mantida'; caminho: string; motivo: string }

export type TipoQuadro = 'terminal' | 'agente' // 'agente' digita o CLI do provedor da conta (claude ou codex)

export interface Quadro {
  id: string
  repoId: string
  perfilId: PerfilId  // conta DESTE quadro (quem paga); trocar = quadros:trocarConta, a conversa vai junto (D14)
  tipo: TipoQuadro
  titulo: string      // nome interno; a tela mostra a pasta (D14)
  caixa: Caixa        // posição e tamanho na lousa
  sessaoId?: string   // conversa do Claude neste quadro (agente): o Lousa escolhe e retoma com --resume
  modelo?: Modelo     // 'opus' | 'sonnet' | 'haiku' (T19.1): o agente Claude abre com --model
  esforco?: Esforco   // 'low' … 'max' (T19.1): abre com --effort; valor desconhecido no estado vira "sem escolha"
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

// Pastas na lateral (T7.1): a tela fala em repoId + caminho relativo com '/'
export interface ItemArquivo { nome: string; pasta: boolean }
export interface ConteudoArquivo {
  tipo: 'texto' | 'binario' | 'grande' // grande = acima de 2 MB
  texto: string; tamanho: number; podeAbrirFora: boolean
}
export type Abertura = { onde: 'fora' } | { onde: 'leitor'; conteudo: ConteudoArquivo }

// O que o agente do quadro diz pelo OSC 7501 (T8.1)
export type EstadoAgente = 'trabalhando' | 'esperando' | 'terminou' | 'parado' | 'erro'
export type MotivoEspera = 'permissao' | 'pergunta' | 'login'
export interface AvisoAgente { estado: EstadoAgente; motivo?: MotivoEspera; mensagem?: string }
```

## Canais de IPC (todos em `src/shared/ipc.ts`)

| Canal | Entrada | Saída | Tarefa |
|---|---|---|---|
| `app:info` | — | `AppInfo` | feito |
| `app:copiar` | `{ texto }` | — (área de transferência do Windows) | T8.3 |
| `app:colar` | — | `string` | T8.3 |
| `app:temImagem` | — | `boolean` (há um print na área de transferência; a imagem nunca vai para a tela) | T16.1 |
| `app:erroDaTela` | `{ mensagem }` | — (vai para o arquivo de registros) | T8.6 |
| `app:abrirRegistros` | — | — (abre `<userData>\logs`) | T8.6 |
| `perfis:listar` | — | `PerfilComConta[]` | T1.6 |
| `perfis:renomear` | `{ perfilId, nome }` | `PerfilComConta` | T1.6 |
| `perfis:atualizarConta` | `{ perfilId }` | `StatusConta` | T1.6 |
| `perfis:criar` | `{ provedor, nome }` | `PerfilComConta` | T1.8 |
| `perfis:uso` | — | `UsoConta[]` (só em memória; limite cuja hora de zerar passou vem com 0%) | T20.1 |
| evento `perfis:usoMudou` | — | `UsoConta` (cada conta fica com o painel mais novo de qualquer agente dela) | T20.1 |
| `terminais:abrir` | `{ alvo: AlvoTerminal, cols, rows }` | `{ terminalId, bufferInicial, aviso }` (aviso = último estado do agente) | T2.3, T8.1 |
| `terminais:escrever` | `{ terminalId, dados }` | — | T2.3 |
| `terminais:redimensionar` | `{ terminalId, cols, rows }` | — | T2.3 |
| evento `terminais:dados` | — | `{ terminalId, dados }` | T2.3 |
| evento `terminais:saiu` | — | `{ terminalId, codigo }` | T2.3 |
| evento `terminais:estado` | — | `{ terminalId, aviso: AvisoAgente }` (OSC 7501, só quando muda) | T8.1 |
| `repos:escolherPasta` | — | `{ caminho, sugestaoPerfilId } \| null` | T3.2 |
| `repos:adicionar` | `{ caminho, perfilId }` | `Repo` (a existente, se a pasta já estava cadastrada) | T3.2, T5.1 |
| `repos:remover` | `{ repoId }` | `FimDaCopia` (cópia separada: tenta limpar) | T3.6, T10.3 |
| `quadros:criar` | `{ repoId, tipo, perfilId, posicao?, separado? }` | `{ quadro, repo }` (repo = cópia nova ou null) | T3.4, T5.1, T10.3 |
| `quadros:remover` | `{ quadroId }` | `FimDaCopia` (último quadro de uma cópia: tenta limpar) | T3.4, T10.3 |
| `quadros:trocarConta` | `{ quadroId, perfilId }` | `Quadro` (fecha o terminal e copia a conversa para a outra conta) | T6.1 |
| `quadros:definirPapel` | `{ quadroId, papel }` | `Quadro` (papel limpo, até 40 letras; vazio tira; o time ouve de novo) | T29.1 |
| evento `quadros:focar` | — | `{ quadroId }` (clique na notificação do Windows) | T8.1 |
| `copias:resumo` | `{ repoId }` | `ResumoCopia` (commits e arquivos para juntar) | T11.1 |
| `copias:juntar` | `{ repoId }` | `{ branchAlvo }` (merge; conflito desfaz e lança) | T11.1 |
| `copias:diff` | `{ repoId, caminho }` | `DiffArquivo` (só caminho da lista do `--numstat`) | T22.1 |
| `mensagens:listar` | — | `string[]` (sem arquivo: as três padrão) | T25.1 |
| `mensagens:salvar` | `{ mensagens }` | `string[]` limpa (sem vazias nem repetidas, até 30) | T25.1 |
| `notas:criar` | `{ posicao }` | `Nota` vazia (no lugar livre mais perto) | T26.1 |
| `notas:salvar` | `{ notaId, texto }` | — (até 20 mil letras) | T26.1 |
| `notas:remover` | `{ notaId }` | — | T26.1 |
| `vistas:salvar` | `{ nome, layout }` | `VistaSalva[]` (mesmo nome substitui; até 20) | T27.1 |
| `vistas:remover` | `{ vistaId }` | `VistaSalva[]` | T27.1 |
| `time:ligar` | `{ de, para }` (ids de quadro) | `Ligacao` no automático; recusa com o motivo (`shared/time.ts`) | T28.1 |
| `time:ajustar` | `{ ligacaoId, mudanca: { modo?, pausada? } }` | `Ligacao` | T28.1 |
| `time:desligar` | `{ ligacaoId }` | — (os agentes não são tocados) | T28.1 |
| `time:colega` | `{ quadroId, posicao? }` | `ColegaNovo` (agente Claude na mesma conta, numa cópia da pasta original, ligado; sem git, na mesma pasta) | T28.3 |
| `time:separar` | `{ ligacaoId }` | `ColegaNovo` (colega numa cópia no lugar do `para`; linha antiga sai; sem git, recusa) | T28.3 |
| `lousa:carregar` | — | `EstadoTela` | T3.5 |
| `lousa:salvarLayout` | `{ quadros: {id, caixa}[], viewport }` | — | T3.5, T5.1 |
| `arquivos:listar` | `{ repoId, relativo }` | `ItemArquivo[]` (ordem do VSCode, sem `.git` e afins) | T7.1 |
| `arquivos:abrir` | `{ repoId, relativo }` | `Abertura` (documento abre no Windows; texto volta para o leitor) | T7.1 |
| `arquivos:ler` | `{ repoId, relativo }` | `ConteudoArquivo` | T7.1 |
| `arquivos:abrirFora` | `{ repoId, relativo }` | — (só documento/mídia/texto que o programa só mostra) | T7.1 |
| `arquivos:mostrarNaPasta` | `{ repoId, relativo }` | — | T7.1 |
| `arquivos:abrirLink` | `{ url }` | — (só `http`/`https`, no navegador) | T7.1 |
| `arquivos:vigiar` | `{ pastas: { repoId, relativo }[] }` (máx. 500) | — (vigia só essas pastas, sem subpastas, e para as outras) | T7.1, D17 |
| `arquivos:buscar` | `{ texto }` | `{ repoId, relativo }[]` (Ctrl+K: até 30, teto de 20 mil itens) | T12.1 |
| evento `arquivos:mudou` | — | `{ repoId, caminhos }` (lote de 75 ms, sem git/dependências/builds) | T7.1 |
| `agentes:ultimoPainel` | `{ quadroId }` | `PainelAgente \| null` (o último guardado no main, para a tela remontada) | T17.2 |
| evento `agentes:painel` | — | `{ quadroId, painel: PainelAgente }` (linha de status do agente Claude) | T17.2 |
| `agentes:compactar` | `{ quadroId }` | `void`. O main escreve `/compact`, pausa 150 ms e Enter, só com o agente parado (OSC 7501 `parado` ou `terminou`); senão lança "Espere o agente parar" | T18.1 |
| `agentes:ajustar` | `{ quadroId, mudanca: { modelo?, esforco? } }` (só valores das listas) | `'agora' \| 'quandoParar' \| 'naAbertura'`. Guarda no quadro; com o agente aberto e parado, o main digita `/model x` e `/effort y` (cada um com pausa e Enter); trabalhando, espera ele parar (`FilaAjustes`); fechado, vale na abertura. Terminal comum ou Codex: recusa | T19.1 |

`terminalId`: o id do quadro, ou `login:<perfilId>` para a tela de login (que roda como
`powershell -NoProfile -Command "claude auth login; exit $LASTEXITCODE"`, sem terminal na tela).

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
- Guarda as últimas 1 milhão de letras de saída para a tela redesenhar ao remontar (T8.4),
  em pedaços (`terminais/historico.ts`): copiar tudo a cada pedaço atrasava a digitação (D17).
- Terminal de quadro lê o OSC 7501 da saída (`terminais/status.ts`): responde à pergunta do
  Claude com texto fixo em teclas `win32-input-mode` e avisa quando o estado do agente muda (T8.1).
- Shell: `powershell.exe -NoLogo`, `cwd` = pasta do repo (login: `USERPROFILE`).
- Quadro tipo `agente`: depois de abrir, escreve o comando do provedor da conta
  do quadro (`claude\r` ou `codex\r`). Login: `claude auth login\r` ou `codex login\r`.
  Quadro tipo `terminal`: shell puro, mas já com o ambiente da conta do quadro.
- A conta é do **quadro**, não do repo: dois quadros do mesmo repo podem estar
  em contas diferentes (mesmo provedor ou não), lado a lado.
- Fechar só quando o quadro é removido, o repo muda de conta ou o app fecha.

## Cópia separada (Fatia 10, D18)

- `git worktree add -b lousa/<apelido> <repo>.copias\<apelido> HEAD`, rodado pelo main
  (`copias/git.ts`: `execFile` sem shell, `ambienteBase` + `GIT_TERMINAL_PROMPT=0`).
- Só na pasta raiz de um repositório git. A cópia vira um `Repo` com `copia`; o quadro nasce nela.
- Limpar: alteração não salva → mantém; limpa → `worktree remove` (uma nova tentativa depois de
  500 ms, se a pasta estiver presa) e `branch -d`. Nunca `--force` nem `-D`.

## Estado salvo (T1.5)

`%APPDATA%\lousa-ia\estado.json` (`app.getPath('userData')`). Gravação atômica
(arquivo `.tmp` e depois renomeia). Arquivo inválido: renomeia para
`estado.json.corrompido-<data>` e começa do padrão. Validado com zod.

## Linha de status dos agentes (Fatia 17, D24)

Pasta `<userData>\agentes`, a única que a ponte (`src/main/agentes/ponte.ts`) toca:

- `<quadroId>.settings.json`: gravado ao abrir um agente Claude.
  - Traz só a `statusLine`: `findstr "^" > "C:/…/agentes/<quadroId>.json"`.
  - O comando digitado vira `claude --settings '<arquivo>' …`.
  - Caminho com `$`, crase, `%`, `!` ou aspas: o agente abre sem painel.
- `<quadroId>.json`: o JSON que o Claude entrega à linha de status.
  - Um vigia só desta pasta (sem subpastas, sem `stat`) lê 250 ms depois do último aviso.
  - O `lerPainel` fica só com modelo, esforço, contexto e limites, e o JSON nunca vai para o registro.
- Fechar o terminal de um quadro (removido, repo fechado, troca de conta) apaga os dois arquivos.
- Ao abrir o app, os arquivos de quadros que não existem mais são apagados.
- Nada vai para as pastas das contas (`~/.claude*`).

## Segurança

- `contextIsolation`, `sandbox`, sem `nodeIntegration`, sem `webview`.
- CSP no build (`electron.vite.config.ts`); navegação e `window.open` negados;
  pedidos de permissão negados.
- IPC: origem conferida (`isTrustedUrl`) e entrada validada (zod) em `handle()`.
- Arquivos (T7.1): a tela manda `repoId` + caminho relativo; o main monta o caminho a partir
  do repo salvo e recusa o que sai da pasta. Clicar num arquivo nunca roda nada: script e
  executável só têm "Mostrar na pasta". O md é formatado com `html: false`.
- Aviso do agente (T8.1): a resposta à pergunta OSC 7501 é sempre o mesmo texto; nada da saída
  de um programa volta como entrada do terminal.
- Área de transferência só pelo main (`app:copiar` / `app:colar`, só texto, até 5 MB).
- Registros (T8.6): `<userData>\logs\lousa-AAAA-MM-DD.log`, 14 dias, e-mails como `***@domínio`,
  nunca token nem conteúdo de terminal.
- Nenhuma biblioteca de rastreamento; o app não acessa a rede (links do md e do terminal abrem no navegador).

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
