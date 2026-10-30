// Colegas pedidos pelo proprio agente (A19, D56): o agente chama `criar_colegas` e o Mãozinha
// pergunta na tela. So cria com o clique do usuario; sem resposta em 5 minutos, nada e criado.
// Um pedido aberto por agente. Puro (o criar e o aviso a tela vem de fora).
import type { PedidoColega, RespostaFerramenta } from '../mcp/protocolo'
import type { AvisoPedidoColegas } from '../../shared/model'

export const ESPERA_RESPOSTA_MS = 5 * 60 * 1000

// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f]+/g

/** O que o colega recebe: de quem veio e a tarefa, numa linha so (um Enter no meio enviaria antes). */
export function textoDaTarefa(de: string, tarefa: string): string {
  return `Tarefa pedida por ${de} (colega do time no Mãozinha): ${tarefa}`.replace(CONTROLE, ' ').trim()
}

export interface DepsPedidos {
  /** Como o agente aparece no time (papel, apelido da copia ou titulo). */
  nome(quadroId: string): string
  avisarTela(aviso: AvisoPedidoColegas): void
  /** Cria os colegas ligados ao quadro e entrega a tarefa; devolve o nome de cada um. */
  criar(quadroId: string, colegas: PedidoColega[]): Promise<string[]>
  adiar(fn: () => void, ms: number): () => void
  novoId(): string
}

interface Aberto {
  quadroId: string
  colegas: PedidoColega[]
  terminar(r: RespostaFerramenta): void
}

export class PedidosDeColegas {
  private readonly abertos = new Map<string, Aberto>()

  constructor(private readonly deps: DepsPedidos) {}

  pedir(quadroId: string, colegas: PedidoColega[]): Promise<RespostaFerramenta> {
    if ([...this.abertos.values()].some((a) => a.quadroId === quadroId)) {
      return Promise.resolve({ texto: 'Já existe um pedido seu esperando o usuário responder.', erro: true })
    }
    const pedidoId = this.deps.novoId()
    return new Promise((resolve) => {
      const cancelar = this.deps.adiar(() => {
        this.encerrar(pedidoId, { texto: 'O usuário não respondeu em 5 minutos; nenhum colega foi criado.' })
      }, ESPERA_RESPOSTA_MS)
      this.abertos.set(pedidoId, {
        quadroId,
        colegas,
        terminar: (r) => {
          cancelar()
          resolve(r)
        },
      })
      this.deps.avisarTela({ tipo: 'novo', pedido: { pedidoId, quadroId, nome: this.deps.nome(quadroId), colegas } })
    })
  }

  /** O clique na tela. Pedido que ja acabou (respondido, vencido): nada. */
  async responder(pedidoId: string, aceitar: boolean): Promise<void> {
    const aberto = this.abertos.get(pedidoId)
    if (!aberto) return
    if (!aceitar) return this.encerrar(pedidoId, { texto: 'O usuário recusou: nenhum colega foi criado.' })
    this.abertos.delete(pedidoId) // um segundo clique nao cria de novo
    try {
      const nomes = await this.deps.criar(aberto.quadroId, aberto.colegas)
      this.encerrar(pedidoId, {
        texto:
          `O usuário aceitou: criei ${nomes.length} colega(s), ${nomes.join(', ')}, ligados a você. ` +
          'Cada um recebe a tarefa assim que abrir; o que eles fizerem aparece no quadro de cada um.',
      }, aberto)
    } catch (e) {
      this.encerrar(pedidoId, { texto: `Não deu para criar os colegas: ${e instanceof Error ? e.message : String(e)}`, erro: true }, aberto)
    }
  }

  /** O agente saiu da lousa: o pedido dele acaba sem criar nada. */
  esquecer(quadroId: string): void {
    for (const [id, a] of this.abertos) {
      if (a.quadroId === quadroId) this.encerrar(id, { texto: 'O quadro foi fechado; nenhum colega foi criado.' })
    }
  }

  private encerrar(pedidoId: string, r: RespostaFerramenta, aberto = this.abertos.get(pedidoId)): void {
    this.abertos.delete(pedidoId)
    if (!aberto) return
    aberto.terminar(r)
    this.deps.avisarTela({ tipo: 'encerrado', pedidoId })
  }
}
