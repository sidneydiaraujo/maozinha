# Fatia 2 — Terminais

Entrega: o botão "Entrar" de uma conta abre um terminal real, já naquela conta,
rodando `claude auth login`. Prova o isolamento com teste automático (C8).

---

## T2.1 Serviço de terminais

**Objetivo:** abrir, alimentar e fechar terminais no main, sem duplicar.

**Arquivos:** `src/main/terminais/servico.ts` e `servico.test.ts`.

**Interface:**
```ts
export interface Descartavel { dispose(): void }
export interface PtyLike {
  onData(cb: (dados: string) => void): Descartavel
  onExit(cb: (e: { exitCode: number }) => void): Descartavel
  write(dados: string): void
  resize(cols: number, rows: number): void
  kill(): void
}
export type Spawner = (
  arquivo: string,
  args: string[],
  opcoes: { cwd: string; env: Record<string, string>; cols: number; rows: number },
) => PtyLike

export interface PedidoAbrir {
  terminalId: string
  cwd: string
  env: Record<string, string>
  cols: number
  rows: number
  comandoInicial?: string                       // ex.: 'claude\r'
  shell?: { arquivo: string; args: string[] }   // padrão: powershell.exe -NoLogo
}

export interface Ouvintes {
  aoDados(terminalId: string, dados: string): void
  aoSair(terminalId: string, codigo: number): void
}

export class ServicoTerminais {
  constructor(spawn: Spawner, ouvintes: Ouvintes, limiteBuffer?: number) // padrão 200_000
  abrir(p: PedidoAbrir): { bufferInicial: string; jaEstavaAberto: boolean }
  escrever(terminalId: string, dados: string): void
  redimensionar(terminalId: string, cols: number, rows: number): void
  fechar(terminalId: string): void
  fecharTodos(): void
  estaAberto(terminalId: string): boolean
}
```

**Regras:**
1. `abrir` com id já aberto: não chama `spawn`; devolve o buffer guardado e
   `jaEstavaAberto: true`. Com id que já saiu: abre um novo.
2. Guarda a saída num buffer; passou do limite, descarta o começo.
3. `comandoInicial` é escrito logo depois do spawn.
4. `onExit`: marca o terminal como encerrado, chama `aoSair`, mas mantém o
   buffer até `fechar` (a tela ainda mostra a última saída).
5. `fechar`: chama `kill()` **só** se o processo não saiu (armadilha do
   node-pty em `CLAUDE.md`), descarta os ouvintes e remove o id.
6. `escrever`/`redimensionar` em id desconhecido ou encerrado: não faz nada.
   `cols`/`rows` limitados a 2..500.

**Testes** (spawner falso que registra chamadas e permite disparar dados/saída):
idempotência; buffer acumula e corta no limite; comando inicial escrito;
saída marca encerrado e `fechar` não chama `kill`; `fechar` de terminal vivo
chama `kill`; `fecharTodos`; escrever em id desconhecido não quebra; limites
de cols/rows.

**Pronto quando:** `npm run check` verde.

**Commit:** `feat: idempotent terminal service`

---

## T2.2 node-pty de verdade e o teste de isolamento (C8)

**Objetivo:** provar com um terminal real que uma conta não enxerga a outra.

**Arquivos:** `src/main/terminais/spawnReal.ts`; `src/main/terminais/isolamento.test.ts`.

**Interface:**
```ts
export const spawnReal: Spawner // adapta spawn() do node-pty (name 'xterm-256color')
```

**Regras do teste** (`it.runIf(process.platform === 'win32')`):
- Base falsa = `process.env` + armadilhas: `CLAUDE_CONFIG_DIR=C:\errado`,
  `GITHUB_TOKEN=vazou`, `HOME=C:\casa-falsa`, `ANTHROPIC_API_KEY=vazou`.
- Perfis falsos: `principal` (ehPadrao, configDir qualquer) e `pessoal`
  (configDir numa pasta temporária).
- Para cada perfil: `ServicoTerminais` com `spawnReal`, `shell` =
  `powershell.exe -NoLogo -NoProfile -Command <script>`, env = `montarAmbiente(perfil, base)`.
- Script imprime marcadores montados por concatenação (ver `CLAUDE.md`):
  `Write-Output (('C'+'FG=') + $env:CLAUDE_CONFIG_DIR + '|GT=' + $env:GITHUB_TOKEN + '|HM=' + $env:HOME + '|AK=' + $env:ANTHROPIC_API_KEY + '|FIM')`
- Espera `aoSair` + 500 ms, procura com regex `/CFG=([^|]*)\|GT=([^|]*)\|HM=([^|]*)\|AK=([^|]*)\|FIM/`.
- Esperado: pessoal → `CFG` = pasta temporária; principal → `CFG` vazio;
  `GT`, `HM` e `AK` vazios nos dois.
- Teste opcional (`it.runIf(process.env.LOUSA_TESTE_CLAUDE === '1')`): para
  cada conta real do PC, `claude auth status` dentro do terminal deve mostrar
  `configDirectory` igual ao `configDir` da conta.

**Pronto quando:** `npm run check` verde (o teste de isolamento rodou e passou,
não foi pulado: confira na saída do Vitest).

**Commit:** `test: prove profile isolation with a real pty`

---

## T2.3 Canais dos terminais (alvo "login")

**Objetivo:** a tela abre e conversa com um terminal; o main decide tudo.

**Arquivos:**
- `src/main/terminais/alvo.ts` e `alvo.test.ts`
- `src/main/handlers/terminais.ts`; `src/main/contexto.ts` (cria o serviço)
- `src/shared/ipc.ts`, `src/preload/index.ts`, `src/main/index.ts`

**Interface:**
```ts
// alvo.ts
export interface AlvoResolvido {
  terminalId: string
  cwd: string
  perfil: Perfil
  comandoInicial?: string
}
export function resolverAlvo(
  alvo: AlvoTerminal,
  deps: { home: string; obterPerfil(id: string): Perfil },
): AlvoResolvido

// LousaApi (acrescentar)
terminais: {
  abrir(alvo: AlvoTerminal, cols: number, rows: number): Promise<{ terminalId: string; bufferInicial: string }>
  escrever(terminalId: string, dados: string): Promise<void>
  redimensionar(terminalId: string, cols: number, rows: number): Promise<void>
  aoDados(cb: (terminalId: string, dados: string) => void): () => void  // devolve "desinscrever"
  aoSair(cb: (terminalId: string, codigo: number) => void): () => void
}
```

**Regras:**
- `login` → `terminalId: 'login:<perfilId>'`, `cwd: home`,
  `comandoInicial: 'claude auth login\r'`.
- `quadro` → por enquanto lança `'Quadros chegam na fatia 3'` (T3.4 completa).
- Handler `terminais:abrir`: `resolverAlvo` → `montarAmbiente(perfil, process.env)`
  → `servico.abrir(...)`. A entrada da tela é só o alvo e o tamanho (zod).
- Eventos `terminais:dados` / `terminais:saiu`: o main envia para todas as
  janelas (`BrowserWindow.getAllWindows()`), com payload `{ terminalId, dados }`
  e `{ terminalId, codigo }`.
- Preload: `aoDados`/`aoSair` usam `ipcRenderer.on` e devolvem uma função que
  chama `removeListener`. O callback recebe só os campos, nunca o `event`.
- `app.on('before-quit')` → `servico.fecharTodos()`.

**Testes** (`alvo.test.ts`): login monta id, cwd e comando; conta inexistente
propaga o erro; quadro lança a mensagem da fatia 3.

**Pronto quando:** `npm run check` e `npm run smoke` verdes.

**Commit:** `feat: terminal IPC channels with main-side target resolution`

---

## T2.4 Componente de terminal na tela

**Objetivo:** um terminal xterm.js ligado ao main, que se ajusta ao tamanho.

**Arquivos:** `src/renderer/src/componentes/Terminal.tsx`,
`src/renderer/src/estilos/terminal.css`.

**Interface:**
```tsx
export function Terminal(props: {
  alvo: AlvoTerminal
  aoSair?: (codigo: number) => void
}): React.JSX.Element
```

**Regras:**
- `import '@xterm/xterm/css/xterm.css'`; `new Terminal({ cursorBlink: true,
  fontFamily: 'Cascadia Mono, Consolas, monospace', fontSize: 13 })` + `FitAddon`.
- Ao montar: `fit()`, depois `window.lousa.terminais.abrir(alvo, cols, rows)`;
  escreve o `bufferInicial`; inscreve `aoDados`/`aoSair` filtrando pelo `terminalId`.
- `term.onData` → `escrever`. `ResizeObserver` no contêiner → `fit()` →
  `redimensionar` (com debounce de 100 ms).
- Ao desmontar: desinscreve e `term.dispose()`. **Não** fecha o terminal no main (D8).
- Contêiner com as classes `nodrag nowheel` e altura 100%.

**Pronto quando:** `npm run check` verde (o uso real vem na T2.5).

**Commit:** `feat: xterm terminal component`

---

## T2.5 Botão "Entrar" em cada conta

**Objetivo:** logar uma conta sem saber nenhum comando.

**Arquivos:** `CartaoConta.tsx` (botão), `src/renderer/src/componentes/JanelaLogin.tsx`.

**Regras:**
- Botão "Entrar" aparece quando `conta.logado` é falso; "Trocar login" quando verdadeiro.
- Abre uma janela sobreposta (modal) com título "Entrar na conta <nome>",
  uma linha de ajuda ("O navegador vai abrir para você fazer o login. Volte
  aqui quando terminar.") e o `<Terminal alvo={{ tipo: 'login', perfilId }} />`.
- Quando o terminal sair: chama `atualizarConta`, atualiza o cartão e fecha o modal.
- Botão "Fechar" no modal: fecha o modal (o terminal de login continua no
  main até sair sozinho).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`,
"Entrar" na conta Principal abre o login do Claude e, depois de logar com o
e-mail da empresa, o cartão mostra esse e-mail.

**Commit:** `feat: sign-in button per account`
