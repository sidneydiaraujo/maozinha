// Ponte entre a tela (sandbox, sem Node) e o main. So repassa chamadas do
// contrato em src/shared/ipc.ts; nenhuma regra mora aqui.
import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { IPC, type LousaApi } from '../shared/ipc'
import type { AvisoAgente, PainelAgente, UsoConta } from '../shared/model'

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
  app: {
    copiar: (texto) => ipcRenderer.invoke(IPC.appCopiar, { texto }),
    colar: () => ipcRenderer.invoke(IPC.appColar),
    temImagem: () => ipcRenderer.invoke(IPC.appTemImagem),
    caminhoDoArquivo: (arquivo) => webUtils.getPathForFile(arquivo),
    erroDaTela: (mensagem) => ipcRenderer.invoke(IPC.appErroDaTela, { mensagem }),
    abrirRegistros: () => ipcRenderer.invoke(IPC.appAbrirRegistros),
  },
  perfis: {
    listar: () => ipcRenderer.invoke(IPC.perfisListar),
    renomear: (perfilId, nome) => ipcRenderer.invoke(IPC.perfisRenomear, { perfilId, nome }),
    atualizarConta: (perfilId) => ipcRenderer.invoke(IPC.perfisAtualizarConta, { perfilId }),
    criar: (provedor, nome) => ipcRenderer.invoke(IPC.perfisCriar, { provedor, nome }),
    definirGit: (perfilId, git) => ipcRenderer.invoke(IPC.perfisDefinirGit, { perfilId, git }),
    uso: () => ipcRenderer.invoke(IPC.perfisUso),
    aoUso: (cb) => inscrever<UsoConta>(IPC.perfisUsoMudou, cb),
  },
  repos: {
    escolherPasta: () => ipcRenderer.invoke(IPC.reposEscolherPasta),
    adicionar: (caminho, perfilId) => ipcRenderer.invoke(IPC.reposAdicionar, { caminho, perfilId }),
    remover: (repoId) => ipcRenderer.invoke(IPC.reposRemover, { repoId }),
  },
  quadros: {
    criar: (repoId, tipo, perfilId, opcoes) =>
      ipcRenderer.invoke(IPC.quadrosCriar, { repoId, tipo, perfilId, ...opcoes }),
    remover: (quadroId) => ipcRenderer.invoke(IPC.quadrosRemover, { quadroId }),
    trocarConta: (quadroId, perfilId) => ipcRenderer.invoke(IPC.quadrosTrocarConta, { quadroId, perfilId }),
    definirPapel: (quadroId, papel) => ipcRenderer.invoke(IPC.quadrosDefinirPapel, { quadroId, papel }),
    aoFocar: (cb) => inscrever<{ quadroId: string }>(IPC.quadrosFocar, (p) => cb(p.quadroId)),
  },
  copias: {
    resumo: (repoId) => ipcRenderer.invoke(IPC.copiasResumo, { repoId }),
    juntar: (repoId) => ipcRenderer.invoke(IPC.copiasJuntar, { repoId }),
    diff: (repoId, caminho) => ipcRenderer.invoke(IPC.copiasDiff, { repoId, caminho }),
  },
  mensagens: {
    listar: () => ipcRenderer.invoke(IPC.mensagensListar),
    salvar: (mensagens) => ipcRenderer.invoke(IPC.mensagensSalvar, { mensagens }),
  },
  notas: {
    criar: (posicao) => ipcRenderer.invoke(IPC.notasCriar, { posicao }),
    salvar: (notaId, texto) => ipcRenderer.invoke(IPC.notasSalvar, { notaId, texto }),
    remover: (notaId) => ipcRenderer.invoke(IPC.notasRemover, { notaId }),
  },
  vistas: {
    salvar: (nome, layout) => ipcRenderer.invoke(IPC.vistasSalvar, { nome, layout }),
    remover: (vistaId) => ipcRenderer.invoke(IPC.vistasRemover, { vistaId }),
  },
  time: {
    ligar: (de, para) => ipcRenderer.invoke(IPC.timeLigar, { de, para }),
    ajustar: (ligacaoId, mudanca) => ipcRenderer.invoke(IPC.timeAjustar, { ligacaoId, mudanca }),
    desligar: (ligacaoId) => ipcRenderer.invoke(IPC.timeDesligar, { ligacaoId }),
    colega: (quadroId, posicao) => ipcRenderer.invoke(IPC.timeColega, { quadroId, posicao }),
    separar: (ligacaoId) => ipcRenderer.invoke(IPC.timeSeparar, { ligacaoId }),
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
    vigiar: (pastas) => ipcRenderer.invoke(IPC.arquivosVigiar, { pastas }),
    buscar: (texto) => ipcRenderer.invoke(IPC.arquivosBuscar, { texto }),
    aoMudar: (cb) => inscrever<{ repoId: string; caminhos: string[] }>(IPC.arquivosMudou, (p) => cb(p.repoId, p.caminhos)),
  },
  agentes: {
    ultimoPainel: (quadroId) => ipcRenderer.invoke(IPC.agentesUltimoPainel, { quadroId }),
    aoPainel: (cb) =>
      inscrever<{ quadroId: string; painel: PainelAgente }>(IPC.agentesPainel, (p) => cb(p.quadroId, p.painel)),
    compactar: (quadroId) => ipcRenderer.invoke(IPC.agentesCompactar, { quadroId }),
    ajustar: (quadroId, mudanca) => ipcRenderer.invoke(IPC.agentesAjustar, { quadroId, mudanca }),
  },
}

contextBridge.exposeInMainWorld('lousa', api)
