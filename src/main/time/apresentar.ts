// O time se conhece (T29.1, D39): quando o time muda, cada agente recebe quem ele e, quem sao os
// colegas e para quem entrega. A Lousa so digita com o agente parado (como a D25).
import { podeCompactar } from '../../shared/compactar'
import type { AvisoAgente } from '../../shared/model'
import { textoDoTime, TEXTO_SAIU_DO_TIME, type DadosTime } from '../../shared/time'
import { PAUSA_ENTER_MS } from '../agentes/compactar'
import type { DepsAjustes } from '../agentes/ajustes'

export interface DepsFila extends DepsAjustes {
  /** O claude.exe ainda roda no terminal? (ele nao avisa quando sai; terminais/filhos.ts) */
  temClaude(terminalId: string): Promise<boolean>
}

/** Montar uma arvore manda uma apresentacao so: espera o time ficar 2 s sem mudar. */
export const ESPERA_APRESENTAR_MS = 2000

/**
 * Uma mensagem pendente por agente; a mais nova substitui a anterior (a apresentacao velha nao
 * vale mais). Agente trabalhando, esperando voce ou fechado: espera ele parar.
 */
export class FilaMensagens {
  private readonly pendentes = new Map<string, string>()

  constructor(private readonly deps: DepsFila) {}

  async mandar(quadroId: string, texto: string): Promise<void> {
    if (!this.deps.aberto(quadroId) || !podeCompactar(this.deps.aviso(quadroId)?.estado)) {
      this.pendentes.set(quadroId, texto)
      return
    }
    this.pendentes.delete(quadroId)
    await this.digitar(quadroId, texto)
  }

  aoEstado(quadroId: string, aviso: AvisoAgente): Promise<void> {
    const texto = this.pendentes.get(quadroId)
    if (texto === undefined || !podeCompactar(aviso.estado)) return Promise.resolve()
    this.pendentes.delete(quadroId)
    return this.digitar(quadroId, texto)
  }

  /** O quadro saiu da lousa: a mensagem dele nao vale mais. */
  esquecer(quadroId: string): void {
    this.pendentes.delete(quadroId)
  }

  pendente(quadroId: string): string | undefined {
    return this.pendentes.get(quadroId)
  }

  /**
   * Texto e Enter separados: juntos o Claude trata como colagem e nao envia (D21). Sem claude.exe
   * no terminal (saiu e ficou o PowerShell), nao digita: a mensagem volta para a fila.
   */
  private async digitar(quadroId: string, texto: string): Promise<void> {
    if (!(await this.deps.temClaude(quadroId))) {
      if (!this.pendentes.has(quadroId)) this.pendentes.set(quadroId, texto)
      return
    }
    this.deps.escrever(quadroId, texto)
    await this.deps.esperar(PAUSA_ENTER_MS)
    this.deps.escrever(quadroId, '\r')
  }
}

export interface DepsApresentador {
  /** O time como esta salvo agora (quadros, pastas, linhas e o provedor de cada conta). */
  dados(): DadosTime
  fila: Pick<FilaMensagens, 'mandar'>
  /** setTimeout que devolve como cancelar. */
  adiar(fn: () => void, ms: number): () => void
}

export class ApresentadorTime {
  /** O que cada agente ja ouviu; so manda de novo quando o texto muda. */
  private readonly ouvido = new Map<string, string>()
  private cancelar: (() => void) | null = null

  constructor(private readonly deps: DepsApresentador) {}

  /** Algo no time pode ter mudado (linha, colega, papel, quadro fechado, conta trocada). */
  mudou(): void {
    this.cancelar?.()
    this.cancelar = this.deps.adiar(() => {
      this.cancelar = null
      this.apresentar()
    }, ESPERA_APRESENTAR_MS)
  }

  apresentar(): void {
    const dados = this.deps.dados()
    const existem = new Set(dados.quadros.map((q) => q.id))
    for (const id of [...this.ouvido.keys()]) if (!existem.has(id)) this.ouvido.delete(id)
    for (const q of dados.quadros) {
      if (q.tipo !== 'agente' || dados.provedores[q.perfilId] !== 'claude') continue
      const antes = this.ouvido.get(q.id)
      const agora = textoDoTime(dados, q.id) ?? (antes && antes !== TEXTO_SAIU_DO_TIME ? TEXTO_SAIU_DO_TIME : null)
      if (agora === null || agora === antes) continue
      this.ouvido.set(q.id, agora)
      void this.deps.fila.mandar(q.id, agora)
    }
  }
}
