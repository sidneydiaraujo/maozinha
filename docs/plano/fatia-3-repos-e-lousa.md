# Fatia 3 — Repositórios e lousa

Entrega: "Adicionar repositório" → escolher a pasta → um clique na conta →
moldura colorida na lousa com botões "+ Terminal" e "+ Claude". Tudo volta
igual ao reabrir. Itens A1, A3, A4, B1, C11 e C13 de `FUNCIONALIDADES.md`.

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
  adicionar(caminho: string, perfilId: string): Repo
  mudarPerfil(repoId: string, perfilId: string): Repo
  remover(repoId: string): void
}
// LousaApi.repos: escolherPasta(), adicionar(caminho, perfilId), mudarPerfil(repoId, perfilId), remover(repoId)
```

**Regras:**
- `escolherPasta` (só no handler): `dialog.showOpenDialog({ properties: ['openDirectory'] })`;
  cancelado → `null`; senão `{ caminho, sugestaoPerfilId: servico.sugerir(caminho) }`.
- `adicionar`: pasta precisa existir (`'Pasta não encontrada'`); conta precisa
  existir; caminho já cadastrado (normalizado) → `'Este repositório já está na
  lousa, na conta <nome>'` (C13). `nome` = última parte do caminho.
  `caixa` = `{ x: 40 + n * 960, y: 40, largura: 920, altura: 620 }` (n = nº de repos).
  Grava `ultimoPerfilId` e salva.
- `mudarPerfil`/`remover`: id inexistente → `'Repositório não encontrado'`.
  `remover` apaga também os quadros do repo. (Fechar terminais: T3.6.)
- `novoId` real = `crypto.randomUUID()`.

**Testes:** adicionar grava e devolve o repo; pasta inexistente; conta
inexistente; duplicado com outra caixa de letras; caixas não se sobrepõem;
`ultimoPerfilId` atualizado; remover leva os quadros; mudar perfil persiste.

**Pronto quando:** `npm run check` e `npm run smoke` verdes.

**Commit:** `feat: repositories service and IPC channels`

---

## T3.3 Fluxo "Adicionar repositório"

**Arquivos:** `src/renderer/src/componentes/AdicionarRepo.tsx`; botão na `BarraContas.tsx`.

**Regras:**
- Botão "+ Adicionar repositório" no topo da barra lateral.
- Clique → `repos.escolherPasta()`. Cancelado → nada.
- Modal "De qual conta é este repositório?", com o caminho escolhido e **um
  botão grande por conta** (cor, nome, e-mail). O sugerido vem destacado e
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
- Nó `repo` = moldura (`type: 'repo'`), borda e cabeçalho na cor da conta;
  cabeçalho: nome do repo, nome + e-mail da conta, botões "+ Terminal",
  "+ Claude" e menu "⋯" (Mudar conta, Remover). `NodeResizer` na moldura.
- Nó `quadro` (`type: 'quadro'`) com `parentId` = id do repo e
  `extent: 'parent'`; no array de nós o **pai vem antes dos filhos**.
  Cabeçalho com título e "×" (remover); corpo = `<Terminal alvo={{ tipo: 'quadro', quadroId }} />`.
  `NodeResizer` com mínimo 360×220. Arrastar só pelo cabeçalho
  (`dragHandle: '.cabecalho-quadro'`).
- `nodeTypes` definido **fora** do componente (senão o React Flow recria tudo).

**Regras do main:**
- `quadros:criar { repoId, tipo }` → id novo; título `Terminal N` ou `Claude N`;
  caixa dentro da moldura em grade (2 colunas de 440×280, margem 20, abaixo do
  cabeçalho de 48 px); salva.
- `quadros:remover { quadroId }` → `servicoTerminais.fechar(quadroId)` e apaga.
- `resolverAlvo` para `quadro`: `terminalId` = id do quadro; `cwd` = caminho
  do repo; perfil = **o do repo salvo**; `comandoInicial` = `'claude\r'` se o
  tipo for `claude`. Quadro inexistente → `'Quadro não encontrado'`.

**Testes:** serviço de quadros (grade, títulos numerados, remover fecha o
terminal); `alvo.test.ts` ganha os casos de quadro (pasta e conta vêm do repo,
nunca da tela).

**Pronto quando:** `npm run check` e `npm run smoke` verdes; em `npm run dev`,
"+ Claude" numa moldura Pessoal abre o Claude e `/status` mostra a conta
pessoal; numa moldura da empresa, a conta da empresa.

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

## T3.6 Trocar a conta de um repo (C13)

**Arquivos:** `MolduraRepo.tsx` (menu), `ServicoRepos`, handler de repos.

**Regras:**
- Menu "⋯" → "Mudar conta" → modal com os botões de conta (como na T3.3) e o
  aviso: "Os terminais deste repositório serão fechados e reabertos na nova conta."
- No main, `mudarPerfil` fecha todos os terminais dos quadros do repo antes
  de gravar. A tela remonta os quadros (novo shell na conta nova).
- "Remover" pede confirmação, fecha os terminais e apaga moldura e quadros.
  Os arquivos do repositório **nunca** são tocados.

**Testes:** mudar conta fecha os terminais do repo e só os dele; remover fecha
e apaga.

**Pronto quando:** `npm run check` e `npm run smoke` verdes; mudar a conta de
uma moldura troca a cor e o `/status` do Claude passa a mostrar a outra conta.

**Commit:** `feat: change repository account safely`
