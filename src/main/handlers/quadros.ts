import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import type { ServicoQuadros } from '../quadros/servico'

const Criar = z.object({
  repoId: z.string().min(1),
  tipo: z.enum(['terminal', 'agente']),
  perfilId: z.string().min(1).optional(),
})
const Remover = z.object({ quadroId: z.string().min(1) })

export function registrarHandlersQuadros(quadros: ServicoQuadros): void {
  handle(IPC.quadrosCriar, Criar, ({ repoId, tipo, perfilId }) => quadros.criar(repoId, tipo, perfilId))
  handle(IPC.quadrosRemover, Remover, ({ quadroId }) => quadros.remover(quadroId))
}
