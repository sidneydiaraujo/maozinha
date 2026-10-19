# Fatia 10 — Dois agentes no mesmo repositório sem se atrapalhar

Entrega: na janela "Novo quadro", a opção **"Cópia separada"** faz o agente
trabalhar numa cópia do repositório (um *worktree* do git) com uma branch só
dele. Dois agentes na mesma pasta deixam de pisar no trabalho um do outro. Ao
fechar o quadro, a Lousa apaga a cópia **só se nada se perde**.

Origem: item D1 de `FUNCIONALIDADES.md` (MVP) e o pedido do Sidney em
19/10/2026 ("aplique as etapas 0 e 2 agora"). A Fatia 9 (Codex) espera o uso
do ChatGPT. Decisão: D18.

---

## Como o git se comporta (provado em 19/10/2026, git 2.54, pasta temporária)

- `git worktree add -b lousa/claude-1 <pasta> HEAD` cria a cópia e a branch.
- Arquivo ignorado (`node_modules/`) não aparece em `git status --porcelain`;
  arquivo novo aparece (`?? b.txt`).
- `git worktree remove <pasta>` apaga a cópia limpa, inclusive os ignorados.
  Ele mesmo recusa uma cópia com alteração (rede de segurança).
- `git branch -d` (minúsculo) só apaga a branch se o trabalho dela já está na
  branch atual do repositório; senão recusa. Nunca usamos `-D` nem `--force`.

## Como a Lousa faz

- A cópia vira uma **pasta da lista** (um `Repo` com `copia`), por isso a árvore,
  o leitor, os links do terminal, a conversa (D14) e o `cwd` funcionam sem mudar.
- Lugar: ao lado do repositório, `<pai>\<nome>.copias\<apelido>` (ex.:
  `C:\Users\sidne\pessoal\lousa-ia.copias\claude-3`), branch `lousa/<apelido>`.
  Fica fora do repositório (o `git status` dele não muda) e à vista no Explorador.
- O git roda pelo main, com o ambiente da lista permitida (sem token, sem
  variável de conta), `execFile` sem shell e argumentos fixos.
- Só a pasta raiz de um repositório git aceita cópia (senão: erro claro).
- Fechar o último quadro de uma cópia (ou tirá-la da lista) limpa assim:
  1. alteração não salva (`status --porcelain` com algo) → **mantém** a cópia e
     a pasta na lista; avisa onde está;
  2. limpa → `worktree remove`; depois `branch -d`: apagou → "cópia apagada";
     recusou → "cópia apagada; o trabalho ficou na branch `lousa/x`".
- Juntar o trabalho de volta (merge) fica com o Sidney ou com um agente
  (`git merge lousa/x` na pasta original). Botão de juntar = item D2/D3, depois.

---

## T10.1 Modelo e regras puras

**Arquivos:** `src/shared/model.ts`, `src/main/estado/armazem.ts`,
`src/main/copias/regras.ts` (+ teste), `docs/ARQUITETURA.md`.

**Interface:**
```ts
// model.ts
export interface Copia { origemId: string; branch: string; apelido: string }
export interface Repo { ...; copia?: Copia } // pasta que é cópia separada de outra
export type FimDaCopia =
  | { copia: 'nenhuma' }
  | { copia: 'apagada' }
  | { copia: 'branchGuardada'; branch: string }
  | { copia: 'mantida'; caminho: string; motivo: string }

// copias/regras.ts
export function apelidoDaCopia(titulo: string, usados: string[]): string // 'Claude 3' -> 'claude-3'; repetido -> 'claude-3-2'
export function planejarCopia(origem: Repo, titulo: string, usados: string[]): { caminho: string; branch: string; apelido: string }
export function pastaDasCopias(caminhoOrigem: string): string // '<pai>\<nome>.copias'
```

**Regras:** apelido só `[a-z0-9-]`, sem acento, até 40 letras, nunca vazio
(`copia`); `usados` compara sem caixa. Caminho com `\` (Windows).

**Testes:** apelido simples, acento, repetido, vazio; caminho e branch; pasta
com barra no fim; schema aceita repo com e sem `copia`.

## T10.2 Git de verdade e serviço de cópias

**Arquivos:** `src/main/copias/git.ts`, `src/main/copias/servico.ts` (+ teste
com git falso), `src/main/copias/real.test.ts` (git real em pasta temporária),
`src/main/perfis/ambiente.ts` (exportar `ambienteBase`).

**Interface:**
```ts
export type RodarGit = (cwd: string, args: string[]) => Promise<{ codigo: number; saida: string; erro: string }>
export const rodarGitReal: RodarGit
export class ServicoCopias {
  constructor(deps: { git: RodarGit; existe(caminho: string): boolean; esperar(ms: number): Promise<void> })
  criar(origem: Repo, titulo: string, usados: string[]): Promise<{ caminho: string; copia: Copia }>
  limpar(repo: Repo): Promise<FimDaCopia>
}
```

**Regras:** `criar` confere `rev-parse --show-toplevel` = pasta da origem
(senão "Cópia separada só na pasta raiz de um repositório git" / "Esta pasta
não é um repositório git"); pasta de destino já existente pula para o próximo
apelido. `limpar` segue "Como a Lousa faz"; se `worktree remove` falhar (pasta
presa por um processo), espera 500 ms e tenta uma vez mais; falhou de novo →
`mantida`. Cópia cuja pasta já sumiu → `worktree prune` e `apagada`.

**Testes:** falso: não-git, subpasta, criar, sujo → mantida, branch recusada →
branchGuardada, remove falha duas vezes → mantida. Real: criar, sujo mantém,
limpo apaga pasta e branch, commit na cópia guarda a branch.

## T10.3 Quadros e canais

**Arquivos:** `src/main/quadros/servico.ts` (+ teste), `src/main/repos/servico.ts`
(+ teste), `src/main/handlers/quadros.ts`, `src/main/handlers/repos.ts`,
`src/main/contexto.ts`, `src/shared/ipc.ts`, `src/preload/index.ts`.

**Interface (canais):**
| Canal | Entrada | Saída |
|---|---|---|
| `quadros:criar` | `{ repoId, tipo, perfilId, posicao?, separado? }` | `{ quadro, repo }` (repo = a cópia nova, ou a pasta escolhida) |
| `quadros:remover` | `{ quadroId }` | `FimDaCopia` |
| `repos:remover` | `{ repoId }` | `FimDaCopia` |

**Regras:** `separado` numa cópia não cria cópia da cópia: usa a origem. A conta
do quadro vira a sugestão da cópia e da origem. Removido o último quadro de uma
cópia: fecha o terminal, espera 500 ms, `limpar`; `mantida` deixa a pasta na
lista, os outros casos tiram. Tirar a pasta original não mexe nas cópias.

**Testes:** criar separado gera repo com `copia` e quadro nele; separado numa
cópia usa a origem; remover o último quadro da cópia chama `limpar` e tira a
pasta; com outro quadro na cópia, não limpa; `mantida` deixa a pasta.

## T10.4 Tela

**Arquivos:** `src/renderer/src/lousa/NovoQuadro.tsx`, `useNovoQuadro.ts`,
`Lousa.tsx`, `QuadroNode.tsx`, `src/renderer/src/lousa/copia.ts` (+ teste),
`src/renderer/src/estilos/quadro.css`.

**Regras:** caixa "Cópia separada (branch própria)" na janelinha, já marcada
quando a pasta escolhida tem algum quadro aberto (`sugerirSeparado`). Cabeçalho
do quadro numa cópia: 📁 nome da origem + etiqueta `⑂ apelido` (título = caminho
e branch). Ao fechar: aviso curto no alto ("Cópia apagada", "Trabalho guardado
na branch lousa/x", "Cópia mantida: tem alterações em <caminho>").

**Testes:** `sugerirSeparado`, `textoDoFim`.

## T10.5 Aceite

Itens 31 a 34 do `docs/aceite/roteiro.md`, pelo Sidney, com o instalador novo.
