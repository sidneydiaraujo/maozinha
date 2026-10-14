# Fatia 1 — Contas

Entrega: a barra lateral mostra as contas que existem no PC (Claude e Codex/ChatGPT),
com cor, nome editável, e-mail e plano, e deixa criar uma conta nova. Itens C2 e
C12 de `FUNCIONALIDADES.md`.

---

## T1.1 Modelo compartilhado

**Objetivo:** tipos do domínio num lugar só, usados por main, preload e tela.

**Arquivos:** criar `src/shared/model.ts`.

**Interface:** copie exatamente o bloco "Tipos do domínio" de
`docs/ARQUITETURA.md` (Provedor, Perfil, StatusConta, PerfilComConta, Caixa, Repo,
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
1. Candidatas Claude: subpastas de `home` com nome `/^\.claude(-[a-z0-9][a-z0-9-]*)?$/i`.
   Candidatas Codex: `/^\.codex(-[a-z0-9][a-z0-9-]*)?$/i`.
2. Uma candidata só vale se: (a) tem um marcador dentro (Claude: `settings.json`,
   `.credentials.json` ou pasta `projects`; Codex: `auth.json`, `config.toml` ou
   pasta `sessions`) **ou** (b) `ajustes[id]?.criada === true` (conta criada pelo
   app na T1.8, a pasta pode estar vazia).
3. Ids e nomes padrão:
   `.claude` → `principal` / `Principal` / `ehPadrao: true`;
   `.claude-pessoal` → `pessoal` / `Pessoal`;
   `.codex` → `cx:padrao` / `Codex` / `ehPadrao: true`;
   `.codex-trabalho` → `cx:trabalho` / `Codex Trabalho`.
   O sufixo do id fica em minúsculas; no nome, com a inicial maiúscula.
   `provedor` = `'claude'` ou `'codex'` conforme a pasta.
4. `configDir` = caminho absoluto (`join(home, nomeDaPasta)`).
5. Ordem: Claude primeiro (`principal`, depois os outros em ordem alfabética do
   id), depois Codex (`cx:padrao`, depois os outros em ordem alfabética).
6. Cor = `PALETA[posição % PALETA.length]` nessa ordem.
7. `raizes` padrão: para o sufixo `s` (de `.claude-s` ou `.codex-s`), se existir
   `join(home, s)`, então `[join(home, s)]`; senão `[]`. Os padrões (`principal`,
   `cx:padrao`) começam com `[]`.
   (No PC do Sidney: `C:\Users\sidne\pessoal` vira raiz da conta Pessoal.)
8. `ajustes[id]` sobrescreve `nome`, `cor` e `raizes` quando presentes.
   Ajuste de id que não existe mais é ignorado.

**Testes** (deps falsas, caminhos montados com `join`):
- acha `.claude`, `.claude-pessoal` e `.codex-trabalho` com marcadores; ignora
  `.claude-vazio` e `.codex-vazio` (sem marcador), `claude-dev-plugin` (sem
  ponto) e `.claudex`;
- pasta vazia com `ajustes[id].criada = true` vale (Claude e Codex);
- `principal` vem primeiro, com `ehPadrao: true`; Codex vêm depois dos Claude;
- ids de Codex começam com `cx:`; `.claude-codex` (id `codex`) não colide com `.codex`;
- cores seguem a ordem da paleta;
- raiz padrão aparece só quando a pasta `home/<sufixo>` existe;
- ajustes mudam nome, cor e raízes; ajuste de id inexistente não quebra;
- home sem nenhuma conta → `[]`.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: detect Claude and Codex profiles on this PC`

---

## T1.3 Montar o ambiente de um terminal (o coração do isolamento)

**Objetivo:** cada terminal recebe só o necessário e a conta certa.

**Arquivos:** `src/main/perfis/ambiente.ts` e `ambiente.test.ts`.

**Interface:**
```ts
import type { Perfil } from '../../shared/model'

export const VARIAVEIS_PERMITIDAS: readonly string[] // em MAIÚSCULAS, lista da ARQUITETURA

export function montarAmbiente(
  perfil: Pick<Perfil, 'id' | 'provedor' | 'configDir' | 'ehPadrao'>,
  base: Record<string, string | undefined>,
): Record<string, string>
```

**Regras** (detalhe em `ARQUITETURA.md`, "Ambiente de cada terminal"):
1. Copia de `base` só as chaves cujo nome em maiúsculas está em
   `VARIAVEIS_PERMITIDAS`, mantendo o nome original (ex.: `Path`). Pula valores `undefined`.
2. Se `perfil.ehPadrao` for falso: provedor `claude` → `CLAUDE_CONFIG_DIR = perfil.configDir`;
   provedor `codex` → `CODEX_HOME = perfil.configDir`. Nunca as duas.
   Se `ehPadrao` for verdadeiro: nenhuma das duas existe no resultado.
3. Acrescenta `TERM=xterm-256color`, `COLORTERM=truecolor`, `LOUSA_PERFIL=<id>`.
4. Põe `<USERPROFILE>\.local\bin` no começo do PATH (a chave de PATH que
   existir, qualquer caixa), se ainda não estiver lá (comparação sem caixa).
   Sem `USERPROFILE` na base, não mexe no PATH.

**Testes:**
- perfil Claude pessoal → `CLAUDE_CONFIG_DIR` igual ao `configDir` e **sem** `CODEX_HOME`;
- perfil Codex não padrão → `CODEX_HOME` igual ao `configDir` e **sem** `CLAUDE_CONFIG_DIR`;
- perfil `principal` com `CLAUDE_CONFIG_DIR` na base → resultado **sem** a chave;
- perfil `cx:padrao` com `CODEX_HOME` na base → resultado **sem** a chave;
- nunca passam: `HOME`, `GITHUB_TOKEN`, `GH_TOKEN`, `ANTHROPIC_API_KEY`,
  `OPENAI_API_KEY`, `ELECTRON_RUN_AS_NODE`, `OPENCOVE_TERMINAL_AGENT_TOKEN`, `MEU_SECRET`;
  `CODEX_HOME`/`CLAUDE_CONFIG_DIR` herdados só passam se o perfil os define;
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

## T1.4b Ler o status de login de uma conta Codex (ChatGPT)

**Objetivo:** mostrar se uma conta Codex está logada, do mesmo jeito que a T1.4 faz com o Claude.

**Arquivos:** `src/main/perfis/contaCodex.ts` e `contaCodex.test.ts`; ajuste em `executarReal` (`conta.ts`).

**Interface:**
```ts
import type { StatusConta } from '../../shared/model'
import type { Executar } from './conta'

export function localizarCodex(home: string, path: string, existe: (c: string) => boolean): string | null
export function interpretarStatusCodex(stdout: string, stderr: string, codigo: number | null): StatusConta
export function lerStatusCodex(exe: string | null, ambiente: Record<string, string>, executar: Executar): Promise<StatusConta>
```

**Regras:**
1. `localizarCodex`: procura `codex.exe` e depois `codex.cmd` em cada pasta de `path`
   (separador `;`); depois `join(home, 'AppData', 'Roaming', 'npm', 'codex.cmd')`; nada → `null`.
2. Comando: `<exe> login status`, com o ambiente da conta (T1.3).
3. `interpretarStatusCodex` junta stdout e stderr. Código 0 e texto com
   `/logged in/i` → `logado: true`; `plano` = `'ChatGPT'` se casar `/chatgpt/i`,
   `'API key'` se casar `/api key/i`, senão `null`. `email` é **sempre** `null`
   (o status não informa e-mail e é proibido ler o `auth.json`, que tem tokens).
   Código diferente de 0 ou `/not logged in/i` → `logado: false`, `erro: null`.
4. `lerStatusCodex`: `exe` nulo → erro `'Codex não encontrado. Instale com: npm i -g @openai/codex'`;
   `executar` lançou → `'Falha ao consultar a conta: <mensagem>'`.
5. `executarReal` (T1.4) passa a tratar `.cmd`: se `arquivo` terminar em `.cmd`
   (sem diferenciar caixa), executa `cmd.exe /c <arquivo> <args>` (o Node não
   executa `.cmd` direto). Teste: um `.cmd` temporário que imprime `ok`.
6. **Formato não verificado:** o Codex não está instalado neste PC (14/10/2026).
   As frases acima vêm da documentação do Codex CLI. Se `codex` estiver instalado
   quando você chegar aqui, rode `codex login status` real (com e sem login),
   confira as frases e ajuste regra e testes. Se não estiver, mantenha como está
   e escreva "formato do Codex a confirmar" no `ESTADO.md`.

**Testes:** logado com ChatGPT; logado com API key; "Not logged in" com código 1;
frase no stderr; `exe` nulo; `executar` que lança; `localizarCodex` nos três
caminhos (PATH, npm do usuário, nenhum); `executarReal` com `.cmd`.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: read Codex login status per profile`

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
1. Schema zod completo do `EstadoSalvo` (`versao` literal 1), incluindo `provedor` e `criada` em `perfis[id]`.
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
- `lerConta` real (em `contexto.ts`): provedor `claude` → `lerStatusConta(localizarClaude(...),
  montarAmbiente(perfil, process.env), executarReal)`; provedor `codex` →
  `lerStatusCodex(localizarCodex(...), montarAmbiente(perfil, process.env), executarReal)`.
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
- Cartão por conta (`data-conta={id}`): faixa na cor da conta; nome; etiqueta do
  provedor ("Claude" ou "Codex"); e-mail, ou "Logado" quando não houver e-mail
  (Codex), ou "Sem login"; plano (ex.: "pro", "ChatGPT") como etiqueta; erro em
  vermelho, se houver; botão "Atualizar" (chama `atualizarConta`).
- Duplo clique no nome → campo de texto; Enter salva (`renomear`); Esc cancela;
  vazio não salva.
- Rodapé da barra: `v<versão> · Electron <versão>` (o `npm run smoke` procura
  esse texto: mantenha-o).
- Nenhuma conta encontrada: "Nenhuma conta neste PC. Crie uma em + Nova conta".

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`
aparecem "Principal" e "Pessoal" com o e-mail de cada uma; renomear
"Principal" para "Empresa" continua depois de fechar e abrir o app.

**Commit:** `feat: accounts sidebar`

---

## T1.8 Nova conta (Claude ou Codex)

**Objetivo:** criar uma conta que ainda não existe no PC (ex.: a primeira conta
Codex/ChatGPT, ou uma segunda conta Claude) sem criar pasta nem variável na mão.

**Arquivos:** `src/main/perfis/slug.ts` e `slug.test.ts`; `ServicoPerfis.criar`
(+ teste); handler `perfis:criar`; `ipc.ts`/preload; `src/renderer/src/componentes/NovaConta.tsx`;
botão na `BarraContas.tsx`.

**Interface:**
```ts
export function slugConta(nome: string): string // minúsculas, sem acento, [a-z0-9-], sem '-' nas pontas, até 30
// ServicoPerfis (acrescentar)
criar(provedor: Provedor, nome: string): Promise<PerfilComConta>
// deps novas: home: string; criarPasta(caminho: string): void
// LousaApi.perfis.criar(provedor, nome) · IPC.perfisCriar = 'perfis:criar'
```

**Regras:**
1. `slug = slugConta(nome)`; vazio → `'Nome inválido'`.
2. Pasta: Claude `join(home, '.claude-<slug>')`; Codex `join(home, '.codex-<slug>')`.
   Id: Claude `<slug>`; Codex `cx:<slug>`. O slug `principal` é reservado no Claude
   (`'Nome reservado'`). Id que já existe → `'Já existe uma conta com esse nome'`.
3. Cria a pasta (`mkdir` recursivo), grava `estado.perfis[id] = { nome: <nome digitado, trim>, provedor, criada: true }`,
   salva e devolve o `PerfilComConta` (não logado).
4. Tela: botão "+ Nova conta" na barra. Janela com dois botões grandes
   "Claude" e "ChatGPT (Codex)", um campo "Nome da conta" (Enter cria, Esc cancela),
   erros do main em vermelho. Criou → a conta aparece na barra (o botão "Entrar" vem na T2.5).

**Testes:** `slugConta` ("Trabalho Dev" → `trabalho-dev`; "Ação!" → `acao`; só
símbolos → vazio); `criar` grava a pasta e o ajuste; duplicado e reservado
recusados; Codex gera o id `cx:<slug>`; a conta criada passa a ser detectada
(T1.2) mesmo com a pasta vazia.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`,
"+ Nova conta" → Codex → "Trabalho" cria o cartão "Trabalho" (Codex, "Sem login").

**Commit:** `feat: create new Claude or Codex account`
