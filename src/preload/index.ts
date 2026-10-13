// Ponte entre a tela (sandbox, sem Node) e o main. So repassa chamadas do
// contrato em src/shared/ipc.ts; nenhuma regra mora aqui.
import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type LousaApi } from '../shared/ipc'

const api: LousaApi = {
  appInfo: () => ipcRenderer.invoke(IPC.appInfo),
}

contextBridge.exposeInMainWorld('lousa', api)
