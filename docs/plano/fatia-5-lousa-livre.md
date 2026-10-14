# Fatia 5 — Lousa livre

Entrega: a lousa volta a ser um espaço aberto. Cada quadro fica solto, com a
pasta escrita no cabeçalho, e existe **um só jeito** de abrir um agente:
escolher conta e pasta no mesmo gesto.

Origem: teste do Sidney em 14/10/2026 (três Claude, duas contas, pedidos de
projetos diferentes). Funcionou, mas a moldura do repo prendia os quadros e
"abrir um Claude numa conta" aparecia em três lugares (barra lateral, cabeçalho
da moldura e moldura vazia). Decisão D13.

---

## T5.1 Modelo: pasta sem moldura e quadro com posição na lousa

**Arquivos:** `src/shared/model.ts`, `src/main/estado/armazem.ts` (+ teste),
`src/main/lousa/layout.ts` (+ teste), `src/main/repos/servico.ts` (+ teste),
`src/main/quadros/servico.ts` (+ teste), handlers, `docs/ARQUITETURA.md`.

**Regras:**
- `Repo` perde `caixa`. `perfilPadraoId` passa a ser "última conta usada nesta
  pasta" (sugestão), atualizada a cada quadro criado.
- `Quadro.caixa` passa a ser posição **na lousa**, não relativa à moldura.
- `EstadoSalvo.versao` = 2. Arquivo versão 1 é migrado ao carregar: soma a
  posição da moldura à de cada quadro e descarta a moldura. Nada se perde.
- `repos.adicionar` com pasta já cadastrada devolve a existente (não é mais erro):
  escolher a mesma pasta de novo é normal no fluxo novo.
- `quadros.criar(repoId, tipo, perfilId, posicao?)`: conta obrigatória; sem
  posição, o quadro entra à direita do mais à direita.
- Sai o canal `repos:mudarPerfilPadrao` e o `repos` do layout.

**Commit:** `refactor: free canvas model (absolute card positions, v2 state)`

## T5.2 Lousa livre

**Arquivos:** `src/renderer/src/lousa/*`.

**Regras:**
- Só quadros na lousa, sem molduras e sem pai. Cabeçalho do quadro:
  `Claude 2 · Pessoal · lousa-ia` (título, conta, pasta; caminho no tooltip).
- Lousa vazia mostra: "Arraste uma conta para cá ou dê duplo clique para abrir
  um agente".
- Sai `RepoNode`, `MenuRepo` e os botões "+ Terminal ▾ / + Agente ▾".

## T5.3 Um só jeito de criar

**Arquivos:** `src/renderer/src/lousa/NovoQuadro.tsx` (novo), `BarraContas`,
`CartaoConta`, `App.tsx`.

**Regras:**
- A janelinha "Novo quadro" pede **conta** (chips com a cor), **pasta**
  (pastas recentes + "Outra pasta…") e abre com "Abrir agente" ou "Abrir
  terminal". Enter = abrir agente.
- Três portas para a mesma janelinha:
  1. arrastar o cartão da conta para a lousa (conta já escolhida; o quadro
     nasce onde soltou);
  2. duplo clique no vazio da lousa (nasce ali);
  3. botão "+ Agente" no cartão da conta (nasce ao lado dos outros).
- Pasta escolhida em "Outra pasta…" sem conta marcada: a conta sugerida pela
  pasta (T3.1) vem marcada.
- A barra lateral troca "+ Adicionar repositório" por uma lista "Pastas"
  (recentes) com "×" para tirar uma pasta: confirma, fecha os quadros dela e
  nunca apaga arquivos.

**Commit:** `feat: free canvas with one way to open agents`

## T5.4 Aceite

Atualizar `docs/aceite/roteiro.md` (itens 4–7, 10 e 11 mudam de forma),
gerar instalador e o Sidney repete o teste de três quadros.
