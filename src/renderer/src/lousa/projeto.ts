// O projeto em que o agente mexe (D65): o main achou e avisou; a tela troca o quadro e poe a pasta
// do projeto na lista, se ela ainda nao estava. Puro.
import type { EstadoTela, Quadro, Repo } from '../../../shared/model'

export function comProjeto(e: EstadoTela, quadro: Quadro, repo: Repo): EstadoTela {
  if (!e.quadros.some((q) => q.id === quadro.id)) return e // o quadro ja saiu da lousa
  const repos = e.repos.some((r) => r.id === repo.id) ? e.repos : [...e.repos, repo]
  return { ...e, repos, quadros: e.quadros.map((q) => (q.id === quadro.id ? quadro : q)) }
}

/** O nome que o cabecalho mostra: o projeto achado, se a pasta dele esta na lista; senao, nada. */
export function projetoDo(quadro: Quadro, repos: ReadonlyMap<string, Repo>): Repo | null {
  return quadro.projeto ? repos.get(quadro.projeto) ?? null : null
}
