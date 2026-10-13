import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { z } from 'zod'
import { isTrustedUrl } from './security'

/**
 * Registra um canal de pedido/resposta. Toda entrada vinda da tela passa pelo
 * schema zod antes de chegar na regra; origem fora do app e recusada.
 */
export function handle<S extends z.ZodType, R>(
  canal: string,
  schema: S,
  executar: (entrada: z.infer<S>) => Promise<R> | R,
): void {
  ipcMain.handle(canal, async (evento: IpcMainInvokeEvent, bruto: unknown) => {
    const origem = evento.senderFrame?.url ?? ''
    if (!isTrustedUrl(origem, process.env['ELECTRON_RENDERER_URL'])) {
      throw new Error(`IPC recusado: origem fora do app (${canal})`)
    }
    return executar(schema.parse(bruto))
  })
}
