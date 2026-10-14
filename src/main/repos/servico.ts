// Pastas onde os quadros trabalham (T3.2, D13). Cada quadro tem a sua conta (D11);
// a pasta so guarda a ultima conta usada, como sugestao.
import type { Repo } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import type { ServicoPerfis } from '../perfis/servico'
import { normalizarCaminho, sugerirPerfil } from './sugerir'

export interface DepsServicoRepos {
  armazem: Armazem
  perfis: Pick<ServicoPerfis, 'obter' | 'detectados'>
  ehPasta(caminho: string): boolean
  /** Fecha o terminal que vive no main (id do terminal = id do quadro). */
  fecharTerminal(terminalId: string): void
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

  /** Lanca 'Repositório não encontrado'. */
  obter(repoId: string): Repo {
    const repo = this.listar().find((r) => r.id === repoId)
    if (!repo) throw new Error(NAO_ENCONTRADO)
    return repo
  }

  sugerir(caminho: string): string | null {
    const { ultimoPerfilId } = this.deps.armazem.carregar()
    return sugerirPerfil(caminho, this.deps.perfis.detectados(), ultimoPerfilId)
  }

  /** Pasta ja cadastrada (mesmo com outra caixa de letras) devolve a existente: escolher de novo e normal. */
  adicionar(caminho: string, perfilId: string): Repo {
    if (!this.deps.ehPasta(caminho)) throw new Error('Pasta não encontrada')
    this.deps.perfis.obter(perfilId)
    const estado = this.deps.armazem.carregar()
    const existente = estado.repos.find((r) => normalizarCaminho(r.caminho) === normalizarCaminho(caminho))
    if (existente) return existente
    const repo: Repo = { id: this.deps.novoId(), nome: nomeDaPasta(caminho), caminho, perfilPadraoId: perfilId }
    estado.repos.push(repo)
    estado.ultimoPerfilId = perfilId
    this.deps.armazem.salvar(estado)
    return repo
  }

  /** Fecha os terminais, apaga o repo da lousa e os quadros dele. Os arquivos da pasta nunca sao tocados. */
  remover(repoId: string): void {
    const estado = this.deps.armazem.carregar()
    if (!estado.repos.some((r) => r.id === repoId)) throw new Error(NAO_ENCONTRADO)
    for (const q of estado.quadros) if (q.repoId === repoId) this.deps.fecharTerminal(q.id)
    estado.repos = estado.repos.filter((r) => r.id !== repoId)
    estado.quadros = estado.quadros.filter((q) => q.repoId !== repoId)
    this.deps.armazem.salvar(estado)
  }
}
