// Escrever uma mensagem num quadro como se fosse digitada (T13.1, D21): texto, pausa, Enter.
import { montarEnvio } from './envio'

/** Pausa entre o texto e o Enter (ver montarEnvio). */
const PAUSA_ENTER_MS = 150

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
