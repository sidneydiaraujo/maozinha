// Unico lugar do app com console direto (regra quality/no-direct-console).
// Nunca registre token, e-mail completo de terceiros ou conteudo de terminal.
// Com o app instalado tambem grava num arquivo por dia (T8.6, registros.ts), com e-mails mascarados.

type Nivel = 'info' | 'warn' | 'error'

/** Recebe a linha pronta (ja com "\n"); null = so console. */
type Destino = (linha: string) => void

let destino: Destino | null = null
const MAIOR_LINHA = 8000

export function gravarEm(novo: Destino | null): void {
  destino = novo
}

const EMAIL = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g

/** e-mail vira ***@dominio: o arquivo pode ser mostrado a alguem sem expor a conta. */
export function mascarar(texto: string): string {
  return texto.replace(EMAIL, '***@$1')
}

/** Erro com pilha, texto como esta, o resto em JSON. */
export function descrever(extra: unknown): string {
  if (extra instanceof Error) return `${extra.name}: ${extra.message}${extra.stack ? `\n${extra.stack}` : ''}`
  if (typeof extra === 'string') return extra
  try {
    return JSON.stringify(extra) ?? String(extra)
  } catch {
    return String(extra)
  }
}

export function log(nivel: Nivel, mensagem: string, extra?: unknown): void {
  const linha = `[${new Date().toISOString()}] ${nivel.toUpperCase()} ${mensagem}`
  const escrever = nivel === 'error' ? console.error : nivel === 'warn' ? console.warn : console.log
  if (extra === undefined) escrever(linha)
  else escrever(linha, extra)
  if (!destino) return
  const completa = extra === undefined ? linha : `${linha} ${descrever(extra)}`
  try {
    destino(`${mascarar(completa).slice(0, MAIOR_LINHA)}\n`)
  } catch {
    // disco cheio ou arquivo preso: segue so no console
  }
}
