// Compactar sozinho ao fim da tarefa (A17): com a caixa marcada na engrenagem, o agente que termina
// a vez com o contexto acima do limite recebe /compact. Nunca no meio do trabalho: uma tarefa grande
// passa do limite e so compacta quando acaba. Sem a caixa, compactar fica com o Sidney (o anel).
import type { AvisoAgente, EstadoAgente, PrefCompactar } from '../../shared/model'
import { fimDaVez } from '../time/repasse'

export const PREF_COMPACTAR_PADRAO: PrefCompactar = { ligado: false, limite: 40 }

export interface DepsCompactarSozinho {
  /** % do contexto usado, pela ultima linha de status do agente; null sem dado. */
  usado(quadroId: string): number | null
  /** Outra coisa ja vai mexer no agente (troca de modelo esperando): nao compacta agora. */
  ocupado(quadroId: string): boolean
  /** Digita /compact (agentes/compactar.ts: confere parado e claude.exe; lanca se nao puder). */
  compactar(quadroId: string): Promise<void>
  /** Digitou o /compact: o resumo dele nao e a vez do agente (o repasse nao passa adiante). */
  aoCompactar(quadroId: string): void
  /** Nao deu para compactar: o que esperava (mensagens do time) pode sair. */
  aoDesistir(quadroId: string, erro: unknown): void
}

export class CompactarSozinho {
  private pref: PrefCompactar = PREF_COMPACTAR_PADRAO
  private readonly antes = new Map<string, EstadoAgente>()
  private readonly compactando = new Set<string>()

  constructor(private readonly deps: DepsCompactarSozinho) {}

  definir(pref: PrefCompactar): void {
    this.pref = pref
  }

  /**
   * Cada aviso do OSC 7501. Chame depois do repasse (que ja viu a vez de verdade) e antes da fila
   * de mensagens (que espera enquanto `segurando`).
   */
  aoEstado(quadroId: string, aviso: AvisoAgente): void {
    const antes = this.antes.get(quadroId)
    this.antes.set(quadroId, aviso.estado)
    if (!fimDaVez(antes, aviso.estado)) return
    // a vez que terminou era o proprio /compact: nao compacta de novo
    if (this.compactando.delete(quadroId)) return
    if (!this.deveCompactar(quadroId)) return
    this.compactando.add(quadroId)
    this.deps.compactar(quadroId).then(
      () => this.deps.aoCompactar(quadroId),
      (e: unknown) => {
        this.compactando.delete(quadroId)
        this.deps.aoDesistir(quadroId, e)
      },
    )
  }

  /** Compactando: a fila de mensagens espera o /compact acabar. */
  segurando(quadroId: string): boolean {
    return this.compactando.has(quadroId)
  }

  /** O terminal fechou ou reabriu. */
  esquecer(quadroId: string): void {
    this.antes.delete(quadroId)
    this.compactando.delete(quadroId)
  }

  private deveCompactar(quadroId: string): boolean {
    if (!this.pref.ligado || this.deps.ocupado(quadroId)) return false
    const usado = this.deps.usado(quadroId)
    return usado !== null && usado >= this.pref.limite
  }
}
