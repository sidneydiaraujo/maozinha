// Ampliar um quadro (T8.4): duplo clique no cabecalho (ou o botao) enquadra o quadro na tela;
// de novo no mesmo quadro, volta para a vista de antes. Posicao e tamanho dos quadros nao mudam.
import type { ReactFlowInstance, Viewport } from '@xyflow/react'
import { useCallback, useRef, type RefObject } from 'react'
import type { NoLousa } from './notas'

const DURACAO_MS = 300

export function useAmpliar(instancia: RefObject<ReactFlowInstance<NoLousa> | null>): (quadroId: string) => void {
  const ampliado = useRef<{ id: string; vista: Viewport } | null>(null)
  return useCallback(
    (quadroId: string) => {
      const flow = instancia.current
      if (!flow) return
      const atual = ampliado.current
      if (atual?.id === quadroId) {
        ampliado.current = null
        void flow.setViewport(atual.vista, { duration: DURACAO_MS })
        return
      }
      // de um quadro ampliado para outro: a volta continua sendo a vista de antes do primeiro
      ampliado.current = { id: quadroId, vista: atual?.vista ?? flow.getViewport() }
      void flow.fitView({ nodes: [{ id: quadroId }], padding: 0.03, maxZoom: 2, duration: DURACAO_MS })
    },
    [instancia],
  )
}
