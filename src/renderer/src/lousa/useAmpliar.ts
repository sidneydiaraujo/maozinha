// Ampliar um quadro (T8.4): duplo clique no cabecalho (ou o botao) enquadra o quadro na tela;
// de novo no mesmo quadro, volta para a vista de antes. Posicao e tamanho dos quadros nao mudam.
import { getViewportForBounds, type ReactFlowInstance, type Viewport } from '@xyflow/react'
import { useCallback, useMemo, useRef, type RefObject } from 'react'
import type { NoLousa } from './notas'

const DURACAO_MS = 300

/** "Reduzir movimento" ligado no Windows (e nas provas): a camera vai direto, sem animar. */
const duracao = (): number => (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : DURACAO_MS)
/** Folga em volta do quadro ampliado (fracao da tela) e os limites de zoom da lousa. */
const FOLGA = 0.03
const ZOOM_MENOR = 0.2
const ZOOM_MAIOR = 2

export interface Ampliacao {
  ampliar(quadroId: string): void
  /** O usuario mexeu na vista: o proximo ⤢ amplia de novo, em vez de voltar a uma vista antiga (D38). */
  esquecer(): void
}

export function useAmpliar(
  instancia: RefObject<ReactFlowInstance<NoLousa> | null>,
  area: RefObject<HTMLDivElement | null>,
): Ampliacao {
  const ampliado = useRef<{ id: string; vista: Viewport } | null>(null)
  const ampliar = useCallback(
    (quadroId: string) => {
      const flow = instancia.current
      const tela = area.current?.getBoundingClientRect()
      if (!flow || !tela || !flow.getNode(quadroId)) return
      const atual = ampliado.current
      if (atual?.id === quadroId) {
        ampliado.current = null
        void flow.setViewport(atual.vista, { duration: duracao() })
        return
      }
      // de um quadro ampliado para outro: a volta continua sendo a vista de antes do primeiro
      ampliado.current = { id: quadroId, vista: atual?.vista ?? flow.getViewport() }
      // Conta e move na hora. O fitView do React Flow 12 entra numa fila que espera um quadro de
      // animacao; na janela escondida das provas ele as vezes nem rodava (D38).
      const limites = flow.getNodesBounds([quadroId])
      const vista = getViewportForBounds(limites, tela.width, tela.height, ZOOM_MENOR, ZOOM_MAIOR, FOLGA)
      void flow.setViewport(vista, { duration: duracao() })
    },
    [instancia, area],
  )
  return useMemo(
    () => ({
      ampliar,
      esquecer: () => {
        ampliado.current = null
      },
    }),
    [ampliar],
  )
}
