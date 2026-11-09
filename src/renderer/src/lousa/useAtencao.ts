// Guarda unica dos avisos dos agentes na tela (T8.2): o quadro, a barra de cima e o minimapa leem
// daqui. Fica fora do React (uma inscricao so no main) e o React le com useSyncExternalStore.
import { useSyncExternalStore } from 'react'
import type { AvisoAgente } from '../../../shared/model'
import { aplicarAviso, esquecerAviso, marcarVisto, type Atencao, type MapaAtencao } from './atencao'

let mapa: MapaAtencao = new Map()
const ouvintes = new Set<() => void>()
let inscrito = false

function trocar(novo: MapaAtencao): void {
  if (novo === mapa) return
  mapa = novo
  for (const ouvinte of ouvintes) ouvinte()
}

function inscrever(ouvinte: () => void): () => void {
  if (!inscrito) {
    inscrito = true
    window.lousa.terminais.aoEstado((id, aviso) => trocar(aplicarAviso(mapa, id, aviso, Date.now())))
    // terminal encerrado ou agente dormindo: o "trabalhando" ou o "terminou" de antes nao fica preso
    window.lousa.terminais.aoSair((id) => trocar(esquecerAviso(mapa, id)))
    window.lousa.agentes.aoDormir((id) => trocar(esquecerAviso(mapa, id)))
  }
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export const atencao = {
  /** Estado que veio junto com a abertura do terminal (a tela remontou). */
  aplicar: (id: string, aviso: AvisoAgente): void => trocar(aplicarAviso(mapa, id, aviso, Date.now())),
  marcarVisto: (id: string): void => trocar(marcarVisto(mapa, id)),
}

export function useMapaAtencao(): MapaAtencao {
  return useSyncExternalStore(inscrever, () => mapa)
}

export function useAtencao(id: string): Atencao | undefined {
  return useMapaAtencao().get(id)
}
