// R3.13 (D62): hibernar agente parado ha muito tempo. Cada claude.exe ocupa ~300 MB mesmo parado
// (17 agentes, ~5,8 GB, na revisao de 07/11). O agente Claude que terminou ou esta parado ha 2 h,
// sem ninguem digitando, fora de um time e sem nada pendente, fecha; o quadro fica "dormindo" (salvo)
// e acordar remonta o terminal, que retoma a mesma conversa com --resume (T6.1).
import type { AvisoAgente, EstadoAgente } from '../../shared/model'

export const QUIETO_PARA_DORMIR_MS = 2 * 60 * 60 * 1000
export const VARREDURA_MS = 5 * 60 * 1000

export interface CandidatoSono {
  estado: EstadoAgente | null
  /** Tem linha com outro quadro: o time escreve nele sem a tela (repasse, espera, apresentacao). */
  ligado: boolean
  /** Modelo para trocar, /compact pendente, apresentacao do time na fila. */
  ocupado: boolean
  quietoMs: number
}

/** Esperando (permissao, pergunta) nunca dorme: o pedido em aberto se perderia. */
export function podeDormir(c: CandidatoSono, limite = QUIETO_PARA_DORMIR_MS): boolean {
  return (c.estado === 'terminou' || c.estado === 'parado') && !c.ligado && !c.ocupado && c.quietoMs >= limite
}

export interface DepsHibernacao {
  /** Agentes Claude com terminal aberto. */
  agentesAbertos(): { id: string; ligado: boolean }[]
  aviso(id: string): AvisoAgente | null
  ocupado(id: string): boolean
  /** O claude.exe ainda roda (o Sidney pode ter saido para o PowerShell). */
  temClaude(id: string): Promise<boolean>
  agora(): number
  adormecer(id: string): void
}

export class Hibernacao {
  /** Desde quando o quadro esta quieto, e o ultimo aviso visto (objeto novo = estado novo). */
  private readonly quieto = new Map<string, { desde: number; aviso: AvisoAgente | null }>()

  constructor(
    private readonly deps: DepsHibernacao,
    private readonly limite = QUIETO_PARA_DORMIR_MS,
  ) {}

  /** O Sidney digitou: recomeca a contar. */
  mexeu(id: string): void {
    this.quieto.set(id, { desde: this.deps.agora(), aviso: this.deps.aviso(id) })
  }

  /** Uma passada: devolve quem dormiu. Quadro visto pela primeira vez comeca a contar agora. */
  async varrer(): Promise<string[]> {
    const agora = this.deps.agora()
    const dormiram: string[] = []
    const abertos = this.deps.agentesAbertos()
    for (const id of this.quieto.keys()) if (!abertos.some((a) => a.id === id)) this.quieto.delete(id)
    for (const { id, ligado } of abertos) {
      const aviso = this.deps.aviso(id)
      const visto = this.quieto.get(id)
      if (!visto || visto.aviso !== aviso) {
        this.quieto.set(id, { desde: agora, aviso })
        continue
      }
      const candidato = { estado: aviso?.estado ?? null, ligado, ocupado: this.deps.ocupado(id), quietoMs: agora - visto.desde }
      if (!podeDormir(candidato, this.limite) || !(await this.deps.temClaude(id))) continue
      this.quieto.delete(id)
      this.deps.adormecer(id)
      dormiram.push(id)
    }
    return dormiram
  }
}
