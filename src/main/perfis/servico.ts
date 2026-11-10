// Regra das contas: junta o que foi detectado no PC com o que o usuario ajustou
// (nome) e com o status de login lido de cada uma (T1.6).
import { join } from 'node:path'
import type { EstadoSalvo, GitDaConta, Perfil, PerfilComConta, PerfilId, Provedor, StatusConta } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import { normalizarGit } from './git'
import { slugConta } from './slug'

export interface DepsServicoPerfis {
  detectar(ajustes: EstadoSalvo['perfis']): Perfil[]
  armazem: Armazem
  lerConta(perfil: Perfil): Promise<StatusConta>
  home: string // USERPROFILE: as contas novas nascem em <home>/.claude-<slug> ou .codex-<slug>
  /** mkdir recursivo; a unica escrita da Lousa perto das pastas de conta (CLAUDE.md). */
  criarPasta(caminho: string): void
}

/** Sufixos que ja tem dono: a conta padrao de cada provedor. */
const RESERVADOS: Record<Provedor, string> = { claude: 'principal', codex: 'padrao' }

const NAO_ENCONTRADA = 'Conta não encontrada'

export class ServicoPerfis {
  private readonly cache = new Map<PerfilId, StatusConta>()

  constructor(private readonly deps: DepsServicoPerfis) {}

  private perfis(): Perfil[] {
    return this.deps.detectar(this.deps.armazem.carregar().perfis)
  }

  /** Le a conta so se ainda nao esta no cache; a leitura chama o claude, que leva alguns segundos. */
  private async conta(perfil: Perfil): Promise<StatusConta> {
    const guardada = this.cache.get(perfil.id)
    if (guardada) return guardada
    const lida = await this.deps.lerConta(perfil)
    this.cache.set(perfil.id, lida)
    return lida
  }

  /** Contas lidas em paralelo; o que ja esta no cache nao e lido de novo. */
  async listar(): Promise<PerfilComConta[]> {
    const perfis = this.perfis()
    const contas = await Promise.all(perfis.map((p) => this.conta(p)))
    return perfis.map((p, i) => ({ ...p, conta: contas[i] as StatusConta }))
  }

  /** So o que foi detectado no PC, sem ler o login de nenhuma conta (rapido). */
  detectados(): Perfil[] {
    return this.perfis()
  }

  /** Lanca 'Conta não encontrada' para id desconhecido. */
  obter(perfilId: PerfilId): Perfil {
    const perfil = this.perfis().find((p) => p.id === perfilId)
    if (!perfil) throw new Error(NAO_ENCONTRADA)
    return perfil
  }

  async renomear(perfilId: PerfilId, nome: string): Promise<PerfilComConta> {
    this.obter(perfilId)
    const estado = this.deps.armazem.carregar()
    estado.perfis[perfilId] = { ...estado.perfis[perfilId], nome: nome.trim() }
    this.deps.armazem.salvar(estado)
    const perfil = this.obter(perfilId)
    return { ...perfil, conta: await this.conta(perfil) }
  }

  /** Git e GitHub da conta (C1, D42); null volta ao git do PC. Vale para os terminais abertos depois. */
  async definirGit(perfilId: PerfilId, git: GitDaConta | null): Promise<PerfilComConta> {
    this.obter(perfilId)
    const limpo = normalizarGit(git)
    const estado = this.deps.armazem.carregar()
    const { git: _antigo, ...resto } = estado.perfis[perfilId] ?? {}
    estado.perfis[perfilId] = limpo ? { ...resto, git: limpo } : resto
    this.deps.armazem.salvar(estado)
    const perfil = this.obter(perfilId)
    return { ...perfil, conta: await this.conta(perfil) }
  }

  /** Pasta do quadro livre da conta (D65); null tira. Quem confere que a pasta existe e o handler. */
  async definirPastaLivre(perfilId: PerfilId, caminho: string | null): Promise<PerfilComConta> {
    this.obter(perfilId)
    const estado = this.deps.armazem.carregar()
    const { pastaLivre: _antiga, ...resto } = estado.perfis[perfilId] ?? {}
    estado.perfis[perfilId] = caminho ? { ...resto, pastaLivre: caminho } : resto
    this.deps.armazem.salvar(estado)
    const perfil = this.obter(perfilId)
    return { ...perfil, conta: await this.conta(perfil) }
  }

  /** T1.8: cria a pasta vazia da conta e marca `criada`, para ela ser detectada antes do login. */
  async criar(provedor: Provedor, nome: string): Promise<PerfilComConta> {
    const slug = slugConta(nome)
    if (slug === '') throw new Error('Nome inválido')
    if (slug === RESERVADOS[provedor]) throw new Error('Nome reservado')
    const id = provedor === 'claude' ? slug : `cx:${slug}`
    if (this.perfis().some((p) => p.id === id)) throw new Error('Já existe uma conta com esse nome')
    this.deps.criarPasta(join(this.deps.home, provedor === 'claude' ? `.claude-${slug}` : `.codex-${slug}`))
    const estado = this.deps.armazem.carregar()
    estado.perfis[id] = { ...estado.perfis[id], nome: nome.trim(), provedor, criada: true }
    this.deps.armazem.salvar(estado)
    const perfil = this.obter(id)
    return { ...perfil, conta: await this.conta(perfil) }
  }

  /** Forca uma nova leitura (botao "Atualizar", ou depois de um login). */
  async atualizarConta(perfilId: PerfilId): Promise<StatusConta> {
    const perfil = this.obter(perfilId)
    this.cache.delete(perfil.id)
    return this.conta(perfil)
  }
}
