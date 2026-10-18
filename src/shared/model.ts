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
}

export interface Viewport { x: number; y: number; zoom: number }

export type AlvoTerminal =
  | { tipo: 'quadro'; quadroId: string }
  | { tipo: 'login'; perfilId: PerfilId }

export interface EstadoSalvo {        // %APPDATA%\lousa-ia\estado.json
  versao: 2           // 1 = lousa com molduras, migrada ao carregar (estado/migrar.ts)
  perfis: Record<PerfilId, { nome?: string; cor?: string; raizes?: string[]; provedor?: Provedor; criada?: boolean }>
  // só o que o usuário mudou; criada = conta criada pelo app (a pasta pode estar vazia)
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
  ultimoPerfilId: PerfilId | null
}

export interface EstadoTela {
  perfis: PerfilComConta[]
  repos: Repo[]
  quadros: Quadro[]
  viewport: Viewport
}
