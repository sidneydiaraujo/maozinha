// Contrato entre o processo principal (main) e a tela (renderer).
// Todo canal novo nasce aqui: nome, entrada e saida. O preload so repassa,
// e o main valida a entrada com zod (src/main/ipc.ts).
// Regra: este arquivo nao importa nada (nem electron, nem node), so tipos de ./model.

import type {
  Abertura,
  AlvoTerminal,
  AvisoAgente,
  Caixa,
  ConteudoArquivo,
  EstadoTela,
  FimDaCopia,
  ItemArquivo,
  PainelAgente,
  PerfilComConta,
  Posicao,
  Provedor,
  Quadro,
  Repo,
  ResumoCopia,
  StatusConta,
  TipoQuadro,
  Viewport,
} from './model'

export const IPC = {
  appInfo: 'app:info',
  appCopiar: 'app:copiar',
  appColar: 'app:colar',
  appTemImagem: 'app:temImagem',
  appErroDaTela: 'app:erroDaTela',
  appAbrirRegistros: 'app:abrirRegistros',
  perfisListar: 'perfis:listar',
  perfisRenomear: 'perfis:renomear',
  perfisAtualizarConta: 'perfis:atualizarConta',
  perfisCriar: 'perfis:criar',
  reposEscolherPasta: 'repos:escolherPasta',
  reposAdicionar: 'repos:adicionar',
  reposRemover: 'repos:remover',
  quadrosCriar: 'quadros:criar',
  quadrosRemover: 'quadros:remover',
  quadrosTrocarConta: 'quadros:trocarConta',
  quadrosFocar: 'quadros:focar', // evento main -> tela (clique na notificacao)
  copiasResumo: 'copias:resumo',
  copiasJuntar: 'copias:juntar',
  lousaCarregar: 'lousa:carregar',
  lousaSalvarLayout: 'lousa:salvarLayout',
  terminaisAbrir: 'terminais:abrir',
  terminaisEscrever: 'terminais:escrever',
  terminaisRedimensionar: 'terminais:redimensionar',
  terminaisFecharLogin: 'terminais:fecharLogin',
  terminaisDados: 'terminais:dados', // evento main -> tela
  terminaisSaiu: 'terminais:saiu', // evento main -> tela
  terminaisEstado: 'terminais:estado', // evento main -> tela (OSC 7501, T8.1)
  arquivosListar: 'arquivos:listar',
  arquivosAbrir: 'arquivos:abrir',
  arquivosLer: 'arquivos:ler',
  arquivosAbrirFora: 'arquivos:abrirFora',
  arquivosMostrarNaPasta: 'arquivos:mostrarNaPasta',
  arquivosAbrirLink: 'arquivos:abrirLink',
  arquivosVigiar: 'arquivos:vigiar',
  arquivosBuscar: 'arquivos:buscar',
  arquivosMudou: 'arquivos:mudou', // evento main -> tela
  agentesUltimoPainel: 'agentes:ultimoPainel',
  agentesPainel: 'agentes:painel', // evento main -> tela (linha de status do agente, T17.2)
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
  /** Area de transferencia do Windows (T8.3): a tela nao tem permissao direta. */
  app: {
    copiar(texto: string): Promise<void>
    colar(): Promise<string>
    /** Ha uma imagem (um print) na area de transferencia? So sim ou nao: a imagem nunca vem (T16.1). */
    temImagem(): Promise<boolean>
    /** Caminho no disco de um arquivo solto na tela (T16.2); '' se nao vier do disco. Sem IPC. */
    caminhoDoArquivo(arquivo: File): string
    /** Erro nao tratado na tela vai para o arquivo de registros (T8.6). */
    erroDaTela(mensagem: string): Promise<void>
    /** Abre a pasta dos registros no Explorador do Windows. */
    abrirRegistros(): Promise<void>
  }
  perfis: {
    listar(): Promise<PerfilComConta[]>
    renomear(perfilId: string, nome: string): Promise<PerfilComConta>
    atualizarConta(perfilId: string): Promise<StatusConta>
    /** Cria a pasta vazia da conta nova (T1.8); o login vem depois, pelo cartao. */
    criar(provedor: Provedor, nome: string): Promise<PerfilComConta>
  }
  repos: {
    /** Abre o seletor de pasta do Windows; null se o usuario cancelar. */
    escolherPasta(): Promise<{ caminho: string; sugestaoPerfilId: string | null } | null>
    adicionar(caminho: string, perfilId: string): Promise<Repo>
    /** Numa copia separada (D18), diz se a copia foi apagada ou mantida. */
    remover(repoId: string): Promise<FimDaCopia>
  }
  quadros: {
    /**
     * `posicao` ausente = ao lado dos outros quadros. `separado` = numa copia separada da pasta
     * (git worktree com branch propria, D18): `repo` traz a copia nova; sem copia, null.
     */
    criar(
      repoId: string,
      tipo: TipoQuadro,
      perfilId: string,
      opcoes?: { posicao?: Posicao; separado?: boolean },
    ): Promise<{ quadro: Quadro; repo: Repo | null }>
    /** Fechar o ultimo quadro de uma copia tenta limpa-la sem perder trabalho. */
    remover(quadroId: string): Promise<FimDaCopia>
    /** Mesmo quadro e pasta, outra conta: reinicia o terminal e a conversa vai junto (D14). */
    trocarConta(quadroId: string, perfilId: string): Promise<Quadro>
    /** Clique na notificacao do Windows: a lousa enquadra este quadro. */
    aoFocar(cb: (quadroId: string) => void): () => void
  }
  /** Copia separada (D18, D19): o que ela tem e juntar na pasta original. */
  copias: {
    resumo(repoId: string): Promise<ResumoCopia>
    /** Merge da branch da copia na branch atual da original; conflito nao muda nada e lanca. */
    juntar(repoId: string): Promise<{ branchAlvo: string }>
  }
  lousa: {
    carregar(): Promise<EstadoTela>
    salvarLayout(layout: LayoutLousa): Promise<void>
  }
  terminais: {
    /** `aviso` = ultimo estado do agente do quadro (null se nao mandou nenhum). */
    abrir(
      alvo: AlvoTerminal,
      cols: number,
      rows: number,
    ): Promise<{ terminalId: string; bufferInicial: string; aviso: AvisoAgente | null }>
    escrever(terminalId: string, dados: string): Promise<void>
    redimensionar(terminalId: string, cols: number, rows: number): Promise<void>
    /** Encerra o terminal de login da conta, para o proximo "Entrar" comecar do zero. */
    fecharLogin(perfilId: string): Promise<void>
    /** Devolvem a funcao que cancela a inscricao. */
    aoDados(cb: (terminalId: string, dados: string) => void): () => void
    aoSair(cb: (terminalId: string, codigo: number) => void): () => void
    /** O agente do quadro mudou de estado (trabalhando, esperando voce, terminou...). */
    aoEstado(cb: (terminalId: string, aviso: AvisoAgente) => void): () => void
  }
  /** Pastas na lateral (T7.1): sempre repoId + caminho relativo com '/'; o main confere que fica dentro. */
  arquivos: {
    listar(repoId: string, relativo: string): Promise<ItemArquivo[]>
    /** Clique: documento abre no programa do Windows; texto volta para o leitor. */
    abrir(repoId: string, relativo: string): Promise<Abertura>
    ler(repoId: string, relativo: string): Promise<ConteudoArquivo>
    abrirFora(repoId: string, relativo: string): Promise<void>
    mostrarNaPasta(repoId: string, relativo: string): Promise<void>
    /** So http(s), no navegador. */
    abrirLink(url: string): Promise<void>
    /** Vigia so estas pastas, sem subpastas (D17), e para as outras. */
    vigiar(pastas: Array<{ repoId: string; relativo: string }>): Promise<void>
    /** Ctrl+K (T12.1): arquivos das pastas da lista cujo nome combina (ate 30). */
    buscar(texto: string): Promise<Array<{ repoId: string; relativo: string }>>
    aoMudar(cb: (repoId: string, caminhos: string[]) => void): () => void
  }
  /** O que cada agente Claude conta pela linha de status: modelo, esforco, contexto, uso (T17.2, D24). */
  agentes: {
    /** O ultimo painel que o main guardou do quadro (tela remontada); null antes do primeiro. */
    ultimoPainel(quadroId: string): Promise<PainelAgente | null>
    aoPainel(cb: (quadroId: string, painel: PainelAgente) => void): () => void
  }
}
