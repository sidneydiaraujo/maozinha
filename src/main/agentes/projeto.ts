// O projeto em que o agente mexe (D65): um agente aberto numa pasta que nao e projeto (o quadro
// livre, a pasta do usuario) le e salva arquivos de um projeto la dentro; o Mãozinha acha a raiz
// desse projeto e a mostra na lateral. Os caminhos vem dos ganchos do Claude (D63, A16). Puro.
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { entraNaBusca } from '../arquivos/regras'
import { ehProjeto, type Existe } from '../kanban/projeto'

/** Quantas pastas acima a busca pela raiz sobe, no maximo. */
const SUBIDA_MAXIMA = 40

interface EntradaDoGancho {
  hook_event_name?: unknown
  cwd?: unknown
  tool_input?: { file_path?: unknown; notebook_path?: unknown; path?: unknown }
}

function caminhoDaFerramenta(i: EntradaDoGancho['tool_input']): string | null {
  const c = i?.file_path ?? i?.notebook_path ?? i?.path
  return typeof c === 'string' && c.trim() !== '' ? c : null
}

function lerEntrada(texto: string): EntradaDoGancho | null {
  try {
    return JSON.parse(texto) as EntradaDoGancho
  } catch {
    return null
  }
}

/**
 * O caminho que a ferramenta tocou (ler, procurar, salvar), absoluto. So o PostToolUse conta: o
 * resto nao traz caminho. Relativo vale contra o `cwd` do gancho.
 */
export function caminhoTocado(texto: string): string | null {
  const entrada = lerEntrada(texto)
  if (entrada?.hook_event_name !== 'PostToolUse') return null
  const c = caminhoDaFerramenta(entrada.tool_input)
  if (c === null) return null
  if (isAbsolute(c)) return c
  return typeof entrada.cwd === 'string' && isAbsolute(entrada.cwd) ? resolve(entrada.cwd, c) : null
}

/** Pasta escondida (.claude, .git), de dependencias, de build ou AppData no caminho: nao e projeto. */
function caminhoDeProjeto(caminho: string): boolean {
  const partes = caminho.split(/[\\/]/).filter((p) => p !== '')
  return partes.slice(1).every((p) => !p.startsWith('.') && entraNaBusca(p))
}

/**
 * A raiz do projeto do caminho: a pasta mais proxima com `.git`; sem nenhuma, a mais proxima com cara
 * de projeto (package.json, CLAUDE.md...). `ampla` = a pasta do usuario ou acima dela, que nunca e
 * projeto. null = nenhuma, ou o caminho passa por pasta escondida ou ignorada.
 */
export function raizDoProjeto(caminho: string, existe: Existe, ampla: (pasta: string) => boolean): string | null {
  if (!isAbsolute(caminho) || !caminhoDeProjeto(caminho)) return null
  let marcada: string | null = null
  let atual = caminho
  for (let n = 0; n < SUBIDA_MAXIMA; n++) {
    if (ampla(atual)) break
    if (existe(join(atual, '.git'))) return atual
    if (marcada === null && ehProjeto(atual, existe)) marcada = atual
    const acima = dirname(atual)
    if (acima === atual) break
    atual = acima
  }
  return marcada
}

/**
 * Troca o projeto do quadro? Salvar (`forte`) sempre troca; ler ou procurar so da o primeiro: ler
 * outro projeto de consulta nao tira o agente do projeto em que ele trabalha.
 */
export function trocaProjeto(atual: string | null, achado: string, forte: boolean): boolean {
  if (atual !== null && atual.toLowerCase() === achado.toLowerCase()) return false
  return forte || atual === null
}
