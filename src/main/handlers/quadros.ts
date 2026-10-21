import { z } from 'zod'
import { IPC } from '../../shared/ipc'
import { handle } from '../ipc'
import type { ServicoQuadros } from '../quadros/servico'
import type { ApresentadorTime } from '../time/apresentar'

const Criar = z.object({
  repoId: z.string().min(1),
  tipo: z.enum(['terminal', 'agente']),
  perfilId: z.string().min(1),
  posicao: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
  separado: z.boolean().optional(),
})
const Remover = z.object({ quadroId: z.string().min(1) })
const TrocarConta = z.object({ quadroId: z.string().min(1), perfilId: z.string().min(1) })
const DefinirPapel = z.object({ quadroId: z.string().min(1), papel: z.string().max(200) })

/** `time.mudou()`: fechar, trocar a conta ou dar papel muda o que o time ouve (T29.1). */
export function registrarHandlersQuadros(quadros: ServicoQuadros, time: Pick<ApresentadorTime, 'mudou'>): void {
  const eAvisa = <T>(feito: T): T => {
    time.mudou()
    return feito
  }
  handle(IPC.quadrosCriar, Criar, async ({ repoId, tipo, perfilId, posicao, separado }) =>
    separado
      ? quadros.criarEmCopia(repoId, tipo, perfilId, posicao)
      : { quadro: quadros.criar(repoId, tipo, perfilId, posicao), repo: null },
  )
  handle(IPC.quadrosRemover, Remover, async ({ quadroId }) => eAvisa(await quadros.remover(quadroId)))
  handle(IPC.quadrosTrocarConta, TrocarConta, async ({ quadroId, perfilId }) =>
    eAvisa(await quadros.trocarConta(quadroId, perfilId)),
  )
  handle(IPC.quadrosDefinirPapel, DefinirPapel, ({ quadroId, papel }) => eAvisa(quadros.definirPapel(quadroId, papel)))
}
