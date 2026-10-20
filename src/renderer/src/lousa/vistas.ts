// Vistas salvas (T27.2, D35): voltar a uma arrumacao guardada. A lista e os pedidos do Ctrl+K
// passam por aqui, porque a paleta fica fora da lousa.
import type { Node } from '@xyflow/react'
import { useSyncExternalStore } from 'react'
import type { VistaSalva } from '../../../shared/model'

/** Cada no que esta na vista volta para a caixa guardada; quem nasceu depois fica onde esta. Puro. */
export function aplicarVista<N extends Node>(nos: N[], vista: Pick<VistaSalva, 'caixas'>): N[] {
  return nos.map((no) => {
    const c = vista.caixas[no.id]
    if (!c) return no
    return { ...no, position: { x: c.x, y: c.y }, width: c.largura, height: c.altura, style: { ...no.style, width: c.largura, height: c.altura } }
  })
}

export type PedidoVista = { tipo: 'ir'; vistaId: string } | { tipo: 'guardar'; nome: string } | { tipo: 'apagar'; vistaId: string }

const ouvintes = new Set<(p: PedidoVista) => void>()

export function pedirVista(pedido: PedidoVista): void {
  for (const ouvinte of ouvintes) ouvinte(pedido)
}

export function aoPedirVista(cb: (p: PedidoVista) => void): () => void {
  ouvintes.add(cb)
  return () => ouvintes.delete(cb)
}

// A lista atual, publicada pela lousa e lida pela paleta.
let lista: VistaSalva[] = []
const assinantes = new Set<() => void>()

export function publicarVistas(novas: VistaSalva[]): void {
  if (novas === lista) return
  lista = novas
  assinantes.forEach((a) => a())
}

export function useListaVistas(): VistaSalva[] {
  return useSyncExternalStore(
    (avisar) => {
      assinantes.add(avisar)
      return () => assinantes.delete(avisar)
    },
    () => lista,
  )
}
