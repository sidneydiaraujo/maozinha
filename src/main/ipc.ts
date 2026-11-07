import { ipcMain, type IpcMainInvokeEvent } from 'electron'
import type { z } from 'zod'
import { log } from './log'
import { paginaDoApp } from './paginaDoApp'
import { isTrustedUrl } from './security'

const pagina = paginaDoApp()

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
    if (!isTrustedUrl(origem, pagina)) {
      throw new Error(`IPC recusado: origem fora do app (${canal})`)
    }
    try {
      return await executar(schema.parse(bruto))
    } catch (erro) {
      // vai para o arquivo de registros (T8.6); a tela recebe o mesmo erro de sempre
      log('warn', `canal ${canal} falhou: ${erro instanceof Error ? erro.message : String(erro)}`)
      throw erro
    }
  })
}
