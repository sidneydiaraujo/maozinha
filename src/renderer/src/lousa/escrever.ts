// Escrever uma mensagem num quadro como se fosse digitada (T13.1, D21): texto, pausa, Enter, pelo
// modulo unico de digitar no agente (shared/digitar.ts, R4.22).
import { digitarMensagem } from '../../../shared/digitar'

const esperar = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms))

/** false = nada para enviar (texto vazio). Lanca se o quadro nao tem terminal aberto. */
export function enviarMensagem(quadroId: string, texto: string): Promise<boolean> {
  return digitarMensagem({ escrever: (dados) => window.lousa.terminais.escrever(quadroId, dados), esperar }, texto)
}
