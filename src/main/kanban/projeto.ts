// A pasta do projeto (A16): numa pasta grande (a home, uma pasta de varios projetos) o agente salva
// num projeto la dentro. Projeto = a pasta mais proxima do arquivo com cara de projeto. A bolinha da
// lateral e o kanban (D52) usam a mesma. O KANBAN.md nao conta: e o Mãozinha que cria. Puro.
import { dirname, isAbsolute, join, relative } from 'node:path'
import { entraNaBusca } from '../arquivos/regras'
import { ARQUIVO_KANBAN } from './kanban'

export const MARCAS_DE_PROJETO = [
  '.git',
  'package.json',
  'CLAUDE.md',
  'AGENTS.md',
  'pyproject.toml',
  'go.mod',
  'Cargo.toml',
  'pom.xml',
  'composer.json',
  'Gemfile',
] as const

export type Existe = (caminho: string) => boolean

export function ehProjeto(pasta: string, existe: Existe): boolean {
  return MARCAS_DE_PROJETO.some((m) => existe(join(pasta, m)))
}

/**
 * A pasta do projeto do arquivo, relativa a raiz e com `/` (como a arvore); '' = a propria raiz.
 * null = fora da raiz, ou dentro de pasta escondida ou que muda sozinha (node_modules, .git, dist...).
 * Sem pasta com cara de projeto: a raiz, se ela e um projeto; senao a primeira pasta abaixo dela.
 */
export function pastaDoProjeto(arquivo: string, raiz: string, existe: Existe): string | null {
  const rel = relative(raiz, arquivo)
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) return null
  const pastas = rel.split(/[\\/]/).slice(0, -1)
  if (pastas.some((p) => p.startsWith('.') || !entraNaBusca(p))) return null
  for (let n = pastas.length; n > 0; n--) {
    if (ehProjeto(join(raiz, ...pastas.slice(0, n)), existe)) return pastas.slice(0, n).join('/')
  }
  if (pastas.length === 0 || ehProjeto(raiz, existe)) return ''
  return pastas[0] ?? ''
}

/** Quantas pastas acima a busca pela raiz do repositorio sobe, no maximo. */
const SUBIDA_MAXIMA = 40

/**
 * Um kanban so por projeto (A22): onde fica o KANBAN.md de uma pasta. Dentro de um repositorio git
 * (a pasta ou uma acima tem `.git`), vale o kanban que ja existe na pasta ou em alguma acima ate a
 * raiz do repositorio; sem nenhum, ele nasce na raiz. Fora de git, so a propria pasta conta.
 * `existe` = o arquivo ja esta la; `git` = achou a raiz do repositorio.
 */
export function localDoKanban(pasta: string, existe: Existe): { pasta: string; existe: boolean; git: boolean } {
  const subindo = [pasta]
  let raiz: string | null = existe(join(pasta, '.git')) ? pasta : null
  for (let atual = pasta, n = 0; raiz === null && n < SUBIDA_MAXIMA; n++) {
    const acima = dirname(atual)
    if (acima === atual) break
    atual = acima
    subindo.push(atual)
    if (existe(join(atual, '.git'))) raiz = atual
  }
  const candidatas = raiz === null ? [pasta] : subindo
  const achada = candidatas.find((p) => existe(join(p, ARQUIVO_KANBAN)))
  if (achada) return { pasta: achada, existe: true, git: raiz !== null }
  return { pasta: raiz ?? pasta, existe: false, git: raiz !== null }
}
