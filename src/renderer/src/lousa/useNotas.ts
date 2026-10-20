import type { ReactFlowInstance } from '@xyflow/react'
import { useCallback, useEffect, useMemo, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { EstadoTela } from '../../../shared/model'
import { aoPedirNovaNota } from './foco'
import { comTextoDaNota, METADE_NOTA, type AcoesNota, type NoLousa } from './notas'

interface Opcoes {
  instancia: RefObject<ReactFlowInstance<NoLousa> | null>
  area: RefObject<HTMLDivElement | null>
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>
  falhou(erro: unknown): void
}

/** Notas da lousa (T26.2, D34): criar no centro da vista ("+ Nota" e Ctrl+K), salvar e apagar. */
export function useNotas({ instancia, area, setEstado, falhou }: Opcoes): { acoes: AcoesNota; criarNoCentro(): void } {
  const acoes = useMemo<AcoesNota>(
    () => ({
      salvar: (notaId, texto) => {
        window.lousa.notas
          .salvar(notaId, texto)
          .then(() => setEstado((e) => e && comTextoDaNota(e, notaId, texto)))
          .catch(falhou)
      },
      remover: (notaId) => {
        window.lousa.notas
          .remover(notaId)
          .then(() => setEstado((e) => e && { ...e, notas: (e.notas ?? []).filter((n) => n.id !== notaId) }))
          .catch(falhou)
      },
    }),
    [setEstado, falhou],
  )

  const criarNoCentro = useCallback(() => {
    const r = area.current?.getBoundingClientRect()
    const centro = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 600, y: 400 }
    const naLousa = instancia.current?.screenToFlowPosition(centro) ?? centro
    window.lousa.notas
      .criar({ x: naLousa.x - METADE_NOTA.x, y: naLousa.y - METADE_NOTA.y })
      .then((nota) => setEstado((e) => e && { ...e, notas: [...(e.notas ?? []), nota] }))
      .catch(falhou)
  }, [area, instancia, setEstado, falhou])

  // Ctrl+K "Nova nota"
  useEffect(() => aoPedirNovaNota(criarNoCentro), [criarNoCentro])

  return { acoes, criarNoCentro }
}
