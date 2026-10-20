// Compactar a conversa do agente (T18.1, D24). A tela usa para acinzentar o botao; o main usa
// para recusar, porque quem escreve no terminal e ele. Puro.
import type { EstadoAgente } from './model'

/** O Claude so recebe /compact parado (OSC 7501 idle ou done); trabalhando ou esperando, nao. */
export function podeCompactar(estado: EstadoAgente | undefined): boolean {
  return estado === 'parado' || estado === 'terminou'
}
