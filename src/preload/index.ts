// Ponte entre a tela (sandbox, sem Node) e o main. So repassa chamadas do
// contrato em src/shared/ipc.ts; nenhuma regra mora aqui.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC, type LousaApi } from '../shared/ipc'

/** Assina um evento do main entregando so o payload (nunca o `event`); devolve o cancelar. */
function inscrever<T>(canal: string, cb: (payload: T) => void): () => void {
  const ouvinte = (_evento: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(canal, ouvinte)
  return () => {
    ipcRenderer.removeListener(canal, ouvinte)
  }
}

const api: LousaApi = {
  appInfo: () => ipcRenderer.invoke(IPC.appInfo),
  perfis: {
    listar: () => ipcRenderer.invoke(IPC.perfisListar),
    renomear: (perfilId, nome) => ipcRenderer.invoke(IPC.perfisRenomear, { perfilId, nome }),
    atualizarConta: (perfilId) => ipcRenderer.invoke(IPC.perfisAtualizarConta, { perfilId }),
  },
  repos: {
    escolherPasta: () => ipcRenderer.invoke(IPC.reposEscolherPasta),
    adicionar: (caminho, perfilId) => ipcRenderer.invoke(IPC.reposAdicionar, { caminho, perfilId }),
    mudarPerfilPadrao: (repoId, perfilId) => ipcRenderer.invoke(IPC.reposMudarPerfilPadrao, { repoId, perfilId }),
    remover: (repoId) => ipcRenderer.invoke(IPC.reposRemover, { repoId }),
  },
  quadros: {
    criar: (repoId, tipo, perfilId) => ipcRenderer.invoke(IPC.quadrosCriar, { repoId, tipo, perfilId }),
    remover: (quadroId) => ipcRenderer.invoke(IPC.quadrosRemover, { quadroId }),
  },
  lousa: {
    carregar: () => ipcRenderer.invoke(IPC.lousaCarregar),
  },
  terminais: {
    abrir: (alvo, cols, rows) => ipcRenderer.invoke(IPC.terminaisAbrir, { alvo, cols, rows }),
    escrever: (terminalId, dados) => ipcRenderer.invoke(IPC.terminaisEscrever, { terminalId, dados }),
    redimensionar: (terminalId, cols, rows) =>
      ipcRenderer.invoke(IPC.terminaisRedimensionar, { terminalId, cols, rows }),
    aoDados: (cb) => inscrever<{ terminalId: string; dados: string }>(IPC.terminaisDados, (p) => cb(p.terminalId, p.dados)),
    aoSair: (cb) => inscrever<{ terminalId: string; codigo: number }>(IPC.terminaisSaiu, (p) => cb(p.terminalId, p.codigo)),
  },
}

contextBridge.exposeInMainWorld('lousa', api)
