import type { ReactFlowInstance, Viewport } from '@xyflow/react'
import { useCallback, type RefObject } from 'react'
import type { NoLousa } from './notas'

/** Botao do meio do mouse (o esquerdo fica com o terminal e o cabecalho do quadro). */
const BOTAO_MEIO = 1

/**
 * Arrastar com o botao do meio move a lousa em qualquer ponto, ate por cima dos
 * quadros: com zoom alto os quadros cobrem a tela e nao sobra espaco vazio.
 * Use no `onMouseDownCapture` da area, para chegar antes do terminal.
 */
export function usePanoMeio(
  instancia: RefObject<ReactFlowInstance<NoLousa> | null>,
  aoMoverVista: (viewport: Viewport) => void,
  /** Arrastar desfaz o quadro ampliado (o proximo ⤢ amplia de novo). */
  aoComecar: () => void,
): (e: React.MouseEvent) => void {
  return useCallback(
    (e: React.MouseEvent) => {
      const i = instancia.current
      if (e.button !== BOTAO_MEIO || !i) return
      // Sem isso o Windows liga a rolagem automatica e o terminal recebe o clique.
      e.preventDefault()
      e.stopPropagation()
      aoComecar()
      const inicio = { x: e.clientX, y: e.clientY, vista: i.getViewport() }
      const mover = (m: MouseEvent): void => {
        void i.setViewport({
          ...inicio.vista,
          x: inicio.vista.x + m.clientX - inicio.x,
          y: inicio.vista.y + m.clientY - inicio.y,
        })
      }
      const soltar = (): void => {
        window.removeEventListener('mousemove', mover)
        window.removeEventListener('mouseup', soltar)
        aoMoverVista(i.getViewport())
      }
      window.addEventListener('mousemove', mover)
      window.addEventListener('mouseup', soltar)
    },
    [instancia, aoMoverVista, aoComecar],
  )
}
