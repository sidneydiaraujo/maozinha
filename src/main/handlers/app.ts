import { app, clipboard } from 'electron'
import { z } from 'zod'
import { IPC, type AppInfo } from '../../shared/ipc'
import { handle } from '../ipc'

const LIMITE_TEXTO = 5_000_000

export function registrarHandlersApp(): void {
  handle(
    IPC.appInfo,
    z.undefined(),
    (): AppInfo => ({
      version: app.getVersion(),
      electron: process.versions.electron ?? '',
      platform: process.platform,
    }),
  )
  // Copiar e colar do terminal (T8.3): so texto, com teto para nao travar a janela
  handle(IPC.appCopiar, z.object({ texto: z.string().max(LIMITE_TEXTO) }), ({ texto }) => clipboard.writeText(texto))
  handle(IPC.appColar, z.undefined(), () => clipboard.readText().slice(0, LIMITE_TEXTO))
}
