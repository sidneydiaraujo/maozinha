// Mesma mensagem para varios quadros (T13.1, D21): como o texto vira teclas no terminal. Puro.

const COLAR_INICIO = '\x1b[200~'
const COLAR_FIM = '\x1b[201~'

/**
 * Pedacos a escrever, nesta ordem, com uma pausa entre eles: o texto e depois o Enter. Separado
 * porque o Claude Code trata texto+Enter que chegam juntos como colagem (o Enter vira quebra de
 * linha e a mensagem nao vai). Texto com varias linhas vai como colagem (bracketed paste), para
 * cada linha nao ser enviada sozinha. null = nada para enviar.
 */
export function montarEnvio(texto: string): [string, string] | null {
  const limpo = texto.replace(/\r\n?/g, '\n').replace(/\n+$/, '')
  if (limpo.trim() === '') return null
  const corpo = limpo.includes('\n') ? `${COLAR_INICIO}${limpo}${COLAR_FIM}` : limpo
  return [corpo, '\r']
}

/** "Enviar para 3 quadros" / "Enviado para 1 quadro". */
export function quadrosPorExtenso(n: number): string {
  return n === 1 ? '1 quadro' : `${n} quadros`
}
