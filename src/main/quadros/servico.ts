// Quadros da lousa (T3.4a, D13): cada quadro e um terminal ou agente solto na lousa,
// trabalhando numa pasta, com a sua propria conta (D11). Trocar a conta leva a conversa junto (D14).
import type { EstadoSalvo, FimDaCopia, Posicao, Provedor, Quadro, Repo, TipoQuadro } from '../../shared/model'
import type { ServicoCopias } from '../copias/servico'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'
import { lugarLivre } from './lugar'

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
  /** Copias separadas (git worktree) de uma pasta (T10, D18). */
  copias: Pick<ServicoCopias, 'criar' | 'limpar'>
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

/** 'Claude 3', 'Terminal 2'...: o maior numero do prefixo mais um. */
function proximoTitulo(quadros: Quadro[], tipo: TipoQuadro, provedor: Provedor): string {
  const prefixo = tipo === 'terminal' ? 'Terminal' : NOME_DO_PROVEDOR[provedor]
  const maior = quadros.reduce((m, q) => {
    const achou = new RegExp(`^${prefixo} (\\d+)$`).exec(q.titulo)
    return achou ? Math.max(m, Number(achou[1])) : m
  }, 0)
  return `${prefixo} ${maior + 1}`
}

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

  /** O lugar pedido, ou o livre mais perto dele: quadro novo nunca nasce em cima de outro (T24.1). */
  private lugar(estado: EstadoSalvo, desejada: Posicao): Posicao {
    return lugarLivre(
      [...estado.quadros, ...(estado.notas ?? [])].map((q) => q.caixa),
      desejada,
      { largura: LARGURA, altura: ALTURA },
    )
  }

  /** Sem `posicao`, o quadro entra a direita do mais a direita. A conta vira a sugestao da pasta. */
  criar(repoId: string, tipo: TipoQuadro, perfilId: string, posicao?: Posicao): Quadro {
    const estado = this.deps.armazem.carregar()
    const repo = estado.repos.find((r) => r.id === repoId)
    if (!repo) throw new Error('Repositório não encontrado')
    const perfil = this.deps.perfis.obter(perfilId)

    const quadro: Quadro = {
      id: this.deps.novoId(),
      repoId,
      perfilId: perfil.id,
      tipo,
      titulo: proximoTitulo(estado.quadros, tipo, perfil.provedor),
      caixa: { ...this.lugar(estado, posicao ?? proximaPosicao(estado.quadros)), largura: LARGURA, altura: ALTURA },
      ...(tipo === 'agente' && perfil.provedor === 'claude' ? { sessaoId: this.deps.novaSessao() } : {}),
    }
    estado.quadros.push(quadro)
    repo.perfilPadraoId = perfil.id
    estado.ultimoPerfilId = perfil.id
    this.deps.armazem.salvar(estado)
    return quadro
  }

  /**
   * Quadro numa copia separada da pasta (git worktree, branch propria; T10.3, D18). A copia vira
   * uma pasta da lista. Pedir copia de uma copia copia a pasta original.
   */
  async criarEmCopia(
    repoId: string,
    tipo: TipoQuadro,
    perfilId: string,
    posicao?: Posicao,
  ): Promise<{ quadro: Quadro; repo: Repo }> {
    const antes = this.deps.armazem.carregar()
    const escolhida = antes.repos.find((r) => r.id === repoId)
    if (!escolhida) throw new Error('Repositório não encontrado')
    const origemId = escolhida.copia?.origemId ?? escolhida.id
    const origem = antes.repos.find((r) => r.id === origemId)
    if (!origem) throw new Error('A pasta original desta cópia saiu da lista')
    const perfil = this.deps.perfis.obter(perfilId)
    const titulo = proximoTitulo(antes.quadros, tipo, perfil.provedor)
    const usados = antes.repos.flatMap((r) => (r.copia ? [r.copia.apelido] : []))
    const { caminho, copia } = await this.deps.copias.criar(origem, titulo, usados)

    const estado = this.deps.armazem.carregar()
    const nome = `${origem.nome} ⑂ ${copia.apelido}`
    const repo: Repo = { id: this.deps.novoId(), nome, caminho, perfilPadraoId: perfil.id, copia }
    estado.repos.push(repo)
    this.deps.armazem.salvar(estado)
    return { quadro: this.criar(repo.id, tipo, perfil.id, posicao), repo }
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

  /** Ultimo quadro de uma copia: a copia e limpa sem perder trabalho e, se saiu, deixa a lista (D18). */
  async remover(quadroId: string): Promise<FimDaCopia> {
    const { repoId } = this.obter(quadroId)
    this.deps.fecharTerminal(quadroId)
    const estado = this.deps.armazem.carregar()
    estado.quadros = estado.quadros.filter((q) => q.id !== quadroId)
    this.deps.armazem.salvar(estado)

    const repo = estado.repos.find((r) => r.id === repoId)
    if (!repo?.copia || estado.quadros.some((q) => q.repoId === repoId)) return { copia: 'nenhuma' }
    const origem = estado.repos.find((r) => r.id === repo.copia?.origemId)
    const fim = await this.deps.copias.limpar(repo, origem?.caminho)
    if (fim.copia !== 'mantida') {
      const depois = this.deps.armazem.carregar()
      depois.repos = depois.repos.filter((r) => r.id !== repoId)
      this.deps.armazem.salvar(depois)
    }
    return fim
  }
}
