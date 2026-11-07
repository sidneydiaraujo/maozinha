// R3.16: copias fantasmas. Copia separada (D18) cuja pasta sumiu ou ficou vazia (apagada por fora,
// ou uma limpeza que parou no meio) seguia na lista de pastas, e a branch dela no git, para sempre.
// Na abertura, a copia sem quadro nessas condicoes sai da lista e o git esquece o registro dela;
// as branches `lousa/*` ja juntadas e sem copia viva sao oferecidas para apagar (com -d: o git
// recusa a que nao foi juntada). Regra de ouro das copias: nada que tenha trabalho e apagado.
import { existsSync, readdirSync, rmdirSync } from 'node:fs'
import type { BranchesDaPasta, EstadoSalvo, Repo } from '../../shared/model'
import type { RodarGit } from './git'

export type SituacaoPasta = 'ok' | 'sumiu' | 'vazia'

/** Copias sem quadro cuja pasta sumiu ou esta vazia. Com quadro, fica: o Sidney ve o terminal e decide. */
export function acharFantasmas(estado: Pick<EstadoSalvo, 'repos' | 'quadros'>, situacao: (caminho: string) => SituacaoPasta): Repo[] {
  const comQuadro = new Set(estado.quadros.map((q) => q.repoId))
  return estado.repos.filter((r) => r.copia && !comQuadro.has(r.id) && situacao(r.caminho) !== 'ok')
}

/** A pasta da copia no disco de verdade. */
export function situacaoDaPasta(caminho: string): SituacaoPasta {
  if (!existsSync(caminho)) return 'sumiu'
  try {
    return readdirSync(caminho).length === 0 ? 'vazia' : 'ok'
  } catch {
    return 'ok' // sem permissao para olhar: na duvida, nao mexe
  }
}

/** rmdir sem recursao: so sai se estiver vazia. */
export const apagarPastaVazia = (caminho: string): void => rmdirSync(caminho)

export interface DepsVarrer {
  armazem: { carregar(): EstadoSalvo; salvar(estado: EstadoSalvo): void }
  git: RodarGit
  situacao(caminho: string): SituacaoPasta
  /** Remove a pasta so se estiver vazia (rmdir sem recursao). */
  apagarPastaVazia(caminho: string): void
  log(mensagem: string): void
}

/**
 * Na abertura: tira as fantasmas da lista na hora (antes da janela ler o estado) e devolve o resto
 * (o git esquecer os registros e a pasta vazia sair), que pode correr depois.
 */
export function varrerFantasmas(deps: DepsVarrer): Promise<void> {
  const estado = deps.armazem.carregar()
  const fantasmas = acharFantasmas(estado, deps.situacao)
  if (fantasmas.length === 0) return Promise.resolve()
  const ids = new Set(fantasmas.map((r) => r.id))
  estado.repos = estado.repos.filter((r) => !ids.has(r.id))
  deps.armazem.salvar(estado)
  deps.log(`cópias sem pasta tiradas da lista: ${fantasmas.map((r) => r.copia?.apelido ?? r.nome).join(', ')}`)
  const origens = new Set(fantasmas.map((r) => r.copia?.origemId))
  return (async () => {
    for (const r of fantasmas) {
      try {
        deps.apagarPastaVazia(r.caminho)
      } catch {
        // pasta com algo dentro, ja apagada ou presa: fica como esta
      }
    }
    for (const origem of estado.repos.filter((r) => origens.has(r.id))) await deps.git(origem.caminho, ['worktree', 'prune'])
  })()
}

/**
 * As branches `lousa/*` que o git listou como ja juntadas, menos as de uma copia viva (num worktree
 * ou numa copia da lista). `juntadas` = saida de `git branch --merged HEAD --list lousa/* --format=...`;
 * `worktrees` = saida de `git worktree list --porcelain`.
 */
export function branchesSoltas(juntadas: string, worktrees: string, daLista: string[]): string[] {
  const vivas = new Set(daLista)
  for (const linha of worktrees.split(/\r?\n/)) {
    const branch = /^branch refs\/heads\/(.+)$/.exec(linha.trim())?.[1]
    if (branch) vivas.add(branch)
  }
  return juntadas
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((b) => b.startsWith('lousa/') && !vivas.has(b))
}

/** As branches soltas e ja juntadas de uma pasta original; pasta sem git: nenhuma. */
export async function branchesJuntadas(git: RodarGit, origem: Repo, repos: Repo[]): Promise<string[]> {
  const juntadas = await git(origem.caminho, ['branch', '--merged', 'HEAD', '--list', 'lousa/*', '--format=%(refname:short)'])
  if (juntadas.codigo !== 0 || !juntadas.saida.trim()) return []
  const worktrees = await git(origem.caminho, ['worktree', 'list', '--porcelain'])
  if (worktrees.codigo !== 0) return []
  const daLista = repos.filter((r) => r.copia?.origemId === origem.id).map((r) => r.copia?.branch ?? '')
  return branchesSoltas(juntadas.saida, worktrees.saida, daLista)
}

/** Para a faixa da tela: cada pasta original (sem copia) com branches soltas ja juntadas. */
export async function listarBranchesJuntadas(git: RodarGit, repos: Repo[]): Promise<BranchesDaPasta[]> {
  const lista: BranchesDaPasta[] = []
  for (const origem of repos.filter((r) => !r.copia)) {
    const branches = await branchesJuntadas(git, origem, repos)
    if (branches.length > 0) lista.push({ repoId: origem.id, nome: origem.nome, branches })
  }
  return lista
}

/** Apaga (com -d) as branches soltas ja juntadas desta pasta, recalculadas aqui; devolve quantas sairam. */
export async function apagarBranchesJuntadas(git: RodarGit, origem: Repo, repos: Repo[]): Promise<number> {
  let apagadas = 0
  for (const branch of await branchesJuntadas(git, origem, repos)) {
    if ((await git(origem.caminho, ['branch', '-d', branch])).codigo === 0) apagadas++
  }
  return apagadas
}
