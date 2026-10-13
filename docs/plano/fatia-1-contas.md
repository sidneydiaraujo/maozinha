# Fatia 1 — Contas

Entrega: a barra lateral mostra as contas do Claude que existem no PC, com cor,
nome editável, e-mail e plano. Itens C2 e C12 de `FUNCIONALIDADES.md`.

---

## T1.1 Modelo compartilhado

**Objetivo:** tipos do domínio num lugar só, usados por main, preload e tela.

**Arquivos:** criar `src/shared/model.ts`.

**Interface:** copie exatamente o bloco "Tipos do domínio" de
`docs/ARQUITETURA.md` (Perfil, StatusConta, PerfilComConta, Caixa, Repo,
TipoQuadro, Quadro, Viewport, AlvoTerminal, EstadoSalvo, EstadoTela).

**Regras:** arquivo só com `export interface`/`export type`. Nenhum import.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: shared domain model`

---

## T1.2 Detectar as contas do PC

**Objetivo:** achar `~/.claude` e `~/.claude-<sufixo>` sem o usuário configurar nada.

**Arquivos:** `src/main/perfis/detectar.ts` e `detectar.test.ts`.

**Interface:**
```ts
import type { EstadoSalvo, Perfil } from '../../shared/model'

export interface DepsDeteccao {
  home: string                              // USERPROFILE
  listarPastas(caminho: string): string[]   // nomes das subpastas diretas
  existe(caminho: string): boolean          // arquivo ou pasta existe
}

export const PALETA = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'] as const

export function detectarPerfis(deps: DepsDeteccao, ajustes: EstadoSalvo['perfis']): Perfil[]

export function depsReais(home: string): DepsDeteccao   // usa node:fs
```

**Regras:**
1. Candidatas: subpastas de `home` cujo nome casa com `/^\.claude(-[a-z0-9][a-z0-9-]*)?$/i`.
2. Só vale se tiver pelo menos um destes dentro: `settings.json`,
   `.credentials.json` ou a pasta `projects`.
3. `.claude` → `id: 'principal'`, `nome: 'Principal'`, `ehPadrao: true`.
   `.claude-pessoal` → `id: 'pessoal'`, `nome: 'Pessoal'`, `ehPadrao: false`.
   O id é o sufixo em minúsculas; o nome é o sufixo com a inicial maiúscula.
4. `configDir` = caminho absoluto (`join(home, nomeDaPasta)`).
5. Ordem: `principal` primeiro, depois os outros em ordem alfabética do id.
6. Cor = `PALETA[posição % PALETA.length]` nessa ordem.
7. `raizes` padrão: para o sufixo `s`, se existir `join(home, s)`, então
   `[join(home, s)]`; senão `[]`. O principal começa com `[]`.
   (No PC do Sidney: `C:\Users\sidne\pessoal` vira raiz da conta Pessoal.)
8. `ajustes[id]` sobrescreve `nome`, `cor` e `raizes` quando presentes.
   Ajuste de id que não existe mais é ignorado.

**Testes** (deps falsas, caminhos montados com `join`):
- acha `.claude` e `.claude-pessoal` com marcadores; ignora `.claude-vazio`
  (sem marcador), `claude-dev-plugin` (sem ponto) e `.claudex`;
- principal vem primeiro, com `ehPadrao: true`; os outros com `false`;
- cores seguem a ordem da paleta;
- raiz padrão aparece só quando a pasta `home/<sufixo>` existe;
- ajustes mudam nome, cor e raízes; ajuste de id inexistente não quebra;
- home sem nenhuma conta → `[]`.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: detect Claude config profiles on this PC`

---

## T1.3 Montar o ambiente de um terminal (o coração do isolamento)

**Objetivo:** cada terminal recebe só o necessário e a conta certa.

**Arquivos:** `src/main/perfis/ambiente.ts` e `ambiente.test.ts`.

**Interface:**
```ts
import type { Perfil } from '../../shared/model'

export const VARIAVEIS_PERMITIDAS: readonly string[] // em MAIÚSCULAS, lista da ARQUITETURA

export function montarAmbiente(
  perfil: Pick<Perfil, 'id' | 'configDir' | 'ehPadrao'>,
  base: Record<string, string | undefined>,
): Record<string, string>
```

**Regras** (detalhe em `ARQUITETURA.md`, "Ambiente de cada terminal"):
1. Copia de `base` só as chaves cujo nome em maiúsculas está em
   `VARIAVEIS_PERMITIDAS`, mantendo o nome original (ex.: `Path`). Pula valores `undefined`.
2. Se `perfil.ehPadrao` for falso: `CLAUDE_CONFIG_DIR = perfil.configDir`.
   Se for verdadeiro: a variável **não existe** no resultado.
3. Acrescenta `TERM=xterm-256color`, `COLORTERM=truecolor`, `LOUSA_PERFIL=<id>`.
4. Põe `<USERPROFILE>\.local\bin` no começo do PATH (a chave de PATH que
   existir, qualquer caixa), se ainda não estiver lá (comparação sem caixa).
   Sem `USERPROFILE` na base, não mexe no PATH.

**Testes:**
- perfil pessoal → `CLAUDE_CONFIG_DIR` igual ao `configDir`;
- perfil principal com `CLAUDE_CONFIG_DIR` na base → resultado **sem** a chave;
- nunca passam: `HOME`, `GITHUB_TOKEN`, `GH_TOKEN`, `ANTHROPIC_API_KEY`,
  `CODEX_HOME`, `ELECTRON_RUN_AS_NODE`, `OPENCOVE_TERMINAL_AGENT_TOKEN`, `MEU_SECRET`;
- `Path` (caixa mista) sai como `Path`, com `.local\bin` primeiro e sem chave
  `PATH` duplicada;
- `.local\bin` já presente (outra caixa) não é duplicado;
- `TERM`, `COLORTERM` e `LOUSA_PERFIL` presentes.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: build terminal environment from an allowlist per profile`

---

## T1.4 Ler o status de login de uma conta

**Objetivo:** mostrar o e-mail e o plano de cada conta sem gastar uso do Claude.

**Arquivos:** `src/main/perfis/conta.ts` e `conta.test.ts`.

**Interface:**
```ts
import type { StatusConta } from '../../shared/model'

export interface ResultadoExec { codigo: number | null; stdout: string; stderr: string }
export type Executar = (arquivo: string, args: string[], env: Record<string, string>) => Promise<ResultadoExec>

export function localizarClaude(home: string, path: string, existe: (c: string) => boolean): string | null
export function interpretarStatus(stdout: string): StatusConta
export function lerStatusConta(exe: string | null, ambiente: Record<string, string>, executar: Executar): Promise<StatusConta>
export const executarReal: Executar
```

**Regras:**
1. `localizarClaude`: primeiro `join(home, '.local', 'bin', 'claude.exe')`;
   senão procura `claude.exe` e depois `claude.cmd` em cada pasta de `path`
   (separador `;`); nada → `null`.
2. Comando: `<exe> auth status --json`, com o ambiente da conta (T1.3).
   Não consome uso do plano.
3. `interpretarStatus`: pega do primeiro `{` ao último `}` do stdout, faz
   `JSON.parse` dentro de try e valida com zod
   `{ loggedIn: boolean, email?: string, subscriptionType?: string }`.
   Ok → `{ logado, email ?? null, plano ?? null, erro: null }`.
   Inválido → `{ logado: false, email: null, plano: null, erro: 'Resposta inesperada do claude auth status' }`.
4. `lerStatusConta`: `exe` nulo → erro `'Claude Code não encontrado'`;
   `executar` lançou (tempo esgotado etc.) → erro `'Falha ao consultar a conta: <mensagem>'`.
5. `executarReal`: `execFile` de `node:child_process` com `windowsHide: true`,
   `timeout: 15000`, `maxBuffer: 1_000_000`. Devolve stdout/stderr mesmo com
   código diferente de zero.
6. Nunca registre o stdout no log (tem e-mail e id da organização).

**Formato real** (Claude Code 2.1.296, e-mail trocado por exemplo). Avisos podem
vir antes, no stderr; o JSON vem no stdout:
```json
{
  "loggedIn": true,
  "authMethod": "claude.ai",
  "apiProvider": "firstParty",
  "analyticsDisabled": false,
  "projectsDirectory": "C:\\Users\\pessoa\\.claude-pessoal\\projects",
  "configDirectory": "C:\\Users\\pessoa\\.claude-pessoal",
  "email": "pessoa@exemplo.com",
  "orgId": "00000000-0000-0000-0000-000000000000",
  "orgName": "pessoa@exemplo.com's Organization",
  "subscriptionType": "pro"
}
```

**Testes:** o exemplo acima → logado com e-mail e plano; `{"loggedIn": false}`
→ não logado sem erro; texto antes do JSON → ainda interpreta; lixo → erro de
resposta inesperada; `exe` nulo; `executar` que lança; `localizarClaude` nos
três caminhos (`.local\bin`, PATH, nenhum).

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: read Claude login status per profile`

---

## T1.5 Guardar o estado da Lousa

**Objetivo:** lembrar nomes das contas, repos, quadros e posições entre aberturas.

**Arquivos:** `src/main/estado/armazem.ts` e `armazem.test.ts`.

**Interface:**
```ts
import type { EstadoSalvo } from '../../shared/model'

export const ESTADO_PADRAO: EstadoSalvo // versao 1, tudo vazio, viewport {x:0,y:0,zoom:1}, ultimoPerfilId null
export interface Armazem { carregar(): EstadoSalvo; salvar(estado: EstadoSalvo): void }
export function criarArmazem(arquivo: string): Armazem
```

**Regras:**
1. Schema zod completo do `EstadoSalvo` (`versao` literal 1).
2. Arquivo não existe → devolve uma cópia de `ESTADO_PADRAO` (não cria o arquivo).
3. JSON inválido ou fora do schema → renomeia para
   `<arquivo>.corrompido-<Date.now()>`, `log('warn', ...)` e devolve o padrão.
4. `salvar`: cria a pasta se faltar, grava `<arquivo>.tmp` e renomeia por cima
   (gravação atômica). Valida com o schema antes de gravar.
5. Fs síncrono (`node:fs`); o arquivo é pequeno.

**Testes** (pasta temporária com `mkdtempSync(join(tmpdir(), 'lousa-'))`):
ida e volta; arquivo ausente → padrão; JSON quebrado → padrão + arquivo
`.corrompido-*` criado; `versao: 2` → padrão + backup; `salvar` cria a pasta.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: atomic JSON state store`

---

## T1.6 Serviço e canais das contas

**Objetivo:** a tela consegue listar, renomear e atualizar contas.

**Arquivos:**
- `src/main/perfis/servico.ts` e `servico.test.ts` (regra, testável)
- `src/main/contexto.ts` (cria armazém, serviço etc. uma vez no início)
- `src/main/handlers/perfis.ts` (fino: só `handle()` chamando o serviço)
- `src/shared/ipc.ts`, `src/preload/index.ts`, `src/main/index.ts` (registrar)

**Interface:**
```ts
// servico.ts
export interface DepsServicoPerfis {
  detectar(ajustes: EstadoSalvo['perfis']): Perfil[]
  armazem: Armazem
  lerConta(perfil: Perfil): Promise<StatusConta>
}
export class ServicoPerfis {
  constructor(deps: DepsServicoPerfis)
  listar(): Promise<PerfilComConta[]>              // contas lidas em paralelo, guardadas em cache
  renomear(perfilId: string, nome: string): Promise<PerfilComConta>
  atualizarConta(perfilId: string): Promise<StatusConta>
  obter(perfilId: string): Perfil                  // lança 'Conta não encontrada'
}

// ipc.ts (acrescentar)
IPC.perfisListar = 'perfis:listar', IPC.perfisRenomear = 'perfis:renomear',
IPC.perfisAtualizarConta = 'perfis:atualizarConta'
LousaApi.perfis: {
  listar(): Promise<PerfilComConta[]>
  renomear(perfilId: string, nome: string): Promise<PerfilComConta>
  atualizarConta(perfilId: string): Promise<StatusConta>
}
```

**Regras:**
- `renomear`: nome com `trim()`, 1 a 40 letras (zod no handler); grava em
  `estado.perfis[id].nome` e salva.
- `lerConta` real (em `contexto.ts`) = `lerStatusConta(localizarClaude(...),
  montarAmbiente(perfil, process.env), executarReal)`.
- Id inexistente → erro `'Conta não encontrada'`.

**Testes** (`servico.test.ts`, com detectar/armazém/lerConta falsos):
listar junta perfil e conta; segunda chamada de `renomear` não relê a conta;
`renomear` persiste no armazém; `atualizarConta` relê e atualiza o cache;
id inexistente lança.

**Pronto quando:** `npm run check` e `npm run smoke` verdes.

**Commit:** `feat: profiles service and IPC channels`

---

## T1.7 Barra lateral de contas

**Objetivo:** o Sidney abre o app e vê as contas dele.

**Arquivos:** `src/renderer/src/componentes/BarraContas.tsx`,
`CartaoConta.tsx`, `src/renderer/src/estilos/contas.css`; ajustar `App.tsx`
e `styles.css`.

**Regras:**
- Layout: barra lateral fixa de 280 px à esquerda; à direita, por enquanto,
  o texto "A lousa chega na fatia 3".
- Título da barra: "Contas". Enquanto lê: "Lendo contas…".
- Cartão por conta (`data-conta={id}`): faixa na cor da conta; nome; e-mail ou
  "Sem login"; plano (ex.: "pro") como etiqueta; erro em vermelho, se houver;
  botão "Atualizar" (chama `atualizarConta`).
- Duplo clique no nome → campo de texto; Enter salva (`renomear`); Esc cancela;
  vazio não salva.
- Rodapé da barra: `v<versão> · Electron <versão>` (o `npm run smoke` procura
  esse texto: mantenha-o).
- Nenhuma conta encontrada: "Nenhuma conta do Claude Code neste PC".

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`
aparecem "Principal" e "Pessoal" com o e-mail de cada uma; renomear
"Principal" para "Empresa" continua depois de fechar e abrir o app.

**Commit:** `feat: accounts sidebar`
