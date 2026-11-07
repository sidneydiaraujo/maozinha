// Copias separadas (git worktree) para dois agentes nao pisarem um no outro (T10.2, D18).
// Regra de ouro: so apaga o que nao perde trabalho. Nunca usa --force nem `branch -D`.
import type { Copia, FimDaCopia, Repo } from '../../shared/model'
import { normalizarCaminho } from '../repos/sugerir'
import type { RodarGit } from './git'
import { acharPrincipal } from './juntar'
import { planejarCopia } from './regras'

export interface DepsCopias {
  git: RodarGit
  existe(caminho: string): boolean
  esperar(ms: number): Promise<void>
}

/** Um processo que acabou de fechar ainda pode prender a pasta no Windows. */
const ESPERA_PASTA_PRESA_MS = 500
const TENTATIVAS_DE_APELIDO = 50

/**
 * R1.4: a linha que explica o erro. O git escreve antes o andamento normal ("Preparing worktree
 * (new branch ...)") e so depois o `fatal:`; a 1a linha escondia o motivo de 3 colegas que nao
 * nasceram em 22 e 31/10. Sem `fatal:`/`error:`, a ultima linha.
 */
export function linhaDoErro(texto: string): string {
  const linhas = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== '')
  return linhas.find((l) => /^(fatal|error):/i.test(l)) ?? linhas[linhas.length - 1] ?? ''
}

/** A pasta pode ter copia separada? So a raiz de um repositorio git (D18). */
export async function raizDaCopia(git: RodarGit, origem: Repo): Promise<'ok' | 'semGit' | 'naoRaiz'> {
  const topo = await git(origem.caminho, ['rev-parse', '--show-toplevel'])
  if (topo.codigo !== 0) return 'semGit'
  return normalizarCaminho(topo.saida.trim()) === normalizarCaminho(origem.caminho) ? 'ok' : 'naoRaiz'
}

export class ServicoCopias {
  constructor(private readonly deps: DepsCopias) {}

  /** `usados` = apelidos das copias que a Lousa ja conhece. Lanca com mensagem para a tela. */
  async criar(origem: Repo, titulo: string, usados: string[]): Promise<{ caminho: string; copia: Copia }> {
    const { git } = this.deps
    const raiz = await raizDaCopia(git, origem)
    if (raiz === 'semGit') throw new Error('Esta pasta não é um repositório git')
    if (raiz === 'naoRaiz') throw new Error('Cópia separada só na pasta raiz de um repositório git')
    const ocupados = [...usados]
    for (let i = 0; i < TENTATIVAS_DE_APELIDO; i++) {
      const plano = planejarCopia(origem, titulo, ocupados)
      ocupados.push(plano.apelido)
      if (this.deps.existe(plano.caminho)) continue
      const branch = await git(origem.caminho, ['rev-parse', '--verify', '--quiet', `refs/heads/${plano.branch}`])
      if (branch.codigo === 0) continue
      const r = await git(origem.caminho, ['worktree', 'add', '-b', plano.branch, plano.caminho, 'HEAD'])
      if (r.codigo !== 0) throw new Error(`O git não criou a cópia: ${linhaDoErro(r.erro)}`)
      return { caminho: plano.caminho, copia: { origemId: origem.id, branch: plano.branch, apelido: plano.apelido } }
    }
    throw new Error('Não achei um nome livre para a cópia')
  }

  /** Alteracao nao salva: mantem tudo. Limpa: apaga a pasta; a branch so sai se o trabalho ja foi juntado. */
  async limpar(repo: Repo, caminhoOrigem?: string): Promise<FimDaCopia> {
    if (!repo.copia) return { copia: 'nenhuma' }
    const { git } = this.deps
    const manter = (motivo: string): FimDaCopia => ({ copia: 'mantida', caminho: repo.caminho, motivo })
    if (!this.deps.existe(repo.caminho)) {
      if (caminhoOrigem) await git(caminhoOrigem, ['worktree', 'prune'])
      return { copia: 'apagada' }
    }
    const status = await git(repo.caminho, ['status', '--porcelain'])
    if (status.codigo !== 0) return manter('O git não conseguiu ler a cópia')
    if (status.saida.trim() !== '') return manter('Tem alterações que ainda não viraram commit')

    const principal = await acharPrincipal(git, repo.caminho)
    if (!principal) return manter('O git não achou o repositório original')

    const remover = (): ReturnType<RodarGit> => git(principal, ['worktree', 'remove', repo.caminho])
    let removido = await remover()
    if (removido.codigo !== 0) {
      await this.deps.esperar(ESPERA_PASTA_PRESA_MS)
      removido = await remover()
    }
    if (removido.codigo !== 0) return manter('A pasta está em uso por outro programa')

    const branch = await git(principal, ['branch', '-d', repo.copia.branch])
    return branch.codigo === 0 ? { copia: 'apagada' } : { copia: 'branchGuardada', branch: repo.copia.branch }
  }
}
