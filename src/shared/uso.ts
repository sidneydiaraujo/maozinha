// Uso da conta com o relogio (T20.1): limite cuja hora de zerar ja passou vale 0%, mesmo sem um
// agente aberto para contar. Main e tela usam a mesma regra.
import type { Limite, UsoConta } from './model'

export function limiteVigente(limite: Limite | null, agora: number): Limite | null {
  if (!limite) return null
  return limite.zeraEm !== null && limite.zeraEm <= agora ? { usado: 0, zeraEm: null } : limite
}

export function usoVigente(uso: UsoConta, agora: number): UsoConta {
  return { ...uso, cincoHoras: limiteVigente(uso.cincoHoras, agora), semana: limiteVigente(uso.semana, agora) }
}
