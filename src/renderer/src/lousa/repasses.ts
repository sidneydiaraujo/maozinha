// O ultimo repasse de cada linha do time (T30.1), fora do React: cada linha le o dela. "Passou" e
// "fechado" somem sozinhos; "perguntar" e o freio ficam ate o clique.
import { useSyncExternalStore } from 'react'
import type { EventoRepasse } from '../../../shared/model'
import { LIMITE_REPASSES } from '../../../shared/time'

/** Quanto tempo "passou" e "fechado" ficam na linha. */
export const MOSTRAR_AVISO_MS = 6000

let mapa: ReadonlyMap<string, EventoRepasse> = new Map()
const ouvintes = new Set<() => void>()
let inscrito = false

function trocar(novo: ReadonlyMap<string, EventoRepasse>): void {
  mapa = novo
  for (const ouvinte of ouvintes) ouvinte()
}

export function limparRepasse(ligacaoId: string): void {
  if (!mapa.has(ligacaoId)) return
  const novo = new Map(mapa)
  novo.delete(ligacaoId)
  trocar(novo)
}

export function guardarRepasse(evento: EventoRepasse): void {
  trocar(new Map(mapa).set(evento.ligacaoId, evento))
  if (evento.tipo !== 'repassou' && evento.tipo !== 'descartado') return
  setTimeout(() => {
    if (mapa.get(evento.ligacaoId) === evento) limparRepasse(evento.ligacaoId)
  }, MOSTRAR_AVISO_MS)
}

function inscrever(ouvinte: () => void): () => void {
  if (!inscrito) {
    inscrito = true
    window.lousa.time.aoRepasse(guardarRepasse)
  }
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function useRepasse(ligacaoId: string): EventoRepasse | undefined {
  return useSyncExternalStore(inscrever, () => mapa).get(ligacaoId)
}

export interface RotuloRepasse {
  texto: string
  dica: string
  /** O clique passa o trabalho agora (em vez de abrir o menu da linha). */
  passa: boolean
}

/** O que a linha diz depois de um repasse. Puro. */
export function rotuloDoRepasse(e: EventoRepasse): RotuloRepasse {
  switch (e.tipo) {
    case 'repassou':
      return { texto: `→ passou para ${e.para}`, dica: 'O colega recebe o trabalho assim que estiver parado.', passa: false }
    case 'perguntar':
      return { texto: `▶ Passar para ${e.para}`, dica: 'O colega terminou. Clique para passar o trabalho agora.', passa: true }
    case 'limite':
      return {
        texto: `Limite de ${LIMITE_REPASSES} repasses: Continuar?`,
        dica: `${LIMITE_REPASSES} repasses seguidos sem você digitar no time. Clique para passar e retomar a linha.`,
        passa: true,
      }
    case 'descartado':
      return { texto: `${e.para} está fechado`, dica: 'O trabalho não passou: o colega estava fechado.', passa: false }
  }
}
