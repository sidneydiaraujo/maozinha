// Quais quadros pedem atencao (T8.2): o agente mandou "esperando voce", "terminou" ou "erro"
// pelo OSC 7501 (T8.1) e o Sidney ainda nao clicou no quadro. Funcoes puras.
import type { AvisoAgente } from '../../../shared/model'

export interface Atencao {
  aviso: AvisoAgente
  /** O Sidney clicou no quadro depois do aviso: o brilho apaga, o selo fica. */
  visto: boolean
}

export type MapaAtencao = ReadonlyMap<string, Atencao>

const CHAMAM = new Set(['esperando', 'terminou', 'erro'])

export const chamaAtencao = (a: Atencao | undefined): boolean => !!a && !a.visto && CHAMAM.has(a.aviso.estado)

const iguais = (a: AvisoAgente, b: AvisoAgente): boolean =>
  a.estado === b.estado && a.motivo === b.motivo && a.mensagem === b.mensagem

/** Aviso repetido nao muda nada (nem desfaz o "visto"); aviso novo volta a chamar. */
export function aplicarAviso(mapa: MapaAtencao, id: string, aviso: AvisoAgente): MapaAtencao {
  const atual = mapa.get(id)
  if (atual && iguais(atual.aviso, aviso)) return mapa
  return new Map(mapa).set(id, { aviso, visto: false })
}

export function marcarVisto(mapa: MapaAtencao, id: string): MapaAtencao {
  const atual = mapa.get(id)
  if (!atual || atual.visto) return mapa
  return new Map(mapa).set(id, { ...atual, visto: true })
}

/** Proximo quadro (na ordem da lousa) que pede atencao depois de `ultimo`, dando a volta. */
export function proximoAChamar(mapa: MapaAtencao, ordem: string[], ultimo: string | null): string | null {
  const chamando = ordem.filter((id) => chamaAtencao(mapa.get(id)))
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
