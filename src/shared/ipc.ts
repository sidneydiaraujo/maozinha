// Contrato entre o processo principal (main) e a tela (renderer).
// Todo canal novo nasce aqui: nome, entrada e saida. O preload so repassa,
// e o main valida a entrada com zod (src/main/ipc.ts).
// Regra: este arquivo nao importa nada (nem electron, nem node), so tipos de ./model.

import type {
  AlvoTerminal,
  Caixa,
  EstadoTela,
  PerfilComConta,
  Posicao,
  Quadro,
  Repo,
  StatusConta,
  TipoQuadro,
  Viewport,
} from './model'

export const IPC = {
  appInfo: 'app:info',
  perfisListar: 'perfis:listar',
  perfisRenomear: 'perfis:renomear',
  perfisAtualizarConta: 'perfis:atualizarConta',
  reposEscolherPasta: 'repos:escolherPasta',
  reposAdicionar: 'repos:adicionar',
  reposRemover: 'repos:remover',
  quadrosCriar: 'quadros:criar',
  quadrosRemover: 'quadros:remover',
  lousaCarregar: 'lousa:carregar',
  lousaSalvarLayout: 'lousa:salvarLayout',
  terminaisAbrir: 'terminais:abrir',
  terminaisEscrever: 'terminais:escrever',
  terminaisRedimensionar: 'terminais:redimensionar',
  terminaisFecharLogin: 'terminais:fecharLogin',
  terminaisDados: 'terminais:dados', // evento main -> tela
  terminaisSaiu: 'terminais:saiu', // evento main -> tela
} as const

/** Posicao e tamanho que a tela quer guardar. O main valida e ignora ids que nao existem. */
export interface LayoutLousa {
  quadros: Array<{ id: string; caixa: Caixa }>
  viewport: Viewport
}

export interface AppInfo {
  version: string
  electron: string
  platform: string
}

/** O que a tela enxerga em `window.lousa`. */
export interface LousaApi {
  appInfo(): Promise<AppInfo>
  perfis: {
    listar(): Promise<PerfilComConta[]>
    renomear(perfilId: string, nome: string): Promise<PerfilComConta>
    atualizarConta(perfilId: string): Promise<StatusConta>
  }
  repos: {
    /** Abre o seletor de pasta do Windows; null se o usuario cancelar. */
    escolherPasta(): Promise<{ caminho: string; sugestaoPerfilId: string | null } | null>
    adicionar(caminho: string, perfilId: string): Promise<Repo>
    remover(repoId: string): Promise<void>
  }
  quadros: {
    /** `posicao` ausente = ao lado dos outros quadros. */
    criar(repoId: string, tipo: TipoQuadro, perfilId: string, posicao?: Posicao): Promise<Quadro>
    remover(quadroId: string): Promise<void>
  }
  lousa: {
    carregar(): Promise<EstadoTela>
    salvarLayout(layout: LayoutLousa): Promise<void>
  }
  terminais: {
    abrir(alvo: AlvoTerminal, cols: number, rows: number): Promise<{ terminalId: string; bufferInicial: string }>
    escrever(terminalId: string, dados: string): Promise<void>
    redimensionar(terminalId: string, cols: number, rows: number): Promise<void>
    /** Encerra o terminal de login da conta, para o proximo "Entrar" comecar do zero. */
    fecharLogin(perfilId: string): Promise<void>
    /** Devolvem a funcao que cancela a inscricao. */
    aoDados(cb: (terminalId: string, dados: string) => void): () => void
    aoSair(cb: (terminalId: string, codigo: number) => void): () => void
  }
}
