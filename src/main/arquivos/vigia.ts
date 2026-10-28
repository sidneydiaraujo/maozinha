// Vigia de arquivos (T7.1, D17): so as pastas que a tela mostra (abertas na arvore e a do
// arquivo no leitor), cada uma sem descer nas subpastas. Vigiar a pasta salva inteira
// trazia o AppData todo quando a pasta era a do usuario, e a digitacao atrasava.
// Os eventos sao juntados por 75 ms e vao para a tela em lote, ja sem .git, node_modules,
// builds e repetidos.
import type { Repo } from '../../shared/model'
import { caminhoDentro, mudancaRelevante } from './regras'

export interface Observacao {
  fechar(): void
}

/** fs.watch de uma pasta so; `aoMudar` recebe o nome do que mudou dentro dela. */
export type Observar = (caminho: string, aoMudar: (nome: string) => void, aoFalhar: () => void) => Observacao

/** Pasta que a tela quer acompanhar: `relativo` '' = a raiz da pasta salva. */
export interface PastaVigiada {
  repoId: string
  relativo: string
}

export const ATRASO_MS = 75
const MAXIMO_POR_LOTE = 200

interface Vigiada {
  repoId: string
  relativo: string
  caminho: string
  observacao: Observacao
}

const chaveDe = (p: PastaVigiada): string => `${p.repoId}|${p.relativo}`
const juntar = (pasta: string, nome: string): string => (pasta === '' ? nome : `${pasta}/${nome}`)

export class VigiaArquivos {
  private readonly vigiadas = new Map<string, Vigiada>()
  private readonly pendentes = new Map<string, Set<string>>()
  private relogio: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly observar: Observar,
    private readonly avisar: (repoId: string, caminhos: string[]) => void,
  ) {}

  /** Vigia exatamente estas pastas: abre as novas e fecha as que sairam ou mudaram de lugar. */
  sincronizar(pastas: PastaVigiada[], repos: Repo[]): void {
    const desejadas = new Map<string, { pasta: PastaVigiada; caminho: string }>()
    for (const pasta of pastas) {
      const raiz = repos.find((r) => r.id === pasta.repoId)?.caminho
      const caminho = raiz === undefined ? null : caminhoDentro(raiz, pasta.relativo)
      if (caminho !== null) desejadas.set(chaveDe(pasta), { pasta, caminho })
    }
    for (const [chave, v] of this.vigiadas) {
      if (desejadas.get(chave)?.caminho !== v.caminho) this.parar(chave)
    }
    for (const [chave, { pasta, caminho }] of desejadas) {
      if (!this.vigiadas.has(chave)) this.comecar(chave, pasta, caminho)
    }
  }

  /** Arquivo que o proprio main criou (o KANBAN.md, D52): a tela rele a pasta mesmo que o vigia dela ainda nao rodasse. */
  avisarAgora(repoId: string, caminhos: string[]): void {
    this.avisar(repoId, caminhos)
  }

  fecharTodos(): void {
    for (const chave of [...this.vigiadas.keys()]) this.parar(chave)
    if (this.relogio) clearTimeout(this.relogio)
    this.relogio = null
    this.pendentes.clear()
  }

  private comecar(chave: string, pasta: PastaVigiada, caminho: string): void {
    const observacao = this.observar(
      caminho,
      (nome) => this.anotar(chave, nome),
      () => this.parar(chave),
    )
    this.vigiadas.set(chave, { ...pasta, caminho, observacao })
  }

  private parar(chave: string): void {
    this.vigiadas.get(chave)?.observacao.fechar()
    this.vigiadas.delete(chave)
  }

  private anotar(chave: string, nome: string): void {
    const v = this.vigiadas.get(chave)
    const proprio = mudancaRelevante(nome)
    if (!v || proprio === null) return
    const lote = this.pendentes.get(v.repoId) ?? new Set<string>()
    if (lote.size < MAXIMO_POR_LOTE) lote.add(juntar(v.relativo, proprio))
    this.pendentes.set(v.repoId, lote)
    this.relogio ??= setTimeout(() => this.entregar(), ATRASO_MS)
  }

  private entregar(): void {
    this.relogio = null
    const lotes = [...this.pendentes]
    this.pendentes.clear()
    for (const [repoId, caminhos] of lotes) this.avisar(repoId, [...caminhos])
  }
}
