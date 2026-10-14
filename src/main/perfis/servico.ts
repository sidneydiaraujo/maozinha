// Regra das contas: junta o que foi detectado no PC com o que o usuario ajustou
// (nome) e com o status de login lido de cada uma (T1.6).
import type { EstadoSalvo, Perfil, PerfilComConta, PerfilId, StatusConta } from '../../shared/model'
import type { Armazem } from '../estado/armazem'

export interface DepsServicoPerfis {
  detectar(ajustes: EstadoSalvo['perfis']): Perfil[]
  armazem: Armazem
  lerConta(perfil: Perfil): Promise<StatusConta>
}

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

  /** Forca uma nova leitura (botao "Atualizar", ou depois de um login). */
  async atualizarConta(perfilId: PerfilId): Promise<StatusConta> {
    const perfil = this.obter(perfilId)
    this.cache.delete(perfil.id)
    return this.conta(perfil)
  }
}
