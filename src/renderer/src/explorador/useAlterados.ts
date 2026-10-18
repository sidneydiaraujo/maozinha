// Marca dos arquivos que os terminais mexeram (T7.3), com um relogio para a marca
// "escrevendo" virar "alterado" e o "ha 2 min" andar sozinho.
import { useCallback, useEffect, useState } from 'react'
import { anotar, limpar } from './alterados'

const TIQUE_MS = 2_000

export function useAlterados() {
  const [alterados, setAlterados] = useState<Map<string, number>>(new Map())
  const [agora, setAgora] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), TIQUE_MS)
    return () => window.clearInterval(id)
  }, [])

  const anotarMudancas = useCallback((repoId: string, caminhos: string[]) => {
    const t = Date.now()
    setAgora(t)
    setAlterados((a) => limpar(anotar(a, repoId, caminhos, t), t))
  }, [])

  return { alterados, agora, anotarMudancas }
}
