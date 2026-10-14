import type { Node, NodeChange, Viewport } from '@xyflow/react'
import { useCallback, useEffect, useRef } from 'react'
import type { LayoutLousa } from '../../../shared/ipc'
import { caixaDoNo } from './nos'

const ESPERA_SALVAR_MS = 500

function layoutDosNos(nos: Node[], viewport: Viewport): LayoutLousa {
  return { quadros: nos.map((no) => ({ id: no.id, caixa: caixaDoNo(no) })), viewport }
}

interface Opcoes<N extends Node> {
  nos: N[]
  aoMudarNos(mudancas: NodeChange<N>[]): void
  viewportInicial: Viewport | undefined
  aoFalhar(erro: unknown): void
}

/**
 * Guarda posicao, tamanho e zoom (T3.5): depois de soltar ou redimensionar um
 * no, ou de mover a vista, espera 500 ms e manda tudo de uma vez ao main.
 */
export function useSalvarLayout<N extends Node>({ nos, aoMudarNos, viewportInicial, aoFalhar }: Opcoes<N>): {
  aoMudar(mudancas: NodeChange<N>[]): void
  aoMoverVista(viewport: Viewport): void
} {
  const nosAtuais = useRef<Node[]>([])
  const viewportAtual = useRef<Viewport | null>(null)
  const relogio = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    nosAtuais.current = nos
  }, [nos])
  useEffect(() => {
    if (viewportInicial && !viewportAtual.current) viewportAtual.current = viewportInicial
  }, [viewportInicial])
  useEffect(() => () => clearTimeout(relogio.current), [])

  const agendar = useCallback(() => {
    clearTimeout(relogio.current)
    relogio.current = setTimeout(() => {
      const viewport = viewportAtual.current
      if (!viewport) return
      window.lousa.lousa.salvarLayout(layoutDosNos(nosAtuais.current, viewport)).catch(aoFalhar)
    }, ESPERA_SALVAR_MS)
  }, [aoFalhar])

  const aoMudar = useCallback(
    (mudancas: NodeChange<N>[]) => {
      aoMudarNos(mudancas)
      const terminou = mudancas.some(
        (m) => (m.type === 'position' && m.dragging === false) || (m.type === 'dimensions' && m.resizing === false),
      )
      if (terminou) agendar()
    },
    [aoMudarNos, agendar],
  )

  const aoMoverVista = useCallback(
    (viewport: Viewport) => {
      viewportAtual.current = viewport
      agendar()
    },
    [agendar],
  )

  return { aoMudar, aoMoverVista }
}
