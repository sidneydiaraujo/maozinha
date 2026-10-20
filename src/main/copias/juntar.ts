// Juntar o trabalho de uma copia separada na pasta original (T11.1, D19).
// So junta sem alteracao pendente (na original, arquivo fora do git nao conta: D30); conflito
// desfaz o merge e nada muda.
import { dirname } from 'node:path'
import type { DiffArquivo, LinhaDiff, Repo, ResumoCopia } from '../../shared/model'
import type { RodarGit } from './git'

/** Ate quantos arquivos o resumo lista (o total vem a parte). */
const MAXIMO_ARQUIVOS = 200

/** Ate quantas linhas a diff de um arquivo mostra (T22.1). */
export const MAXIMO_LINHAS_DIFF = 3000

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
  // arquivo novo fora do git na original nao atrapalha: o git so recusa se a copia trouxer o mesmo nome
  if ((await git(principal, ['status', '--porcelain', '--untracked-files=no'])).saida.trim() !== '') {
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
  throw new Error(explicarRecusa(merge.erro))
}

/** Explica em portugues por que o git recusou o merge sem conflito. */
export function explicarRecusa(erro: string): string {
  const linhas = erro.trim().split(/\r?\n/)
  if (/untracked working tree files would be overwritten/.test(erro)) {
    const nomes = linhas.filter((l) => /^\s+\S/.test(l)).map((l) => l.trim()).slice(0, 5)
    const quais = nomes.length > 0 ? nomes.join(', ') : 'arquivos'
    return `A pasta original tem ${quais} fora do git, e a cópia traz arquivos com o mesmo nome. Apague ou faça commit deles na original antes de juntar.`
  }
  return `O git não juntou: ${linhas[0] ?? ''}`
}

/** Linhas de um `git diff` de um arquivo: cabecalho fora; trecho (@@), mais, menos e igual. */
export function lerDiff(saida: string, maximo = MAXIMO_LINHAS_DIFF): DiffArquivo {
  const linhas: LinhaDiff[] = []
  let dentro = false
  for (const linha of saida.split(/\r?\n/)) {
    if (linha.startsWith('@@')) dentro = true
    if (!dentro || linha.startsWith('\\') || linha === '') continue
    if (linhas.length >= maximo) return { linhas, cortada: true }
    const tipo = linha.startsWith('@@') ? 'trecho' : linha[0] === '+' ? 'mais' : linha[0] === '-' ? 'menos' : 'igual'
    linhas.push({ tipo, texto: tipo === 'trecho' ? linha.replace(/^@@[^@]*@@ ?/, '') : linha.slice(1) })
  }
  return { linhas, cortada: false }
}

/**
 * O que a copia mudou num arquivo desde que saiu da branch da original (T22.1). So aceita um
 * caminho da lista do resumo: a tela nao escolhe arquivo fora do que a copia mudou.
 */
export async function diffDoArquivo(git: RodarGit, repo: Repo, caminho: string): Promise<DiffArquivo> {
  const branch = exigirCopia(repo)
  const principal = await principalOuErro(git, repo)
  const alvo = (await git(principal, ['branch', '--show-current'])).saida.trim()
  if (!alvo) throw new Error('A pasta original não está numa branch (HEAD solto)')
  const mudados = lerNumstat((await git(principal, ['diff', '--numstat', `${alvo}...${branch}`])).saida)
  if (!mudados.some((a) => a.caminho === caminho)) throw new Error('Este arquivo não está entre os que a cópia mudou')
  const diff = await git(principal, ['diff', '--no-color', '--no-ext-diff', `${alvo}...${branch}`, '--', caminho])
  if (diff.codigo !== 0) throw new Error(`O git não mostrou a diferença: ${diff.erro.trim().split(/\r?\n/)[0] ?? ''}`)
  return lerDiff(diff.saida)
}
