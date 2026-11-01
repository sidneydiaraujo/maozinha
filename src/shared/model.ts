// Tipos do domínio, usados por main, preload e tela. Só tipos, nenhum import.
// Fonte: docs/ARQUITETURA.md ("Tipos do domínio"). Mudou aqui, mude lá.

export type Provedor = 'claude' | 'codex' // Claude Code (Anthropic) ou Codex CLI (login ChatGPT)

export type PerfilId = string
// claude: 'principal' para ~/.claude; o sufixo em minúsculas de ~/.claude-<sufixo>
// codex:  'cx:padrao' para ~/.codex; 'cx:<sufixo>' para ~/.codex-<sufixo>

export interface Perfil {
  id: PerfilId
  provedor: Provedor
  nome: string        // 'Principal' / sufixo com inicial maiúscula / 'Codex' / 'Codex <Sufixo>'
  cor: string         // '#rrggbb'
  configDir: string   // pasta da conta: CLAUDE_CONFIG_DIR (claude) ou CODEX_HOME (codex)
  ehPadrao: boolean   // true só para ~/.claude e ~/.codex: rodam SEM a variável
  raizes: string[]    // pastas cujo conteúdo pertence a esta conta (sugestão)
  git?: GitDaConta    // ausente = o terminal usa o git e o GitHub do PC (C1, D42)
}

// Git e GitHub de uma conta (C1, D42). Vira variável de ambiente; a Lousa não escreve gitconfig.
export interface GitDaConta {
  nome: string | null   // autor dos commits (GIT_AUTHOR_NAME e GIT_COMMITTER_NAME)
  email: string | null  // GIT_AUTHOR_EMAIL e GIT_COMMITTER_EMAIL
  githubProprio: boolean // login do gh e do git separados, numa pasta da Lousa
}

export interface StatusConta {
  logado: boolean
  email: string | null
  plano: string | null  // subscriptionType do auth status
  erro: string | null   // ex.: 'Claude Code não encontrado'
}

export interface PerfilComConta extends Perfil { conta: StatusConta }

export interface Posicao { x: number; y: number }
export interface Caixa extends Posicao { largura: number; altura: number }

// Pasta onde os quadros trabalham (D13: sem moldura na lousa; aparece no cabeçalho do quadro).
export interface Repo {
  id: string
  nome: string        // nome da pasta
  caminho: string     // absoluto, como o usuário escolheu
  perfilPadraoId: PerfilId // última conta usada nesta pasta: só sugestão, cada quadro tem a sua
  copia?: Copia       // pasta que é cópia separada (worktree) de outra (T10, D18)
}

// Cópia separada de um repositório (git worktree) com branch própria (T10, D18).
export interface Copia {
  origemId: string    // pasta original
  branch: string      // 'lousa/<apelido>'
  apelido: string     // 'claude-3': nome da pasta da cópia
}

// O que a cópia tem para juntar na pasta original (T11, D19)
export interface ResumoCopia {
  branch: string        // 'lousa/claude-3'
  branchAlvo: string    // branch atual da pasta original (onde o merge cai)
  commits: number       // commits da cópia que a original ainda não tem
  arquivos: Array<{ caminho: string; mais: number; menos: number }> // até 200
  totalArquivos: number
  pendente: boolean     // a cópia tem alteração sem commit (não entra no merge)
}

// O que aconteceu com a cópia ao fechar o último quadro dela (ou tirá-la da lista).
export type FimDaCopia =
  | { copia: 'nenhuma' }                                  // a pasta não era cópia, ou ainda tem quadros
  | { copia: 'apagada' }
  | { copia: 'branchGuardada'; branch: string }           // pasta apagada; commits ficaram na branch
  | { copia: 'mantida'; caminho: string; motivo: string } // tinha alteração não salva: nada apagado

// Diferença de um arquivo da cópia, para ver antes de juntar (T22, D31).
export interface LinhaDiff {
  tipo: 'trecho' | 'mais' | 'menos' | 'igual' // trecho = início de um bloco (@@ do git)
  texto: string
}
export interface DiffArquivo {
  linhas: LinhaDiff[] // até 3000
  cortada: boolean    // o arquivo tinha mais linhas de diferença
}

export type TipoQuadro = 'terminal' | 'agente' // 'agente' digita o CLI do provedor da conta (claude ou codex)

export interface Quadro {
  id: string
  repoId: string
  perfilId: PerfilId  // conta DESTE quadro (quem paga); trocar = quadros:trocarConta, a conversa vai junto (D14)
  tipo: TipoQuadro
  titulo: string      // nome interno; a tela mostra a pasta (D14)
  caixa: Caixa        // posição e tamanho na lousa
  sessaoId?: string   // conversa do Claude neste quadro (agente): o Lousa escolhe e retoma com --resume
  modelo?: Modelo     // agente Claude: escolhido no cabeçalho (T19.1); abre com --model
  esforco?: Esforco   // agente Claude: abre com --effort
  papel?: string      // nome no time de agentes ("Revisor"), até 40 letras (T29.1)
  kanban?: boolean    // agente: segue o KANBAN.md do projeto (A22); ausente = quadro de antes, usa o que já existe
}

export interface Viewport { x: number; y: number; zoom: number }

// Pastas na lateral (T7.1). A tela sempre fala em repoId + caminho relativo com '/' ('' = a pasta do repo).
export interface ItemArquivo { nome: string; pasta: boolean }

export type ComoAbrir = 'leitor' | 'fora' | 'descobrir' // descobrir = o main olha os primeiros bytes

export interface ConteudoArquivo {
  tipo: 'texto' | 'binario' | 'grande' // grande = acima de 2 MB, não carrega
  texto: string        // '' quando não é texto
  tamanho: number      // bytes
  podeAbrirFora: boolean // documento ou mídia; script e executável nunca
}

export type Abertura = { onde: 'fora' } | { onde: 'leitor'; conteudo: ConteudoArquivo }

export type AlvoTerminal =
  | { tipo: 'quadro'; quadroId: string }
  | { tipo: 'login'; perfilId: PerfilId }

// O que o agente do quadro diz pelo Program Status Protocol (OSC 7501, T8.1, D16)
export type EstadoAgente = 'trabalhando' | 'esperando' | 'terminou' | 'parado' | 'erro'
export type MotivoEspera = 'permissao' | 'pergunta' | 'login'
export interface AvisoAgente {
  estado: EstadoAgente
  motivo?: MotivoEspera // só quando esperando
  mensagem?: string     // texto curto do Claude (ex.: o que terminou)
}

// O que o agente diz pela linha de status (statusLine) do Claude Code (T17.1, D24)
export const ESFORCOS = ['low', 'medium', 'high', 'xhigh', 'max'] as const // `claude --help` 2.1.304
export type Esforco = (typeof ESFORCOS)[number]
// Modelo e esforco escolhidos no quadro (T19.1, D25): aliases do CLI (`--model`, `/model`). Cada
// alias aponta sempre para a versao mais nova da familia; familia nova = uma linha aqui.
export const MODELOS = ['fable', 'opus', 'sonnet', 'haiku'] as const
export type Modelo = (typeof MODELOS)[number]
export interface AjusteAgente { modelo?: Modelo; esforco?: Esforco }
/** agora = o main ja digitou; quandoParar = digita quando o agente parar; naAbertura = vale ao abrir. */
export type QuandoAjusta = 'agora' | 'quandoParar' | 'naAbertura'
/** Compactar sozinho ao fim da tarefa (A17): escolha da engrenagem, que a tela conta ao main. */
export interface PrefCompactar { ligado: boolean; limite: number }  // limite em % usado
/** A pasta do projeto onde o agente salvou por ultimo (A16); `relativo` com '/', '' = a raiz. */
export interface OndeEscreve { quadroId: string; repoId: string; relativo: string }
/** Colega que o proprio agente pediu (A19): nome no time e a tarefa que ele recebe. */
export interface ColegaPedido { papel: string; tarefa: string }
/** `paralelo` (A21): o agente ia usar subagentes; a pergunta e se o usuario quer ver em quadros. */
export interface PedidoColegas { pedidoId: string; quadroId: string; nome: string; colegas: ColegaPedido[]; paralelo: boolean }
/** novo = mostrar a pergunta; encerrado = respondido, vencido ou o agente fechou: tirar da tela. */
export type AvisoPedidoColegas = { tipo: 'novo'; pedido: PedidoColegas } | { tipo: 'encerrado'; pedidoId: string }
export interface Limite { usado: number; zeraEm: number | null }  // usado 0-100; zeraEm em ms
export interface PainelAgente {
  modelo: { id: string; nome: string } | null
  esforco: Esforco | null
  contexto: { usado: number; tamanho: number } | null            // usado 0-100; null antes da 1ª mensagem
  limites: { cincoHoras: Limite | null; semana: Limite | null } | null // null = conta sem plano
  quando: number
}

/** Uso da sessao (5 h) e da semana de uma conta: o painel mais novo de qualquer agente dela (T20.1). */
export interface UsoConta {
  perfilId: PerfilId
  cincoHoras: Limite | null
  semana: Limite | null
  quando: number // quando o dado chegou
}

export interface EstadoSalvo {        // %APPDATA%\lousa-ia\estado.json
  versao: 2           // 1 = lousa com molduras, migrada ao carregar (estado/migrar.ts)
  perfis: Record<PerfilId, { nome?: string; cor?: string; raizes?: string[]; provedor?: Provedor; criada?: boolean; git?: GitDaConta }>
  // só o que o usuário mudou; criada = conta criada pelo app (a pasta pode estar vazia)
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
  ultimoPerfilId: PerfilId | null
  notas?: Nota[]      // notas soltas na lousa (T26, D34); ausente = nenhuma
  vistas?: VistaSalva[] // arrumações guardadas (T27, D35); ausente = nenhuma
  ligacoes?: Ligacao[] // linhas do time de agentes (T28, D39); ausente = nenhuma
}

// Linha do time de agentes (T28, D39): "o `de` entrega para o `para`".
export type ModoLigacao = 'automatico' | 'perguntar'
export interface Ligacao {
  id: string
  de: string          // quadroId que entrega
  para: string        // quadroId que recebe
  modo: ModoLigacao   // nova nasce 'automatico' (D39)
  pausada?: boolean
}

/**
 * O que aconteceu numa linha quando o `de` terminou (T30.1): passou o trabalho; espera o seu ok
 * (modo perguntar); parou no freio de 3 repasses seguidos; ou o `para` estava fechado.
 * `ligacao` vem quando ela mudou (o freio a pausa).
 */
export type TipoRepasse = 'repassou' | 'perguntar' | 'limite' | 'descartado'
export interface EventoRepasse {
  ligacaoId: string
  tipo: TipoRepasse
  para: string        // nome do colega que recebe, para o rótulo
  ligacao?: Ligacao
}

/**
 * Juntar o time (T31.1): as cópias na ordem de entrega, uma por vez. Para no primeiro erro
 * (conflito ou a original suja); cópia com alteração sem commit fica de fora e segue.
 */
export interface ResultadoJuntarTime {
  juntadas: Array<{ apelido: string; branchAlvo: string }>
  semNovidade: string[] // apelidos sem commit novo
  deFora: string[]      // apelidos com alteração sem commit (puladas)
  parou: {
    quadroId: string    // quadro da cópia: se for agente, "Pedir ao agente para resolver" (D30)
    apelido: string
    branch: string
    branchAlvo: string
    erro: string
  } | null
  faltam: string[]      // apelidos que nem foram tentados depois da parada
}

/** Colega criado pela bolinha do time (T28.3): o quadro, a copia nova (ou null) e a linha. */
export interface ColegaNovo {
  quadro: Quadro
  repo: Repo | null
  ligacao: Ligacao
}

// Arrumação guardada da lousa (T27, D35): câmera + lugar de cada quadro e nota que existia.
export interface VistaSalva {
  id: string
  nome: string        // até 60 letras; o mesmo nome substitui a anterior
  viewport: Viewport
  caixas: Record<string, Caixa> // id do quadro ou da nota -> caixa
}

// Nota solta na lousa (T26, D34): texto markdown, sem pasta nem conta.
export interface Nota {
  id: string
  texto: string       // até 20 mil letras
  caixa: Caixa
}

export interface EstadoTela {
  perfis: PerfilComConta[]
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
  notas?: Nota[]      // T26; o main sempre manda (vazia = [])
  vistas?: VistaSalva[] // T27; o main sempre manda (vazia = [])
  ligacoes?: Ligacao[] // T28; o main sempre manda (vazia = [])
}
