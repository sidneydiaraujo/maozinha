// Quadros da lousa (T3.4a, D13): cada quadro e um terminal ou agente solto na lousa,
// trabalhando numa pasta, com a sua propria conta (D11). Trocar a conta leva a conversa junto (D14).
import type { Posicao, Quadro, TipoQuadro } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'

export interface DepsServicoQuadros {
  armazem: Armazem
  perfis: Pick<ServicoPerfis, 'obter'>
  /** Fecha o terminal que vive no main (id do terminal = id do quadro). */
  fecharTerminal(terminalId: string): void
  novoId(): string
  /** Id da conversa do Claude (randomUUID). */
  novaSessao(): string
  /** Copia a conversa entre as pastas de duas contas (sessoes.ts). */
  copiarSessao(de: string, para: string, sessaoId: string): boolean
  esperar(ms: number): Promise<void>
}

const LARGURA = 640
const ALTURA = 420
const MARGEM = 24
/** Depois de fechar o terminal, o Claude ainda pode estar gravando a conversa. */
const ESPERA_FECHAR_MS = 500

/** A direita do quadro mais a direita, na mesma altura; lousa vazia comeca em (40, 40). */
function proximaPosicao(quadros: Quadro[]): Posicao {
  const ultimo = quadros.reduce<Quadro | undefined>(
    (m, q) => (!m || q.caixa.x + q.caixa.largura > m.caixa.x + m.caixa.largura ? q : m),
    undefined,
  )
  return ultimo ? { x: ultimo.caixa.x + ultimo.caixa.largura + MARGEM, y: ultimo.caixa.y } : { x: 40, y: 40 }
}

const NOME_DO_PROVEDOR = { claude: 'Claude', codex: 'Codex' } as const

export class ServicoQuadros {
  constructor(private readonly deps: DepsServicoQuadros) {}

  listar(): Quadro[] {
    return this.deps.armazem.carregar().quadros
  }

  /** Lanca 'Quadro não encontrado'. */
  obter(quadroId: string): Quadro {
    const quadro = this.listar().find((q) => q.id === quadroId)
    if (!quadro) throw new Error('Quadro não encontrado')
    return quadro
  }

  /** Sem `posicao`, o quadro entra a direita do mais a direita. A conta vira a sugestao da pasta. */
  criar(repoId: string, tipo: TipoQuadro, perfilId: string, posicao?: Posicao): Quadro {
    const estado = this.deps.armazem.carregar()
    const repo = estado.repos.find((r) => r.id === repoId)
    if (!repo) throw new Error('Repositório não encontrado')
    const perfil = this.deps.perfis.obter(perfilId)

    const prefixo = tipo === 'terminal' ? 'Terminal' : NOME_DO_PROVEDOR[perfil.provedor]
    const maior = estado.quadros.reduce((m, q) => {
      const achou = new RegExp(`^${prefixo} (\\d+)$`).exec(q.titulo)
      return achou ? Math.max(m, Number(achou[1])) : m
    }, 0)
    const quadro: Quadro = {
      id: this.deps.novoId(),
      repoId,
      perfilId: perfil.id,
      tipo,
      titulo: `${prefixo} ${maior + 1}`,
      caixa: { ...(posicao ?? proximaPosicao(estado.quadros)), largura: LARGURA, altura: ALTURA },
      ...(tipo === 'agente' && perfil.provedor === 'claude' ? { sessaoId: this.deps.novaSessao() } : {}),
    }
    estado.quadros.push(quadro)
    repo.perfilPadraoId = perfil.id
    estado.ultimoPerfilId = perfil.id
    this.deps.armazem.salvar(estado)
    return quadro
  }

  /** O quadro, com conversa garantida se for agente do Claude (quadros de antes da T6.1 nao tinham). */
  comSessao(quadroId: string): Quadro {
    const estado = this.deps.armazem.carregar()
    const quadro = estado.quadros.find((q) => q.id === quadroId)
    if (!quadro) throw new Error('Quadro não encontrado')
    if (quadro.tipo !== 'agente' || quadro.sessaoId) return quadro
    if (this.deps.perfis.obter(quadro.perfilId).provedor !== 'claude') return quadro
    quadro.sessaoId = this.deps.novaSessao()
    this.deps.armazem.salvar(estado)
    return quadro
  }

  /**
   * Mesmo quadro, mesma pasta, outra conta (quem paga). Fecha o terminal, copia a conversa
   * para a pasta da conta nova e salva; ao reabrir, o terminal retoma com --resume.
   */
  async trocarConta(quadroId: string, perfilId: string): Promise<Quadro> {
    const atual = this.obter(quadroId)
    const nova = this.deps.perfis.obter(perfilId)
    if (atual.perfilId === nova.id) return atual
    this.deps.fecharTerminal(quadroId)
    if (atual.sessaoId && nova.provedor === 'claude') {
      await this.deps.esperar(ESPERA_FECHAR_MS)
      const antiga = this.deps.perfis.obter(atual.perfilId)
      if (antiga.provedor === 'claude') this.deps.copiarSessao(antiga.configDir, nova.configDir, atual.sessaoId)
    }
    const estado = this.deps.armazem.carregar()
    const quadro = estado.quadros.find((q) => q.id === quadroId)
    if (!quadro) throw new Error('Quadro não encontrado')
    quadro.perfilId = nova.id
    const repo = estado.repos.find((r) => r.id === quadro.repoId)
    if (repo) repo.perfilPadraoId = nova.id
    estado.ultimoPerfilId = nova.id
    this.deps.armazem.salvar(estado)
    return quadro
  }

  remover(quadroId: string): void {
    this.obter(quadroId)
    this.deps.fecharTerminal(quadroId)
    const estado = this.deps.armazem.carregar()
    estado.quadros = estado.quadros.filter((q) => q.id !== quadroId)
    this.deps.armazem.salvar(estado)
  }
}
