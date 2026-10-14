import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import type { ServicoQuadros } from '../quadros/servico'

const Criar = z.object({
  repoId: z.string().min(1),
  tipo: z.enum(['terminal', 'agente']),
  perfilId: z.string().min(1),
  posicao: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
})
const Remover = z.object({ quadroId: z.string().min(1) })

export function registrarHandlersQuadros(quadros: ServicoQuadros): void {
  handle(IPC.quadrosCriar, Criar, ({ repoId, tipo, perfilId, posicao }) =>
    quadros.criar(repoId, tipo, perfilId, posicao),
  )
  handle(IPC.quadrosRemover, Remover, ({ quadroId }) => quadros.remover(quadroId))
}
