import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { EstadoTela } from '../../shared/model'
import type { Contexto } from '../contexto'
import { handle } from '../ipc'
import { aplicarLayout, SchemaLayout } from '../lousa/layout'

/** Tudo que a tela precisa para desenhar a lousa de uma vez so. */
export function registrarHandlersLousa(contexto: Contexto): void {
  handle(IPC.lousaSalvarLayout, SchemaLayout, (layout) => {
    contexto.armazem.salvar(aplicarLayout(contexto.armazem.carregar(), layout))
  })
  handle(IPC.lousaCarregar, z.undefined(), async (): Promise<EstadoTela> => {
    const estado = contexto.armazem.carregar()
    return {
      perfis: await contexto.perfis.listar(),
      repos: estado.repos,
      quadros: estado.quadros,
      viewport: estado.viewport,
    }
  })
}
