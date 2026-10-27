// Historico da sessao (A10, D48): cada terminal que passou pela lousa desde que o programa abriu,
// o mais recente em cima. Os abertos levam ao quadro; os fechados ficam apagados, so de registro.
// Funcoes puras: a tela (Historico.tsx) le os quadros, os avisos dos agentes e o relogio.
import type { EstadoAgente, TipoQuadro } from '../../../shared/model'

/** O que a lateral precisa saber de um quadro aberto agora. */
export interface QuadroVisto {
  quadroId: string
  nome: string
  pasta: string
  conta: string
  cor: string
  tipo: TipoQuadro
}

export interface ItemHistorico extends QuadroVisto {
  abertoEm: number
  /** Ultima vez que o terminal mostrou algo ou o agente mudou de estado. */
  ultimoEm: number
  estado?: EstadoAgente
  /** Preenchido quando o quadro saiu da lousa nesta sessao. */
  fechadoEm?: number
}

/**
 * Junta os quadros de agora ao historico: quadro novo entra (aberto agora), quadro que sumiu fica
 * como fechado, quadro que voltou (desfazer) reabre. Nome, pasta e conta seguem os de agora.
 */
export function juntarQuadros(itens: ItemHistorico[], quadros: QuadroVisto[], agora: number): ItemHistorico[] {
  const vistos = new Map(quadros.map((q) => [q.quadroId, q]))
  const antigos = itens.map((item): ItemHistorico => {
    const atual = vistos.get(item.quadroId)
    if (!atual) return item.fechadoEm === undefined ? { ...item, fechadoEm: agora } : item
    const { fechadoEm: _fechado, ...aberto } = item
    return { ...aberto, ...atual }
  })
  const conhecidos = new Set(itens.map((i) => i.quadroId))
  const novos = quadros
    .filter((q) => !conhecidos.has(q.quadroId))
    .map((q): ItemHistorico => ({ ...q, abertoEm: agora, ultimoEm: agora }))
  return [...antigos, ...novos]
}

/** O terminal mostrou algo ou o agente mudou de estado: sobe na lista. */
export function marcarAtividade(itens: ItemHistorico[], quadroId: string, agora: number, estado?: EstadoAgente): ItemHistorico[] {
  return itens.map((i) => (i.quadroId === quadroId && i.fechadoEm === undefined ? { ...i, ultimoEm: agora, ...(estado ? { estado } : {}) } : i))
}

/** Abertos primeiro (o mais recente em cima), depois os fechados (o fechado por ultimo em cima). */
export function emOrdem(itens: ItemHistorico[]): ItemHistorico[] {
  const abertos = itens.filter((i) => i.fechadoEm === undefined).sort((a, b) => b.ultimoEm - a.ultimoEm)
  const fechados = itens.filter((i) => i.fechadoEm !== undefined).sort((a, b) => (b.fechadoEm ?? 0) - (a.fechadoEm ?? 0))
  return [...abertos, ...fechados]
}

const ESTADOS: Record<EstadoAgente, string> = {
  trabalhando: 'trabalhando',
  esperando: 'esperando você',
  terminou: 'terminou',
  parado: 'parado',
  erro: 'erro',
}

/** "agora", "há 5 min", "há 2 h". */
export function haQuanto(desde: number, agora: number): string {
  const minutos = Math.floor((agora - desde) / 60_000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  return `há ${Math.floor(minutos / 60)} h`
}

/** Segunda linha do item: "pasta · conta · estado · há 5 min" (ou "fechado há 5 min"). */
export function detalheDoItem(item: ItemHistorico, agora: number): string {
  const partes = [item.pasta, item.conta]
  if (item.fechadoEm !== undefined) return [...partes, `fechado ${haQuanto(item.fechadoEm, agora)}`].join(' · ')
  if (item.estado) partes.push(ESTADOS[item.estado])
  partes.push(haQuanto(item.ultimoEm, agora))
  return partes.join(' · ')
}
