# Fatia 3 — Repositórios e lousa

Entrega: "Adicionar repositório" → escolher a pasta → um clique na conta padrão →
moldura na lousa com "+ Terminal" e "+ Agente". Cada quadro tem a sua conta
(Claude ou Codex), então dá para ter duas contas lado a lado no mesmo repo ou
em repos diferentes. Tudo volta igual ao reabrir. Itens A1, A3, A4, B1, C11 e C13 de `FUNCIONALIDADES.md`.

---

## T3.1 Sugerir a conta de um repositório

**Arquivos:** `src/main/repos/sugerir.ts` e `sugerir.test.ts`.

**Interface:**
```ts
export function normalizarCaminho(caminho: string): string // minúsculas, '/'→'\', sem '\' no fim
export function sugerirPerfil(
  caminho: string,
  perfis: Pick<Perfil, 'id' | 'raizes'>[],
  ultimoPerfilId: string | null,
): string | null
```

**Regras:** 1) o primeiro perfil com uma raiz que contém o caminho (igual à
raiz ou começa com `raiz + '\'`, comparando normalizado); 2) senão
`ultimoPerfilId`, se ainda existir; 3) senão o primeiro perfil; 4) sem perfis → `null`.

**Testes:** dentro da raiz; igual à raiz; `C:\Users\x\pessoal-2` **não** casa
com a raiz `C:\Users\x\pessoal`; caixa e barras diferentes; volta para a
última conta; última conta que sumiu; lista vazia.

**Commit:** `feat: suggest account for a repository`

---

## T3.2 Serviço e canais de repositórios

**Arquivos:** `src/main/repos/servico.ts` e `servico.test.ts`;
`src/main/handlers/repos.ts`; `ipc.ts`, preload, `contexto.ts`.

**Interface:**
```ts
export class ServicoRepos {
  constructor(deps: { armazem: Armazem; perfis: ServicoPerfis; ehPasta(c: string): boolean; novoId(): string })
  listar(): Repo[]
  sugerir(caminho: string): string | null
  adicionar(caminho: string, perfilId: string): Repo          // perfilId vira perfilPadraoId
  mudarPerfilPadrao(repoId: string, perfilId: string): Repo
  remover(repoId: string): void
}
// LousaApi.repos: escolherPasta(), adicionar(caminho, perfilId), mudarPerfilPadrao(repoId, perfilId), remover(repoId)
```

**Regras:**
- `escolherPasta` (só no handler): `dialog.showOpenDialog({ properties: ['openDirectory'] })`;
  cancelado → `null`; senão `{ caminho, sugestaoPerfilId: servico.sugerir(caminho) }`.
- `adicionar`: pasta precisa existir (`'Pasta não encontrada'`); conta precisa
  existir; caminho já cadastrado (normalizado) → `'Este repositório já está na
  lousa. Use "+ Agente" nele para abrir outra conta'`. (Um repo aparece uma vez; várias
  contas trabalham dentro da mesma moldura.) `nome` = última parte do caminho.
  `caixa` = `{ x: 40 + n * 960, y: 40, largura: 920, altura: 620 }` (n = nº de repos).
  Grava `ultimoPerfilId` e salva.
- `mudarPerfilPadrao`/`remover`: id inexistente → `'Repositório não encontrado'`.
  `remover` apaga também os quadros do repo. (Fechar terminais: T3.6.)
- `novoId` real = `crypto.randomUUID()`.

**Testes:** adicionar grava e devolve o repo; pasta inexistente; conta
inexistente; duplicado com outra caixa de letras; caixas não se sobrepõem;
`ultimoPerfilId` atualizado; remover leva os quadros; mudar a conta padrão persiste.

**Pronto quando:** `npm run check` e `npm run smoke` verdes.

**Commit:** `feat: repositories service and IPC channels`

---

## T3.3 Fluxo "Adicionar repositório"

**Arquivos:** `src/renderer/src/componentes/AdicionarRepo.tsx`; botão na `BarraContas.tsx`.

**Regras:**
- Botão "+ Adicionar repositório" no topo da barra lateral.
- Clique → `repos.escolherPasta()`. Cancelado → nada.
- Modal "Conta padrão deste repositório?", com o caminho escolhido, a linha
  "Você pode abrir outras contas neste mesmo repositório depois" e **um botão
  grande por conta** (cor, nome, provedor, e-mail). O sugerido vem destacado e
  com foco: **Enter confirma**. Esc cancela.
- Erro do main (ex.: duplicado) aparece no modal, em vermelho.
- Sucesso → a moldura aparece na lousa (T3.4) e o modal fecha.

**Pronto quando:** `npm run check` verde; em `npm run dev`, adicionar
`C:\Users\sidne\pessoal\lousa-ia` vem com "Pessoal" já marcado (raiz).

**Commit:** `feat: add repository flow with suggested account`

---

## T3.4 A lousa: molduras de repo e quadros de terminal

**Arquivos:** `src/renderer/src/lousa/Lousa.tsx`, `MolduraRepo.tsx`,
`QuadroTerminal.tsx`, `nos.ts` (converte estado ↔ nós do React Flow),
`src/renderer/src/estilos/lousa.css`; main: `src/main/quadros/servico.ts`
(+ teste) e `handlers/quadros.ts`; completar `alvo.ts` (alvo `quadro`).

**Regras da tela:**
- `@xyflow/react` com `import '@xyflow/react/dist/style.css'`; `<Background>`,
  `<Controls>`, `<MiniMap>`; zoom 0,2 a 2.
- Nó `repo` = moldura **neutra** (cinza; a cor fica nos quadros). Cabeçalho: nome do
  repo, caminho curto, botões "+ Terminal" e "+ Agente" (usam a conta padrão do
  repo) cada um com "▾" que lista as contas (nome, provedor, e-mail): clicar numa
  conta cria o quadro com ela. Menu "⋯": "Conta padrão…" e "Remover". `NodeResizer` na moldura.
- Nó `quadro` (`type: 'quadro'`) com `parentId` = id do repo e `extent: 'parent'`;
  no array de nós o **pai vem antes dos filhos**. Borda e cabeçalho na **cor da
  conta do quadro**; cabeçalho com título, etiqueta "<nome da conta> · Claude|Codex"
  (e o e-mail, quando houver) e "×" (remover); corpo = `<Terminal alvo={{ tipo: 'quadro', quadroId }} />`.
  `NodeResizer` com mínimo 360×220. Arrastar só pelo cabeçalho
  (`dragHandle: '.cabecalho-quadro'`).
- `nodeTypes` definido **fora** do componente (senão o React Flow recria tudo).

**Regras do main:**
- `quadros:criar { repoId, tipo, perfilId? }` → `perfilId` ausente = `perfilPadraoId`
  do repo; conta inexistente → `'Conta não encontrada'`. Id novo; título
  `Terminal N` ou `<Claude|Codex> N` (N = quantos quadros do repo já têm o prefixo + 1);
  caixa dentro da moldura em grade (2 colunas de 440×280, margem 20, abaixo do
  cabeçalho de 48 px); salva. A conta do quadro **não muda depois**.
- `quadros:remover { quadroId }` → `servicoTerminais.fechar(quadroId)` e apaga.
- `resolverAlvo` para `quadro`: `terminalId` = id do quadro; `cwd` = caminho
  do repo; perfil = **o do quadro salvo** (`quadro.perfilId`, nunca o da tela);
  `comandoInicial` = `comandoAgente(perfil.provedor)` se o tipo for `agente`.
  Quadro inexistente → `'Quadro não encontrado'`.

**Testes:** serviço de quadros (grade, títulos numerados, remover fecha o
terminal); `alvo.test.ts` ganha os casos de quadro (pasta vem do repo e conta vem do quadro, nunca da tela; dois quadros do mesmo repo com contas diferentes resolvem perfis diferentes e a mesma pasta; `terminal` e `agente` recebem o ambiente da conta do quadro).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`,
num repo com conta padrão Empresa, "+ Agente" abre o Claude da Empresa e, pelo "▾",
"+ Agente" na conta Pessoal abre outro Claude **no mesmo repo, lado a lado**;
`/status` em cada um mostra a conta certa. Com o Codex instalado e logado,
"+ Agente ▾ → Codex" abre o Codex no mesmo repo ou em outro.

**Commit:** `feat: canvas with repository frames and terminal cards`

---

## T3.5 Salvar e reabrir a lousa

**Arquivos:** `src/main/handlers/lousa.ts`; `Lousa.tsx`; `ipc.ts`, preload.

**Regras:**
- `lousa:carregar` → `EstadoTela` (perfis com conta, repos, quadros, viewport).
- Mudança de posição/tamanho (fim do arraste/redimensionamento) ou de
  viewport (`onMoveEnd`) → `lousa:salvarLayout` com debounce de 500 ms.
- O main valida com zod (números finitos, largura/altura ≥ 50) e só aceita ids
  que existem; ignora os outros.
- Ao abrir o app, os quadros voltam no lugar e cada terminal abre um shell
  novo na pasta e conta do repo (retomar a conversa do Claude é V1, item B4).

**Testes:** função pura que aplica o layout recebido ao estado (ids
desconhecidos ignorados, valores inválidos recusados).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; fechar e abrir o
app mantém molduras, quadros, tamanhos e zoom.

**Commit:** `feat: persist and restore canvas layout`

---

## T3.6 Conta padrão do repositório e remover (C13)

**Arquivos:** `MolduraRepo.tsx` (menu), `ServicoRepos`, handler de repos.

**Regras:**
- Menu "⋯" → "Conta padrão…" → janela com os botões de conta (como na T3.3).
  Só muda a conta usada nos quadros **novos**; quadros que já existem
  continuam na conta deles e nada é fechado.
- Trocar a conta de um quadro que já existe não é possível: remova o quadro e
  crie outro com a conta desejada (a conta é fixa no quadro, D11).
- "Remover" pede confirmação, fecha os terminais do repo e apaga moldura e
  quadros. Os arquivos do repositório **nunca** são tocados.

**Testes:** mudar a conta padrão persiste e não fecha terminais; remover fecha
só os terminais do repo e apaga os quadros dele.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; mudar a conta padrão
faz o próximo "+ Agente" abrir na conta nova, sem mexer nos quadros existentes.

**Commit:** `feat: repository default account and safe removal`
