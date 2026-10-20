// Trocar modelo e esforco de um agente aberto (T19.1, D24). O texto sai dos enums, montado aqui
// no main; com o agente trabalhando, o pedido espera ele parar (OSC 7501 parado ou terminou).
import { podeCompactar } from '../../shared/compactar'
import { ESFORCOS, MODELOS, type AjusteAgente, type AvisoAgente, type QuandoAjusta } from '../../shared/model'
import { PAUSA_ENTER_MS } from './compactar'

/** Entre um comando e o seguinte: o Claude precisa terminar o /model antes do /effort. */
export const PAUSA_ENTRE_MS = 600

/** `/model sonnet`, `/effort high`. So valores da lista viram texto. Puro. */
export function comandosDoAjuste(m: AjusteAgente): string[] {
  const comandos: string[] = []
  if (m.modelo && MODELOS.includes(m.modelo)) comandos.push(`/model ${m.modelo}`)
  if (m.esforco && ESFORCOS.includes(m.esforco)) comandos.push(`/effort ${m.esforco}`)
  return comandos
}

export interface DepsAjustes {
  aberto(terminalId: string): boolean
  aviso(terminalId: string): AvisoAgente | null
  escrever(terminalId: string, dados: string): void
  esperar(ms: number): Promise<void>
}

export class FilaAjustes {
  /** Pedidos de quem estava trabalhando, por quadro; o mais novo de cada campo vence. */
  private readonly pendentes = new Map<string, AjusteAgente>()

  constructor(private readonly deps: DepsAjustes) {}

  /** Agente fechado: so vale na abertura (o comando ja leva --model/--effort). */
  async pedir(quadroId: string, mudanca: AjusteAgente): Promise<QuandoAjusta> {
    if (!this.deps.aberto(quadroId)) {
      this.pendentes.delete(quadroId)
      return 'naAbertura'
    }
    if (!podeCompactar(this.deps.aviso(quadroId)?.estado)) {
      this.pendentes.set(quadroId, { ...this.pendentes.get(quadroId), ...mudanca })
      return 'quandoParar'
    }
    await this.digitar(quadroId, mudanca)
    return 'agora'
  }

  /** Chamado a cada aviso do OSC 7501: o agente parou e tinha pedido na fila. */
  aoEstado(quadroId: string, aviso: AvisoAgente): Promise<void> {
    const pendente = this.pendentes.get(quadroId)
    if (!pendente || !podeCompactar(aviso.estado)) return Promise.resolve()
    this.pendentes.delete(quadroId)
    return this.digitar(quadroId, pendente)
  }

  /** O terminal do quadro fechou: o pedido ja vai no comando da proxima abertura. */
  esquecer(quadroId: string): void {
    this.pendentes.delete(quadroId)
  }

  private async digitar(quadroId: string, mudanca: AjusteAgente): Promise<void> {
    const comandos = comandosDoAjuste(mudanca)
    for (const [i, comando] of comandos.entries()) {
      if (i > 0) await this.deps.esperar(PAUSA_ENTRE_MS)
      this.deps.escrever(quadroId, comando)
      await this.deps.esperar(PAUSA_ENTER_MS)
      this.deps.escrever(quadroId, '\r')
    }
  }
}
