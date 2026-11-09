// Quais quadros pedem atencao (T8.2): o agente mandou "esperando voce", "terminou" ou "erro"
// pelo OSC 7501 (T8.1) e o Sidney ainda nao clicou no quadro. Funcoes puras.
import type { AvisoAgente } from '../../../shared/model'

export interface Atencao {
  aviso: AvisoAgente
  /** O Sidney clicou no quadro depois do aviso: o brilho apaga, o selo fica. */
  visto: boolean
  /** Quando o aviso chegou (ms): a fila de prontos (A26) segue a ordem em que terminaram. */
  quando: number
}

export type MapaAtencao = ReadonlyMap<string, Atencao>

const CHAMAM = new Set(['esperando', 'terminou', 'erro'])

export const chamaAtencao = (a: Atencao | undefined): boolean => !!a && !a.visto && CHAMAM.has(a.aviso.estado)

/** Pede uma acao do Sidney (esperando ou erro); o "terminou" vai para a fila de prontos (A26). */
export const pedeAcao = (a: Atencao | undefined): boolean => chamaAtencao(a) && a?.aviso.estado !== 'terminou'

const iguais = (a: AvisoAgente, b: AvisoAgente): boolean =>
  a.estado === b.estado && a.motivo === b.motivo && a.mensagem === b.mensagem

/** Aviso repetido nao muda nada (nem desfaz o "visto"); aviso novo volta a chamar. */
export function aplicarAviso(mapa: MapaAtencao, id: string, aviso: AvisoAgente, agora = 0): MapaAtencao {
  const atual = mapa.get(id)
  if (atual && iguais(atual.aviso, aviso)) return mapa
  return new Map(mapa).set(id, { aviso, visto: false, quando: agora })
}

/** O terminal saiu ou o agente dormiu (R3.13): o ultimo estado dele nao vale mais (sem selo nem brilho). */
export function esquecerAviso(mapa: MapaAtencao, id: string): MapaAtencao {
  if (!mapa.has(id)) return mapa
  const novo = new Map(mapa)
  novo.delete(id)
  return novo
}

export function marcarVisto(mapa: MapaAtencao, id: string): MapaAtencao {
  const atual = mapa.get(id)
  if (!atual || atual.visto) return mapa
  return new Map(mapa).set(id, { ...atual, visto: true })
}

/** Proximo quadro (na ordem da lousa) que pede uma acao depois de `ultimo`, dando a volta. */
export function proximoAChamar(mapa: MapaAtencao, ordem: string[], ultimo: string | null): string | null {
  const chamando = ordem.filter((id) => pedeAcao(mapa.get(id)))
  if (chamando.length === 0) return null
  const depois = ultimo === null ? -1 : ordem.indexOf(ultimo)
  return chamando.find((id) => ordem.indexOf(id) > depois) ?? chamando[0] ?? null
}

const TEXTO_ESPERA = { permissao: 'pedindo permissão', pergunta: 'pergunta para você', login: 'entrar de novo' }

/** Selo no cabecalho do quadro; null quando o agente esta parado (nada a dizer). */
export function seloDoAviso(aviso: AvisoAgente): { texto: string; classe: string } | null {
  switch (aviso.estado) {
    case 'trabalhando':
      return { texto: 'trabalhando', classe: 'selo-trabalhando' }
    case 'esperando':
      return { texto: aviso.motivo ? TEXTO_ESPERA[aviso.motivo] : 'esperando você', classe: 'selo-esperando' }
    case 'terminou':
      return { texto: 'terminou', classe: 'selo-terminou' }
    case 'erro':
      return { texto: 'erro', classe: 'selo-erro' }
    default:
      return null
  }
}

/** Brilho que corre na borda (T21.2): no maximo 4 animando; os outros ficam com a borda parada (D17). */
export const MAX_BRILHANDO = 4

const trabalhando = (a: Atencao | undefined): boolean => a?.aviso.estado === 'trabalhando'

/** 'anima' para os 4 primeiros trabalhando (na ordem em que avisaram), 'parado' para os demais. */
export function brilhoDoQuadro(mapa: MapaAtencao, id: string): 'anima' | 'parado' | null {
  if (!trabalhando(mapa.get(id))) return null
  let antes = 0
  for (const [outro, a] of mapa) {
    if (outro === id) break
    if (trabalhando(a)) antes++
  }
  return antes < MAX_BRILHANDO ? 'anima' : 'parado'
}

/** Pilula do alto: "● 2 esperando você · 3 trabalhando"; null sem nenhum dos dois. */
export function textoDaPilula(mapa: MapaAtencao, ordem: string[]): string | null {
  const esperando = ordem.filter((id) => pedeAcao(mapa.get(id))).length
  const ocupados = ordem.filter((id) => trabalhando(mapa.get(id))).length
  const partes = [
    ...(esperando > 0 ? [`${esperando} esperando você`] : []),
    ...(ocupados > 0 ? [`${ocupados} trabalhando`] : []),
  ]
  return partes.length > 0 ? `● ${partes.join(' · ')}` : null
}
