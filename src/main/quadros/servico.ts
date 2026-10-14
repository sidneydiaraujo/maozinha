// Quadros da lousa (T3.4a, D13): cada quadro e um terminal ou agente solto na lousa,
// trabalhando numa pasta, com a sua propria conta, fixa (D11).
import type { Posicao, Quadro, TipoQuadro } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'

export interface DepsServicoQuadros {
  armazem: Armazem
  perfis: Pick<ServicoPerfis, 'obter'>
  /** Fecha o terminal que vive no main (id do terminal = id do quadro). */
  fecharTerminal(terminalId: string): void
  novoId(): string
}

const LARGURA = 640
const ALTURA = 420
const MARGEM = 24

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
    }
    estado.quadros.push(quadro)
    repo.perfilPadraoId = perfil.id
    estado.ultimoPerfilId = perfil.id
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
