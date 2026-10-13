// Unico lugar do app com console direto (regra quality/no-direct-console).
// Nunca registre token, e-mail completo de terceiros ou conteudo de terminal.

type Nivel = 'info' | 'warn' | 'error'

export function log(nivel: Nivel, mensagem: string, extra?: unknown): void {
  const linha = `[${new Date().toISOString()}] ${nivel.toUpperCase()} ${mensagem}`
  const escrever = nivel === 'error' ? console.error : nivel === 'warn' ? console.warn : console.log
  if (extra === undefined) escrever(linha)
  else escrever(linha, extra)
}
