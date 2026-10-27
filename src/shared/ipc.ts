// Contrato entre o processo principal (main) e a tela (renderer).
// Todo canal novo nasce aqui: nome, entrada e saida. O preload so repassa,
// e o main valida a entrada com zod (src/main/ipc.ts).
// Regra: este arquivo nao importa nada (nem electron, nem node), so tipos de ./model.

import type {
  Abertura,
  AjusteAgente,
  AlvoTerminal,
  AvisoAgente,
  Caixa,
  DiffArquivo,
  ConteudoArquivo,
  EstadoTela,
  EventoRepasse,
  FimDaCopia,
  GitDaConta,
  ItemArquivo,
  ColegaNovo,
  Ligacao,
  ModoLigacao,
  Nota,
  PainelAgente,
  PerfilComConta,
  Posicao,
  Provedor,
  Quadro,
  QuandoAjusta,
  Repo,
  ResultadoJuntarTime,
  ResumoCopia,
  StatusConta,
  TipoQuadro,
  UsoConta,
  Viewport,
  VistaSalva,
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
  perfisDefinirGit: 'perfis:definirGit',
  perfisUso: 'perfis:uso',
  perfisUsoMudou: 'perfis:usoMudou', // evento main -> tela (uso da conta, T20.1)
  reposEscolherPasta: 'repos:escolherPasta',
  reposAdicionar: 'repos:adicionar',
  reposRemover: 'repos:remover',
  quadrosCriar: 'quadros:criar',
  quadrosRemover: 'quadros:remover',
  quadrosTrocarConta: 'quadros:trocarConta',
  quadrosDefinirPapel: 'quadros:definirPapel',
  quadrosFocar: 'quadros:focar', // evento main -> tela (clique na notificacao)
  copiasResumo: 'copias:resumo',
  copiasJuntar: 'copias:juntar',
  copiasDiff: 'copias:diff',
  mensagensListar: 'mensagens:listar',
  mensagensSalvar: 'mensagens:salvar',
  notasCriar: 'notas:criar',
  notasSalvar: 'notas:salvar',
  notasRemover: 'notas:remover',
  vistasSalvar: 'vistas:salvar',
  vistasRemover: 'vistas:remover',
  timeLigar: 'time:ligar',
  timeAjustar: 'time:ajustar',
  timeDesligar: 'time:desligar',
  timeColega: 'time:colega',
  timeSeparar: 'time:separar',
  timeJuntar: 'time:juntar', // juntar as copias do time na original, em ordem (T31.1)
  timePassar: 'time:passar', // botao da linha: passar agora ou continuar depois do freio (T30.1)
  timeRepasse: 'time:repasse', // evento main -> tela: o que aconteceu na linha (T30.1)
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
  agentesCompactar: 'agentes:compactar',
  agentesAjustar: 'agentes:ajustar',
  agentesReabrir: 'agentes:reabrir', // evento main -> tela: o main fechou o agente; abra de novo (D48)
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
    /** Nome, e-mail e GitHub proprio da conta (C1, D42); null = usa o git do PC. */
    definirGit(perfilId: string, git: GitDaConta | null): Promise<PerfilComConta>
    /** Uso de cada conta Claude que ja teve um agente falando (T20.1); so em memoria. */
    uso(): Promise<UsoConta[]>
    aoUso(cb: (uso: UsoConta) => void): () => void
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
    /** Nome no time ("Revisor"), ate 40 letras; vazio tira (T29.1). */
    definirPapel(quadroId: string, papel: string): Promise<Quadro>
    /** Clique na notificacao do Windows: a lousa enquadra este quadro. */
    aoFocar(cb: (quadroId: string) => void): () => void
  }
  /** Copia separada (D18, D19): o que ela tem e juntar na pasta original. */
  copias: {
    resumo(repoId: string): Promise<ResumoCopia>
    /** Merge da branch da copia na branch atual da original; conflito nao muda nada e lanca. */
    juntar(repoId: string): Promise<{ branchAlvo: string }>
    /** O que a copia mudou num arquivo da lista do resumo (T22.1); outro caminho e recusado. */
    diff(repoId: string, caminho: string): Promise<DiffArquivo>
  }
  /** Mensagens prontas (T25, D33): frases guardadas para mandar a um ou varios quadros. */
  mensagens: {
    listar(): Promise<string[]>
    /** Grava a lista inteira; volta limpa (sem vazias nem repetidas, ate 30). */
    salvar(mensagens: string[]): Promise<string[]>
  }
  /** Notas soltas na lousa (T26, D34): so texto, sem pasta nem conta. */
  notas: {
    /** Nota vazia em `posicao`, ou no lugar livre mais perto. */
    criar(posicao: Posicao): Promise<Nota>
    salvar(notaId: string, texto: string): Promise<void>
    remover(notaId: string): Promise<void>
  }
  /** Vistas salvas (T27, D35): arrumacoes da lousa com nome. Voltar a uma e coisa da tela. */
  vistas: {
    /** Guarda (o mesmo nome substitui) e devolve a lista nova. */
    salvar(nome: string, layout: LayoutLousa): Promise<VistaSalva[]>
    remover(vistaId: string): Promise<VistaSalva[]>
  }
  /** Time de agentes (T28, D39): linhas "este entrega para aquele". A tela so manda ids. */
  time: {
    /** Lanca com o motivo quando as regras recusam (shared/time.ts). Nasce no automatico. */
    ligar(de: string, para: string): Promise<Ligacao>
    ajustar(ligacaoId: string, mudanca: { modo?: ModoLigacao; pausada?: boolean }): Promise<Ligacao>
    desligar(ligacaoId: string): Promise<void>
    /** Agente novo ligado a este: mesma conta e repositorio, numa copia propria (T28.3). */
    colega(quadroId: string, posicao?: Posicao): Promise<ColegaNovo>
    /** Linha ambar: colega numa copia no lugar do `para`; o quadro antigo fica aberto. */
    separar(ligacaoId: string): Promise<ColegaNovo>
    /** Junta as copias do time da linha na pasta original, na ordem de entrega (T31.1). */
    juntar(ligacaoId: string): Promise<ResultadoJuntarTime>
    /** Passa o trabalho do `de` agora (perguntar, ou Continuar depois do freio); retoma a linha. */
    passar(ligacaoId: string): Promise<void>
    /** Cada repasse, pergunta, freio ou descarte numa linha (T30.1). */
    aoRepasse(cb: (evento: EventoRepasse) => void): () => void
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
    /** O main escreve /compact no agente (T18.1); lanca se ele nao estiver parado. */
    compactar(quadroId: string): Promise<void>
    /** Guarda modelo/esforco no quadro (T19.1) e diz quando passa a valer no agente aberto. */
    ajustar(quadroId: string, mudanca: AjusteAgente): Promise<QuandoAjusta>
    /** O main fechou o agente para ele voltar com o modelo novo na mesma conversa (D48). */
    aoReabrir(cb: (quadroId: string) => void): () => void
  }
}
