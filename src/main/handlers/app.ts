import { app, clipboard, shell } from 'electron'
import { z } from 'zod'
import { IPC, type AppInfo } from '../../shared/ipc'
import { handle } from '../ipc'
import { log } from '../log'

const LIMITE_TEXTO = 5_000_000

/** `pastaDosRegistros` = onde o arquivo de registros fica (T8.6). */
export function registrarHandlersApp(pastaDosRegistros: string): void {
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
  handle(IPC.appErroDaTela, z.object({ mensagem: z.string().max(4000) }), ({ mensagem }) =>
    log('error', `erro na tela: ${mensagem}`),
  )
  handle(IPC.appAbrirRegistros, z.undefined(), async () => {
    const falha = await shell.openPath(pastaDosRegistros)
    if (falha) throw new Error(`Não abriu a pasta de registros: ${falha}`)
  })
}
