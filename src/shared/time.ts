// Time de agentes ligado por linhas (T28.1, D39). Funcoes puras: o main decide com elas e a tela
// so as usa para pintar a linha enquanto arrasta.
import type { Ligacao, PerfilId, Provedor, Quadro, Repo } from './model'

export type MotivoRecusa = 'mesmoQuadro' | 'repetida' | 'ciclo' | 'naoAgente' | 'contas'

export const TEXTO_RECUSA: Record<MotivoRecusa, string> = {
  mesmoQuadro: 'Um quadro não se liga a ele mesmo',
  repetida: 'Esses dois quadros já estão ligados',
  ciclo: 'Essa linha fecharia um círculo no time',
  naoAgente: 'Só agentes Claude entram num time',
  contas: 'Contas diferentes só se ligam no mesmo repositório',
}

/** O que as regras precisam saber da lousa. */
export interface DadosTime {
  quadros: Quadro[]
  repos: Repo[]
  ligacoes: Ligacao[]
  provedores: Record<PerfilId, Provedor>
}

/** A pasta original de uma copia, ou a propria pasta. */
export function raizDoRepo(repos: Repo[], repoId: string): string {
  return repos.find((r) => r.id === repoId)?.copia?.origemId ?? repoId
}

export function mesmaPasta(quadros: Quadro[], a: string, b: string): boolean {
  const qa = quadros.find((q) => q.id === a)
  const qb = quadros.find((q) => q.id === b)
  return !!qa && !!qb && qa.repoId === qb.repoId
}

function ehAgenteClaude(dados: DadosTime, quadro: Quadro | undefined): quadro is Quadro {
  return !!quadro && quadro.tipo === 'agente' && dados.provedores[quadro.perfilId] === 'claude'
}

/** D39: mesma conta, ou contas diferentes no mesmo repositorio (original ou copias dele). */
function contasCombinam(repos: Repo[], a: Quadro, b: Quadro): boolean {
  return a.perfilId === b.perfilId || raizDoRepo(repos, a.repoId) === raizDoRepo(repos, b.repoId)
}

/** `de` alcanca `para` seguindo as setas? */
function alcanca(ligacoes: Ligacao[], de: string, para: string): boolean {
  const vistos = new Set<string>()
  const fila = [de]
  while (fila.length > 0) {
    const atual = fila.shift() as string
    if (atual === para) return true
    if (vistos.has(atual)) continue
    vistos.add(atual)
    for (const l of ligacoes) if (l.de === atual) fila.push(l.para)
  }
  return false
}

export function podeLigar(
  dados: DadosTime,
  de: string,
  para: string,
): { ok: true } | { ok: false; motivo: MotivoRecusa } {
  if (de === para) return { ok: false, motivo: 'mesmoQuadro' }
  const qde = dados.quadros.find((q) => q.id === de)
  const qpara = dados.quadros.find((q) => q.id === para)
  if (!ehAgenteClaude(dados, qde) || !ehAgenteClaude(dados, qpara)) return { ok: false, motivo: 'naoAgente' }
  const ja = dados.ligacoes.some((l) => (l.de === de && l.para === para) || (l.de === para && l.para === de))
  if (ja) return { ok: false, motivo: 'repetida' }
  if (!contasCombinam(dados.repos, qde, qpara)) return { ok: false, motivo: 'contas' }
  if (alcanca(dados.ligacoes, para, de)) return { ok: false, motivo: 'ciclo' }
  return { ok: true }
}

/** Ligacoes que ainda valem: os dois quadros existem, sao agentes Claude e as contas combinam. */
export function ligacoesValidas(dados: DadosTime): Ligacao[] {
  return dados.ligacoes.filter((l) => {
    const qde = dados.quadros.find((q) => q.id === l.de)
    const qpara = dados.quadros.find((q) => q.id === l.para)
    return ehAgenteClaude(dados, qde) && ehAgenteClaude(dados, qpara) && contasCombinam(dados.repos, qde, qpara)
  })
}

/** Os quadros do time de `quadroId` (ligados direta ou indiretamente), a partir dele. */
export function timeDe(ligacoes: Ligacao[], quadroId: string): string[] {
  const time: string[] = []
  const fila = [quadroId]
  while (fila.length > 0) {
    const atual = fila.shift() as string
    if (time.includes(atual)) continue
    time.push(atual)
    for (const l of ligacoes) {
      if (l.de === atual) fila.push(l.para)
      if (l.para === atual) fila.push(l.de)
    }
  }
  return time
}
