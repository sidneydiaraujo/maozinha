// Quadros da lousa (T3.4a): cada quadro e um terminal ou agente DENTRO de um repo,
// com a sua propria conta, fixa (D11).
import type { Quadro, TipoQuadro } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'

export interface DepsServicoQuadros {
  armazem: Armazem
  perfis: Pick<ServicoPerfis, 'obter'>
  /** Fecha o terminal que vive no main (id do terminal = id do quadro). */
  fecharTerminal(terminalId: string): void
  novoId(): string
}

const LARGURA = 440
const ALTURA = 280
const MARGEM = 20
const CABECALHO = 48

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

  /** `perfilId` ausente usa a conta padrao do repo. */
  criar(repoId: string, tipo: TipoQuadro, perfilId?: string): Quadro {
    const estado = this.deps.armazem.carregar()
    const repo = estado.repos.find((r) => r.id === repoId)
    if (!repo) throw new Error('Repositório não encontrado')
    const perfil = this.deps.perfis.obter(perfilId ?? repo.perfilPadraoId)

    const doRepo = estado.quadros.filter((q) => q.repoId === repoId)
    const prefixo = tipo === 'terminal' ? 'Terminal' : NOME_DO_PROVEDOR[perfil.provedor]
    const maior = doRepo.reduce((m, q) => {
      const achou = new RegExp(`^${prefixo} (\\d+)$`).exec(q.titulo)
      return achou ? Math.max(m, Number(achou[1])) : m
    }, 0)
    const posicao = doRepo.length
    const quadro: Quadro = {
      id: this.deps.novoId(),
      repoId,
      perfilId: perfil.id,
      tipo,
      titulo: `${prefixo} ${maior + 1}`,
      caixa: {
        x: MARGEM + (posicao % 2) * (LARGURA + MARGEM),
        y: CABECALHO + MARGEM + Math.floor(posicao / 2) * (ALTURA + MARGEM),
        largura: LARGURA,
        altura: ALTURA,
      },
    }
    estado.quadros.push(quadro)
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
