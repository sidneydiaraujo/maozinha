// Vigia das pastas salvas (T7.1): um vigia recursivo por pasta, como o VSCode.
// Os eventos sao juntados por 75 ms (FILE_CHANGES_HANDLER_DELAY do VSCode) e vao
// para a tela em lote, ja sem .git, node_modules, builds e repetidos.
import type { Repo } from '../../shared/model'
import { mudancaRelevante } from './regras'

export interface Observacao {
  fechar(): void
}

/** fs.watch recursivo; `aoFalhar` quando a pasta some ou o Windows derruba o vigia. */
export type Observar = (caminho: string, aoMudar: (nome: string) => void, aoFalhar: () => void) => Observacao

export const ATRASO_MS = 75
const MAXIMO_POR_LOTE = 200

interface Vigiada {
  caminho: string
  observacao: Observacao
}

export class VigiaArquivos {
  private readonly vigiadas = new Map<string, Vigiada>()
  private readonly pendentes = new Map<string, Set<string>>()
  private relogio: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly observar: Observar,
    private readonly avisar: (repoId: string, caminhos: string[]) => void,
  ) {}

  /** Vigia exatamente estas pastas: abre as novas, fecha as que sairam ou mudaram de caminho. */
  sincronizar(repos: Repo[]): void {
    const ids = new Set(repos.map((r) => r.id))
    for (const [id, v] of this.vigiadas) {
      const repo = repos.find((r) => r.id === id)
      if (!ids.has(id) || repo?.caminho !== v.caminho) this.parar(id)
    }
    for (const repo of repos) if (!this.vigiadas.has(repo.id)) this.comecar(repo)
  }

  fecharTodos(): void {
    for (const id of [...this.vigiadas.keys()]) this.parar(id)
    if (this.relogio) clearTimeout(this.relogio)
    this.relogio = null
    this.pendentes.clear()
  }

  private comecar(repo: Repo): void {
    const observacao = this.observar(
      repo.caminho,
      (nome) => this.anotar(repo.id, nome),
      () => this.parar(repo.id),
    )
    this.vigiadas.set(repo.id, { caminho: repo.caminho, observacao })
  }

  private parar(id: string): void {
    this.vigiadas.get(id)?.observacao.fechar()
    this.vigiadas.delete(id)
    this.pendentes.delete(id)
  }

  private anotar(repoId: string, nome: string): void {
    const relativo = mudancaRelevante(nome)
    if (relativo === null || !this.vigiadas.has(repoId)) return
    const lote = this.pendentes.get(repoId) ?? new Set<string>()
    if (lote.size < MAXIMO_POR_LOTE) lote.add(relativo)
    this.pendentes.set(repoId, lote)
    this.relogio ??= setTimeout(() => this.entregar(), ATRASO_MS)
  }

  private entregar(): void {
    this.relogio = null
    const lotes = [...this.pendentes]
    this.pendentes.clear()
    for (const [repoId, caminhos] of lotes) this.avisar(repoId, [...caminhos])
  }
}
