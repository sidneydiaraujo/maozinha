import type { ReactFlowInstance, Viewport } from '@xyflow/react'
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { EstadoTela, VistaSalva } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { caixaDoNo } from './nos'
import type { NoLousa } from './notas'
import { aoPedirVista, aplicarVista, publicarVistas, type PedidoVista } from './vistas'

interface Opcoes {
  instancia: RefObject<ReactFlowInstance<NoLousa> | null>
  estado: EstadoTela | null
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>
  nos: NoLousa[]
  setNos: Dispatch<SetStateAction<NoLousa[]>>
  /** Guarda a camera e as caixas (o mesmo caminho de quando o usuario mexe na lousa). */
  aoMoverVista(viewport: Viewport): void
  avisar(texto: string): void
}

/** Vistas salvas (T27.2, D35): atende "ir", "guardar" e "apagar" que vem do Ctrl+K. */
export function useVistasSalvas(o: Opcoes): void {
  const atual = useRef(o)
  useEffect(() => {
    atual.current = o
  })
  const vistas = o.estado?.vistas
  useEffect(() => publicarVistas(vistas ?? []), [vistas])

  useEffect(
    () =>
      aoPedirVista((pedido: PedidoVista) => {
        const { instancia, estado, setEstado, nos, setNos, aoMoverVista, avisar } = atual.current
        const trocarLista = (novas: VistaSalva[]): void => setEstado((e) => e && { ...e, vistas: novas })
        const falhar = (e: unknown): void => avisar(mensagemDe(e))
        if (pedido.tipo === 'ir') {
          const vista = estado?.vistas?.find((v) => v.id === pedido.vistaId)
          if (!vista) return
          setNos((atuais) => aplicarVista(atuais, vista))
          void instancia.current?.setViewport(vista.viewport, { duration: 400 })
          aoMoverVista(vista.viewport)
          avisar(`Vista "${vista.nome}"`)
        } else if (pedido.tipo === 'guardar') {
          const viewport = instancia.current?.getViewport() ?? estado?.viewport ?? { x: 0, y: 0, zoom: 1 }
          const layout = { quadros: nos.map((n) => ({ id: n.id, caixa: caixaDoNo(n) })), viewport }
          window.lousa.vistas
            .salvar(pedido.nome, layout)
            .then((novas) => {
              trocarLista(novas)
              avisar(`Vista "${pedido.nome.trim()}" guardada`)
            })
            .catch(falhar)
        } else {
          window.lousa.vistas.remover(pedido.vistaId).then(trocarLista).catch(falhar)
        }
      }),
    [],
  )
}
