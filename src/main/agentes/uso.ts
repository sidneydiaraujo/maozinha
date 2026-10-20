// Uso de cada conta (T20.1, D24): a linha de status de qualquer agente conta os limites da conta
// dele (5 h e semana). Cada conta fica com o painel mais novo. So em memoria: ao abrir o app, nada
// ate um agente daquela conta falar.
import type { PainelAgente, PerfilId, UsoConta } from '../../shared/model'
import { usoVigente } from '../../shared/uso'

/** O mais novo vence; painel sem limites (ou com um so) mantem o que ja havia. */
export function juntarUso(atual: UsoConta | undefined, novo: PainelAgente, perfilId: PerfilId): UsoConta {
  if (atual && (atual.quando > novo.quando || !novo.limites)) return atual
  const antes = { cincoHoras: atual?.cincoHoras ?? null, semana: atual?.semana ?? null }
  const { cincoHoras, semana } = novo.limites ?? antes
  return {
    perfilId,
    cincoHoras: cincoHoras ?? antes.cincoHoras,
    semana: semana ?? antes.semana,
    quando: novo.quando,
  }
}

export class UsoDasContas {
  private readonly usos = new Map<PerfilId, UsoConta>()

  /** Devolve o uso novo da conta, ou null se nada mudou (nao precisa avisar a tela). */
  aoPainel(perfilId: PerfilId, painel: PainelAgente): UsoConta | null {
    const atual = this.usos.get(perfilId)
    const novo = juntarUso(atual, painel, perfilId)
    if (novo === atual) return null
    this.usos.set(perfilId, novo)
    return novo
  }

  todos(agora: number): UsoConta[] {
    return [...this.usos.values()].map((uso) => usoVigente(uso, agora))
  }
}
