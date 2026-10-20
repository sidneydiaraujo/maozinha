// Painel de cada agente na tela (T18.1): o que a linha de status contou (T17.2). Uma inscricao so no
// main, fora do React, como os avisos (useAtencao); o quadro remontado pede o ultimo ao main.
import { useEffect, useSyncExternalStore } from 'react'
import type { PainelAgente } from '../../../shared/model'

let mapa: ReadonlyMap<string, PainelAgente> = new Map()
const ouvintes = new Set<() => void>()
let inscrito = false

function guardar(id: string, painel: PainelAgente): void {
  const atual = mapa.get(id)
  if (atual && atual.quando >= painel.quando) return
  mapa = new Map(mapa).set(id, painel)
  for (const ouvinte of ouvintes) ouvinte()
}

function inscrever(ouvinte: () => void): () => void {
  if (!inscrito) {
    inscrito = true
    window.lousa.agentes.aoPainel(guardar)
  }
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function usePainel(quadroId: string): PainelAgente | undefined {
  useEffect(() => {
    if (mapa.has(quadroId)) return
    window.lousa.agentes
      .ultimoPainel(quadroId)
      .then((p) => p && guardar(quadroId, p))
      .catch(() => {
        // sem painel: o anel so nao aparece
      })
  }, [quadroId])
  return useSyncExternalStore(inscrever, () => mapa).get(quadroId)
}
