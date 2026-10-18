/** Mensagem que o main lancou, sem o "Error invoking remote method 'canal': Error:" do Electron. */
export function mensagemDe(e: unknown): string {
  const texto = e instanceof Error ? e.message : String(e)
  return texto.replace(/^Error invoking remote method '[^']*': (?:\w*Error: )?/, '')
}
