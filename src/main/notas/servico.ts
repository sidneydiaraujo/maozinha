// Notas soltas na lousa (T26.1, D34): texto markdown ao lado dos agentes, sem pasta nem conta.
import type { Nota, Posicao } from '../../shared/model'
import type { Armazem } from '../estado/armazem'
import { lugarLivre } from '../quadros/lugar'

export const MAXIMO_LETRAS_NOTA = 20000
const LARGURA = 380
const ALTURA = 280

export interface DepsServicoNotas {
  armazem: Armazem
  novoId(): string
}

export class ServicoNotas {
  constructor(private readonly deps: DepsServicoNotas) {}

  /** Nota vazia no lugar pedido, ou no livre mais perto (nunca em cima de um quadro). */
  criar(posicao: Posicao): Nota {
    const estado = this.deps.armazem.carregar()
    const notas = estado.notas ?? []
    const ocupadas = [...estado.quadros, ...notas].map((q) => q.caixa)
    const tamanho = { largura: LARGURA, altura: ALTURA }
    const nota: Nota = { id: this.deps.novoId(), texto: '', caixa: { ...lugarLivre(ocupadas, posicao, tamanho), ...tamanho } }
    this.deps.armazem.salvar({ ...estado, notas: [...notas, nota] })
    return nota
  }

  /** Lanca 'Nota não encontrada'. O texto passa do maximo: lanca, nada e cortado em silencio. */
  salvar(notaId: string, texto: string): void {
    if (texto.length > MAXIMO_LETRAS_NOTA) throw new Error(`A nota passou de ${MAXIMO_LETRAS_NOTA} letras`)
    const estado = this.deps.armazem.carregar()
    const notas = estado.notas ?? []
    if (!notas.some((n) => n.id === notaId)) throw new Error('Nota não encontrada')
    this.deps.armazem.salvar({ ...estado, notas: notas.map((n) => (n.id === notaId ? { ...n, texto } : n)) })
  }

  /** Apagar uma nota que ja nao existe nao e erro. */
  remover(notaId: string): void {
    const estado = this.deps.armazem.carregar()
    this.deps.armazem.salvar({ ...estado, notas: (estado.notas ?? []).filter((n) => n.id !== notaId) })
  }
}
