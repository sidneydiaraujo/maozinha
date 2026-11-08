// Escrever uma mensagem num quadro como se fosse digitada (T13.1, D21): texto, pausa, Enter.
// a pausa antes do Enter e item do contrato com o Claude (R4.21)
import { PAUSA_ENTER_MS } from '../../../shared/contratoClaude'
import { montarEnvio } from './envio'

const esperar = (ms: number): Promise<void> => new Promise((r) => window.setTimeout(r, ms))

/** false = nada para enviar (texto vazio). Lanca se o quadro nao tem terminal aberto. */
export async function enviarMensagem(quadroId: string, texto: string): Promise<boolean> {
  const pedacos = montarEnvio(texto)
  if (!pedacos) return false
  await window.lousa.terminais.escrever(quadroId, pedacos[0])
  await esperar(PAUSA_ENTER_MS)
  await window.lousa.terminais.escrever(quadroId, pedacos[1])
  return true
}
