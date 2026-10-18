// Ponte entre a tela (sandbox, sem Node) e o main. So repassa chamadas do
// contrato em src/shared/ipc.ts; nenhuma regra mora aqui.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC, type LousaApi } from '../shared/ipc'
import type { AvisoAgente } from '../shared/model'

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
    criar: (provedor, nome) => ipcRenderer.invoke(IPC.perfisCriar, { provedor, nome }),
  },
  repos: {
    escolherPasta: () => ipcRenderer.invoke(IPC.reposEscolherPasta),
    adicionar: (caminho, perfilId) => ipcRenderer.invoke(IPC.reposAdicionar, { caminho, perfilId }),
    remover: (repoId) => ipcRenderer.invoke(IPC.reposRemover, { repoId }),
  },
  quadros: {
    criar: (repoId, tipo, perfilId, posicao) =>
      ipcRenderer.invoke(IPC.quadrosCriar, { repoId, tipo, perfilId, posicao }),
    remover: (quadroId) => ipcRenderer.invoke(IPC.quadrosRemover, { quadroId }),
    trocarConta: (quadroId, perfilId) => ipcRenderer.invoke(IPC.quadrosTrocarConta, { quadroId, perfilId }),
    aoFocar: (cb) => inscrever<{ quadroId: string }>(IPC.quadrosFocar, (p) => cb(p.quadroId)),
  },
  lousa: {
    carregar: () => ipcRenderer.invoke(IPC.lousaCarregar),
    salvarLayout: (layout) => ipcRenderer.invoke(IPC.lousaSalvarLayout, layout),
  },
  terminais: {
    abrir: (alvo, cols, rows) => ipcRenderer.invoke(IPC.terminaisAbrir, { alvo, cols, rows }),
    escrever: (terminalId, dados) => ipcRenderer.invoke(IPC.terminaisEscrever, { terminalId, dados }),
    fecharLogin: (perfilId) => ipcRenderer.invoke(IPC.terminaisFecharLogin, { perfilId }),
    redimensionar: (terminalId, cols, rows) =>
      ipcRenderer.invoke(IPC.terminaisRedimensionar, { terminalId, cols, rows }),
    aoDados: (cb) => inscrever<{ terminalId: string; dados: string }>(IPC.terminaisDados, (p) => cb(p.terminalId, p.dados)),
    aoSair: (cb) => inscrever<{ terminalId: string; codigo: number }>(IPC.terminaisSaiu, (p) => cb(p.terminalId, p.codigo)),
    aoEstado: (cb) =>
      inscrever<{ terminalId: string; aviso: AvisoAgente }>(IPC.terminaisEstado, (p) => cb(p.terminalId, p.aviso)),
  },
  arquivos: {
    listar: (repoId, relativo) => ipcRenderer.invoke(IPC.arquivosListar, { repoId, relativo }),
    abrir: (repoId, relativo) => ipcRenderer.invoke(IPC.arquivosAbrir, { repoId, relativo }),
    ler: (repoId, relativo) => ipcRenderer.invoke(IPC.arquivosLer, { repoId, relativo }),
    abrirFora: (repoId, relativo) => ipcRenderer.invoke(IPC.arquivosAbrirFora, { repoId, relativo }),
    mostrarNaPasta: (repoId, relativo) => ipcRenderer.invoke(IPC.arquivosMostrarNaPasta, { repoId, relativo }),
    abrirLink: (url) => ipcRenderer.invoke(IPC.arquivosAbrirLink, { url }),
    vigiar: () => ipcRenderer.invoke(IPC.arquivosVigiar),
    aoMudar: (cb) => inscrever<{ repoId: string; caminhos: string[] }>(IPC.arquivosMudou, (p) => cb(p.repoId, p.caminhos)),
  },
}

contextBridge.exposeInMainWorld('lousa', api)
