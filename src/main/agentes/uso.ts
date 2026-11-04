// Uso de cada conta (T20.1, D24): a linha de status de qualquer agente conta os limites da conta
// dele (5 h e semana). So em memoria: ao abrir o app, nada ate um agente daquela conta falar.
// A29: o `quando` do painel e a hora em que a Lousa leu o arquivo, nao a hora do dado. Um agente
// parado que redesenha a linha de status (quadro redimensionado, por exemplo) grava de novo os
// numeros velhos que tem na memoria; antes eles venciam e a barra voltava para tras. Dentro do
// mesmo periodo (mesma hora de zerar) o uso so sobe; periodo mais antigo e ignorado.
import type { Limite, PainelAgente, PerfilId, UsoConta } from '../../shared/model'
import { usoVigente } from '../../shared/uso'

/** O Claude manda a hora de zerar redonda; mais que isso de diferenca e outro periodo. */
export const MESMO_PERIODO_MS = 5 * 60_000

/** O limite novo traz informacao que o atual nao tem? (null no novo = nao disse nada) */
function maisNovo(atual: Limite | null, novo: Limite | null): boolean {
  if (!novo || !atual) return novo !== null
  if (novo.zeraEm === null || atual.zeraEm === null) return true // sem periodo: vale a ordem de chegada
  if (novo.zeraEm > atual.zeraEm + MESMO_PERIODO_MS) return true // periodo novo
  if (novo.zeraEm < atual.zeraEm - MESMO_PERIODO_MS) return false // periodo velho: dado parado
  return novo.usado >= atual.usado
}

/** Um limite: fica com o mais novo; no mesmo periodo, com o maior uso. */
function juntarLimite(atual: Limite | null, novo: Limite | null): Limite | null {
  return maisNovo(atual, novo) ? novo : atual
}

/**
 * O mais novo vence; painel sem limites (ou com um so) mantem o que ja havia. Dado velho (uso
 * menor no mesmo periodo, ou periodo anterior) nao apaga o atual nem renova o "visto".
 */
export function juntarUso(atual: UsoConta | undefined, novo: PainelAgente, perfilId: PerfilId): UsoConta {
  const limites = novo.limites
  if (!atual) return { perfilId, cincoHoras: limites?.cincoHoras ?? null, semana: limites?.semana ?? null, quando: novo.quando }
  if (atual.quando > novo.quando || !limites) return atual
  const junto: UsoConta = {
    perfilId,
    cincoHoras: juntarLimite(atual.cincoHoras, limites.cincoHoras),
    semana: juntarLimite(atual.semana, limites.semana),
    quando: atual.quando,
  }
  // tudo o que veio e novo: o "visto" anda; algo velho: so entra o que for novo, sem renovar o "visto"
  if (tudoNovo(atual, limites)) return { ...junto, quando: novo.quando }
  return igual(atual, junto) ? atual : junto
}

function tudoNovo(atual: UsoConta, limites: NonNullable<PainelAgente['limites']>): boolean {
  const pares = [
    [atual.cincoHoras, limites.cincoHoras],
    [atual.semana, limites.semana],
  ] as const
  const presentes = pares.filter(([, n]) => n !== null)
  return presentes.length > 0 && presentes.every(([a, n]) => maisNovo(a, n))
}

const mesmoLimite = (a: Limite | null, b: Limite | null): boolean =>
  a === b || (a !== null && b !== null && a.usado === b.usado && a.zeraEm === b.zeraEm)

function igual(a: UsoConta, b: UsoConta): boolean {
  return a.quando === b.quando && mesmoLimite(a.cincoHoras, b.cincoHoras) && mesmoLimite(a.semana, b.semana)
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
