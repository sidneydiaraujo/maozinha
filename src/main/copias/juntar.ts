// Juntar o trabalho de uma copia separada na pasta original (T11.1, D19).
// So junta com as duas pastas sem alteracao pendente; conflito desfaz o merge e nada muda.
import { dirname } from 'node:path'
import type { Repo, ResumoCopia } from '../../shared/model'
import type { RodarGit } from './git'

/** Ate quantos arquivos o resumo lista (o total vem a parte). */
const MAXIMO_ARQUIVOS = 200

/** Pasta principal do repositorio da copia (onde o merge acontece). */
export async function acharPrincipal(git: RodarGit, copia: string): Promise<string | null> {
  const comum = await git(copia, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
  return comum.codigo === 0 ? dirname(comum.saida.trim()) : null
}

/** Linha do `git diff --numstat`: "12\t3\tsrc/a.ts" (binario vem com "-"). */
export function lerNumstat(saida: string): ResumoCopia['arquivos'] {
  return saida
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((linha) => {
      const [mais = '', menos = '', ...resto] = linha.split('\t')
      return { caminho: resto.join('\t'), mais: Number(mais) || 0, menos: Number(menos) || 0 }
    })
}

function exigirCopia(repo: Repo): string {
  if (!repo.copia) throw new Error('Esta pasta não é uma cópia separada')
  return repo.copia.branch
}

async function principalOuErro(git: RodarGit, repo: Repo): Promise<string> {
  const principal = await acharPrincipal(git, repo.caminho)
  if (!principal) throw new Error('O git não achou o repositório original')
  return principal
}

export async function resumirCopia(git: RodarGit, repo: Repo): Promise<ResumoCopia> {
  const branch = exigirCopia(repo)
  const principal = await principalOuErro(git, repo)
  const alvo = (await git(principal, ['branch', '--show-current'])).saida.trim()
  if (!alvo) throw new Error('A pasta original não está numa branch (HEAD solto)')
  const [commits, diff, status] = await Promise.all([
    git(principal, ['rev-list', '--count', `${alvo}..${branch}`]),
    git(principal, ['diff', '--numstat', `${alvo}...${branch}`]),
    git(repo.caminho, ['status', '--porcelain']),
  ])
  const arquivos = lerNumstat(diff.saida)
  return {
    branch,
    branchAlvo: alvo,
    commits: Number(commits.saida.trim()) || 0,
    arquivos: arquivos.slice(0, MAXIMO_ARQUIVOS),
    totalArquivos: arquivos.length,
    pendente: status.saida.trim() !== '',
  }
}

/** Faz o merge da branch da copia na branch atual da pasta original. Lanca com a explicacao. */
export async function juntarCopia(git: RodarGit, repo: Repo): Promise<{ branchAlvo: string }> {
  const branch = exigirCopia(repo)
  const principal = await principalOuErro(git, repo)
  if ((await git(repo.caminho, ['status', '--porcelain'])).saida.trim() !== '') {
    throw new Error('A cópia tem alterações sem commit: peça ao agente para fazer commit antes de juntar')
  }
  if ((await git(principal, ['status', '--porcelain'])).saida.trim() !== '') {
    throw new Error('A pasta original tem alterações sem commit: faça commit lá antes de juntar')
  }
  const alvo = (await git(principal, ['branch', '--show-current'])).saida.trim()
  if (!alvo) throw new Error('A pasta original não está numa branch (HEAD solto)')
  const merge = await git(principal, ['merge', '--no-edit', branch])
  if (merge.codigo === 0) return { branchAlvo: alvo }

  const conflitos = (await git(principal, ['diff', '--name-only', '--diff-filter=U'])).saida.trim()
  await git(principal, ['merge', '--abort'])
  if (conflitos) {
    const lista = conflitos.split(/\r?\n/).slice(0, 5).join(', ')
    throw new Error(`Conflito: os dois lados mudaram ${lista}. Nada foi juntado; peça a um agente para resolver.`)
  }
  throw new Error(`O git não juntou: ${merge.erro.trim().split(/\r?\n/)[0] ?? ''}`)
}
