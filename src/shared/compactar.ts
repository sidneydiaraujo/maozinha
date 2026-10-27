// Compactar a conversa do agente (T18.1, D24). A tela usa para acinzentar o botao; o main usa
// para recusar, porque quem escreve no terminal e ele. Puro.
import type { EstadoAgente } from './model'

/** O Claude so recebe /compact parado (OSC 7501 idle ou done); trabalhando ou esperando, nao. */
export function podeCompactar(estado: EstadoAgente | undefined): boolean {
  return estado === 'parado' || estado === 'terminou'
}

/**
 * A Lousa pode digitar no agente (D47)? Parado ou terminou; ou ainda sem estado nenhum mas
 * `pronto`: o Claude so manda estado depois do primeiro trabalho, e a linha de status so roda
 * com ele pronto para receber (nunca na pergunta de confianca da pasta). Quem chama confere
 * tambem se o claude.exe ainda roda: ele nao avisa quando sai (D39).
 */
export function podeDigitar(estado: EstadoAgente | undefined, pronto: boolean): boolean {
  return podeCompactar(estado) || (estado === undefined && pronto)
}
