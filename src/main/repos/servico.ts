// Cadastro de repositorios da lousa (T3.2). O repo tem UMA conta padrao (a dos
// quadros novos); cada quadro pode usar outra (D11), entao um repo aparece so uma vez.
import type { Repo } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'
import { normalizarCaminho, sugerirPerfil } from './sugerir'

export interface DepsServicoRepos {
  armazem: Armazem
  perfis: Pick<ServicoPerfis, 'obter' | 'detectados'>
  ehPasta(caminho: string): boolean
  novoId(): string
}

const NAO_ENCONTRADO = 'Repositório não encontrado'

/** Ultimo trecho nao vazio do caminho. */
function nomeDaPasta(caminho: string): string {
  const partes = caminho.split(/[\\/]/).filter((p) => p !== '')
  return partes[partes.length - 1] ?? caminho
}

export class ServicoRepos {
  constructor(private readonly deps: DepsServicoRepos) {}

  listar(): Repo[] {
    return this.deps.armazem.carregar().repos
  }

  sugerir(caminho: string): string | null {
    const { ultimoPerfilId } = this.deps.armazem.carregar()
    return sugerirPerfil(caminho, this.deps.perfis.detectados(), ultimoPerfilId)
  }

  adicionar(caminho: string, perfilId: string): Repo {
    if (!this.deps.ehPasta(caminho)) throw new Error('Pasta não encontrada')
    this.deps.perfis.obter(perfilId)
    const estado = this.deps.armazem.carregar()
    const jaTem = estado.repos.some((r) => normalizarCaminho(r.caminho) === normalizarCaminho(caminho))
    if (jaTem) {
      throw new Error('Este repositório já está na lousa. Use "+ Agente" nele para abrir outra conta')
    }
    const repo: Repo = {
      id: this.deps.novoId(),
      nome: nomeDaPasta(caminho),
      caminho,
      perfilPadraoId: perfilId,
      caixa: { x: 40 + estado.repos.length * 960, y: 40, largura: 920, altura: 620 },
    }
    estado.repos.push(repo)
    estado.ultimoPerfilId = perfilId
    this.deps.armazem.salvar(estado)
    return repo
  }

  /** So muda a conta usada nos quadros novos; os quadros que ja existem ficam como estao. */
  mudarPerfilPadrao(repoId: string, perfilId: string): Repo {
    this.deps.perfis.obter(perfilId)
    const estado = this.deps.armazem.carregar()
    const repo = estado.repos.find((r) => r.id === repoId)
    if (!repo) throw new Error(NAO_ENCONTRADO)
    repo.perfilPadraoId = perfilId
    this.deps.armazem.salvar(estado)
    return repo
  }

  /** Apaga o repo da lousa e os quadros dele. Os arquivos da pasta nunca sao tocados. */
  remover(repoId: string): void {
    const estado = this.deps.armazem.carregar()
    if (!estado.repos.some((r) => r.id === repoId)) throw new Error(NAO_ENCONTRADO)
    estado.repos = estado.repos.filter((r) => r.id !== repoId)
    estado.quadros = estado.quadros.filter((q) => q.repoId !== repoId)
    this.deps.armazem.salvar(estado)
  }
}
