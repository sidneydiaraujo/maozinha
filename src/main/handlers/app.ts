import { app } from 'electron'
import { z } from 'zod'
import { IPC, type AppInfo } from '../../shared/ipc'
import { handle } from '../ipc'

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
}
