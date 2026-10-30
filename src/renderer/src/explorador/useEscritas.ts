// A16: a pasta do projeto onde cada agente salvou por ultimo (o main so avisa quando muda).
import { useEffect, useState } from 'react'
import type { OndeEscreve } from '../../../shared/model'

export function useEscritas(): OndeEscreve[] {
  const [porQuadro, setPorQuadro] = useState<ReadonlyMap<string, OndeEscreve>>(new Map())
  useEffect(
    () => window.lousa.agentes.aoEscrevendo((onde) => setPorQuadro((m) => new Map(m).set(onde.quadroId, onde))),
    [],
  )
  return [...porQuadro.values()]
}
