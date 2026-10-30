// A pasta do projeto (A16): numa pasta grande (a home, uma pasta de varios projetos) o agente salva
// num projeto la dentro. Projeto = a pasta mais proxima do arquivo com cara de projeto. A bolinha da
// lateral e o kanban (D52) usam a mesma. O KANBAN.md nao conta: e o Mãozinha que cria. Puro.
import { isAbsolute, join, relative } from 'node:path'
import { entraNaBusca } from '../arquivos/regras'

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
