// Canais dos agentes (T17.2, D24): o painel que a linha de status de cada agente conta.
import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import type { PonteAgentes } from '../agentes/ponte'
import { handle } from '../ipc'

export function registrarHandlersAgentes(agentes: PonteAgentes): void {
  handle(IPC.agentesUltimoPainel, z.object({ quadroId: z.string().min(1).max(80) }), ({ quadroId }) =>
    agentes.ultimo(quadroId),
  )
}
