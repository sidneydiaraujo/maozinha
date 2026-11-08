// Digitar no agente como uma pessoa (R4.22): o unico lugar que sabe como texto vira teclas no
// terminal do Claude. A tela (mensagem para varios quadros, pedido de resolver conflito) e o main
// (mensagens do time, /compact) usam estas funcoes; antes eram tres copias. Puro: quem chama da
// o `escrever` (IPC na tela, node-pty no main) e o `esperar`.
import { PAUSA_ENTER_MS } from './contratoClaude'

const COLAR_INICIO = '\x1b[200~'
const COLAR_FIM = '\x1b[201~'

export interface Teclado {
  escrever(dados: string): unknown
  esperar(ms: number): Promise<void>
}

/**
 * Pedacos a escrever, nesta ordem, com uma pausa entre eles: o texto e depois o Enter. Separado
 * porque o Claude Code trata texto+Enter que chegam juntos como colagem (o Enter vira quebra de
 * linha e a mensagem nao vai, D21). Texto com varias linhas vai como colagem (bracketed paste),
 * para cada linha nao ser enviada sozinha. null = nada para enviar.
 */
export function montarEnvio(texto: string): [string, string] | null {
  const limpo = texto.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (limpo.trim() === '') return null
  const corpo = limpo.includes('\n') ? `${COLAR_INICIO}${limpo}${COLAR_FIM}` : limpo
  return [corpo, '\r']
}

/** A pausa do contrato e o Enter: o texto ja esta na caixa do agente. */
export async function apertarEnter(t: Teclado): Promise<void> {
  await t.esperar(PAUSA_ENTER_MS)
  await t.escrever('\r')
}

/** Texto, pausa, Enter. false = nada para enviar (texto vazio). */
export async function digitarMensagem(t: Teclado, texto: string): Promise<boolean> {
  const pedacos = montarEnvio(texto)
  if (!pedacos) return false
  await t.escrever(pedacos[0])
  await apertarEnter(t)
  return true
}
