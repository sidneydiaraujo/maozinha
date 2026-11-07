// Colegas pedidos pelo proprio agente (A19, D56): o agente chama `criar_colegas` e o Mãozinha
// pergunta na tela. So cria com o clique do usuario; sem resposta em 5 minutos, nada e criado.
// Um pedido aberto por agente. `paralelo` (A21): o agente ia usar subagentes; a pergunta e se o
// usuario quer ver em quadros, e a recusa manda seguir no mesmo terminal. Puro (o criar e o aviso
// a tela vem de fora).
import type { AvisoPedidoColegas } from '../../shared/model'
import { ESPERAR, noClaude, type PedidoColega, type RespostaFerramenta } from '../mcp/ferramentas'

export const ESPERA_RESPOSTA_MS = 5 * 60 * 1000

// eslint-disable-next-line no-control-regex
const CONTROLE = /[\u0000-\u001f\u007f]+/g

/** O que o colega recebe: de quem veio e a tarefa, numa linha so (um Enter no meio enviaria antes). */
export function textoDaTarefa(de: string, tarefa: string): string {
  return `Tarefa pedida por ${de} (colega do time no Mãozinha): ${tarefa}`.replace(CONTROLE, ' ').trim()
}

/**
 * `esperar_colegas` com o pedido ainda na tela (A27): antes dizia "nenhum colega", e o agente
 * achava que o pedido tinha falhado e pedia de novo.
 */
export const TEXTO_PEDIDO_NA_TELA =
  'O seu pedido de colegas ainda espera o usuário responder na janela do Mãozinha. Não peça de novo: ' +
  `chame ${noClaude(ESPERAR)} outra vez daqui a pouco; os colegas nascem quando ele aceitar.`

/**
 * R1.3: o `criar` falhou depois de alguns colegas ja terem nascido (a copia do git do 2o, por
 * exemplo). Leva os nomes de quem nasceu; quem criou ja os registrou na espera e no time.
 */
export class CriacaoParcial extends Error {
  constructor(
    readonly nomes: string[],
    motivo: string,
  ) {
    super(motivo)
  }
}

const MESMO_TERMINAL ='rode estas tarefas com os seus subagentes (Agent/Task), como faria normalmente.'

/** A resposta ao agente quando o pedido acaba sem colegas. */
function semColegas(motivo: 'recusou' | 'venceu', paralelo: boolean): RespostaFerramenta {
  if (paralelo) {
    const inicio = motivo === 'recusou' ? 'O usuário preferiu seguir no mesmo terminal' : 'O usuário não respondeu em 5 minutos; siga no mesmo terminal'
    return { texto: `${inicio}: ${MESMO_TERMINAL}` }
  }
  return { texto: motivo === 'recusou' ? 'O usuário recusou: nenhum colega foi criado.' : 'O usuário não respondeu em 5 minutos; nenhum colega foi criado.' }
}

/** A resposta ao agente quando os colegas nasceram. */
function comColegas(nomes: string[], paralelo: boolean): RespostaFerramenta {
  const quem = `${nomes.length} colega(s), ${nomes.join(', ')}`
  if (paralelo) {
    return {
      texto:
        `O usuário quis ver em quadros: criei ${quem}, na mesma pasta que você. Não rode estas tarefas em subagentes. ` +
        `Chame ${noClaude(ESPERAR)} para esperar todos terminarem e então siga o seu método (confira os arquivos de saída).`,
    }
  }
  return {
    texto:
      `O usuário aceitou: criei ${quem}, ligados a você. Cada um recebe a tarefa assim que abrir; o que eles ` +
      `fizerem aparece no quadro de cada um. Para saber quando terminarem, chame ${noClaude(ESPERAR)}.`,
  }
}

export interface DepsPedidos {
  /** Como o agente aparece no time (papel, apelido da copia ou titulo). */
  nome(quadroId: string): string
  avisarTela(aviso: AvisoPedidoColegas): void
  /** Cria os colegas ligados ao quadro e entrega a tarefa; devolve o nome de cada um. */
  criar(quadroId: string, colegas: PedidoColega[], paralelo: boolean): Promise<string[]>
  adiar(fn: () => void, ms: number): () => void
  novoId(): string
}

interface Aberto {
  quadroId: string
  colegas: PedidoColega[]
  paralelo: boolean
  terminar(r: RespostaFerramenta): void
}

export class PedidosDeColegas {
  private readonly abertos = new Map<string, Aberto>()

  constructor(private readonly deps: DepsPedidos) {}

  pedir(quadroId: string, colegas: PedidoColega[], paralelo = false): Promise<RespostaFerramenta> {
    if (this.temAberto(quadroId)) {
      return Promise.resolve({ texto: TEXTO_PEDIDO_NA_TELA, erro: true })
    }
    const pedidoId = this.deps.novoId()
    return new Promise((resolve) => {
      const cancelar = this.deps.adiar(() => this.encerrar(pedidoId, semColegas('venceu', paralelo)), ESPERA_RESPOSTA_MS)
      this.abertos.set(pedidoId, {
        quadroId,
        colegas,
        paralelo,
        terminar: (r) => {
          cancelar()
          resolve(r)
        },
      })
      this.deps.avisarTela({ tipo: 'novo', pedido: { pedidoId, quadroId, nome: this.deps.nome(quadroId), colegas, paralelo } })
    })
  }

  /** O agente tem um pedido esperando o clique do usuario? */
  temAberto(quadroId: string): boolean {
    return [...this.abertos.values()].some((a) => a.quadroId === quadroId)
  }

  /** O clique na tela. Pedido que ja acabou (respondido, vencido): nada. */
  async responder(pedidoId: string, aceitar: boolean): Promise<void> {
    const aberto = this.abertos.get(pedidoId)
    if (!aberto) return
    if (!aceitar) return this.encerrar(pedidoId, semColegas('recusou', aberto.paralelo))
    this.abertos.delete(pedidoId) // um segundo clique nao cria de novo
    try {
      const nomes = await this.deps.criar(aberto.quadroId, aberto.colegas, aberto.paralelo)
      this.encerrar(pedidoId, comColegas(nomes, aberto.paralelo), aberto)
    } catch (e) {
      const motivo = e instanceof Error ? e.message : String(e)
      // R1.3: alguns nasceram antes da falha: o agente fica sabendo deles e pode esperar por eles
      const nasceram = e instanceof CriacaoParcial ? e.nomes : []
      const texto =
        nasceram.length > 0
          ? `${comColegas(nasceram, aberto.paralelo).texto} Os outros colegas pedidos não nasceram: ${motivo}`
          : `Não deu para criar os colegas: ${motivo}`
      this.encerrar(pedidoId, { texto, erro: true }, aberto)
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
