// Linhas do time de agentes na lousa (T28.2, D39): de ligacao salva para aresta do React Flow.
// Funcoes puras; as regras de quem pode ligar ficam em shared/time.ts.
import { MarkerType, type Edge } from '@xyflow/react'
import type { EstadoTela, Ligacao, PerfilId, Provedor, Quadro } from '../../../shared/model'
import { ligacoesValidas, mesmaPasta, timeDe, type DadosTime } from '../../../shared/time'

/** Quantas cores de time existem em tokens.css (--time-1 a --time-5). */
export const CORES_DE_TIME = 5

export interface DadosLinha extends Record<string, unknown> {
  ligacao: Ligacao
  cor: number          // 1 a CORES_DE_TIME
  mesmaPasta: boolean  // os dois na mesma pasta: podem se atrapalhar (linha ambar)
}
export type ArestaTime = Edge<DadosLinha, 'time'>

export const BOLINHA_SAIDA = 'saida'
export const BOLINHA_ENTRADA = 'entrada'

export function dadosDaTela(e: EstadoTela): DadosTime {
  const provedores: Record<PerfilId, Provedor> = {}
  for (const p of e.perfis) provedores[p.id] = p.provedor
  return { quadros: e.quadros, repos: e.repos, ligacoes: e.ligacoes ?? [], provedores }
}

/**
 * Cor de cada time: os times em ordem do seu primeiro quadro na lousa, uma cor para cada, em
 * roda. Time novo entra no fim e nao muda a cor dos que ja existiam.
 */
function coresDosTimes(quadros: Quadro[], ligacoes: Ligacao[]): Map<string, number> {
  const cores = new Map<string, number>()
  let proxima = 0
  for (const q of quadros) {
    if (cores.has(q.id) || !ligacoes.some((l) => l.de === q.id || l.para === q.id)) continue
    const cor = (proxima++ % CORES_DE_TIME) + 1
    for (const id of timeDe(ligacoes, q.id)) cores.set(id, cor)
  }
  return cores
}

/** Cor da linha (e da seta): pausada fica apagada; mesma pasta, ambar; senao a do time. */
export function corDaLinha(d: DadosLinha): string {
  if (d.ligacao.pausada) return 'var(--apagado-2)'
  return d.mesmaPasta ? 'var(--ambar)' : `var(--time-${d.cor})`
}

function classeDaLinha(d: DadosLinha): string {
  const classes = ['linha-time', `linha-time-cor-${d.cor}`]
  if (d.ligacao.pausada) classes.push('linha-time-pausada')
  else if (d.mesmaPasta) classes.push('linha-time-mesma-pasta')
  return classes.join(' ')
}

export function montarArestas(e: EstadoTela): ArestaTime[] {
  const ligacoes = e.ligacoes ?? []
  const cores = coresDosTimes(e.quadros, ligacoes)
  return ligacoes.map((ligacao) => {
    const data = { ligacao, cor: cores.get(ligacao.de) ?? 1, mesmaPasta: mesmaPasta(e.quadros, ligacao.de, ligacao.para) }
    return {
      id: ligacao.id,
      type: 'time',
      source: ligacao.de,
      target: ligacao.para,
      sourceHandle: BOLINHA_SAIDA,
      targetHandle: BOLINHA_ENTRADA,
      className: classeDaLinha(data),
      markerEnd: { type: MarkerType.ArrowClosed, color: corDaLinha(data), width: 18, height: 18 },
      data,
    }
  })
}

/** O quadro trocou de conta: a tela tira as linhas que o main tambem tirou. */
export function comQuadroNovo(e: EstadoTela, novo: Quadro): EstadoTela {
  const depois = { ...e, quadros: e.quadros.map((q) => (q.id === novo.id ? novo : q)) }
  return { ...depois, ligacoes: ligacoesValidas(dadosDaTela(depois)) }
}

/** Troca uma linha (ajustada) ou tira (null). */
export function comLigacao(e: EstadoTela, id: string, nova: Ligacao | null): EstadoTela {
  const ligacoes = e.ligacoes ?? []
  if (!nova) return { ...e, ligacoes: ligacoes.filter((l) => l.id !== id) }
  const existe = ligacoes.some((l) => l.id === id)
  return { ...e, ligacoes: existe ? ligacoes.map((l) => (l.id === id ? nova : l)) : [...ligacoes, nova] }
}
