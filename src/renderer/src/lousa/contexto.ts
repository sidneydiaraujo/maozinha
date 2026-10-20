// Anel de contexto no cabecalho do agente (T18.1, D24): quanto da conversa ja foi usado, com as
// escolhas do Sidney na engrenagem (T18.2). Preferencia do PC, como a Aparencia (localStorage).

export type QuandoMostrar = 'sempre' | 'apartir' | 'nunca'

export interface PrefContexto {
  mostrar: QuandoMostrar
  /** Com 'apartir': o anel so aparece com o usado >= isto (%). */
  aPartirDe: number
  /** true = o numero do meio e o que sobra (100 - usado), nao o usado. */
  mostrarRestante: boolean
  /** Ambar a partir disto (% usado). */
  alerta: number
  /** Vermelho a partir disto (% usado). */
  perigo: number
}

export const PREF_CONTEXTO_PADRAO: PrefContexto = {
  mostrar: 'apartir',
  aPartirDe: 50,
  mostrarRestante: false,
  alerta: 70,
  perigo: 90,
}

export type NivelContexto = 'ok' | 'alerta' | 'perigo'

export type VistaContexto = { visivel: false } | { visivel: true; numero: number; texto: string; nivel: NivelContexto }

/** 124000 -> "124 mil"; 1000000 -> "1 milhão"; 1500000 -> "1,5 milhão". */
export function tokensPorExtenso(n: number): string {
  if (n >= 1_000_000) {
    const milhoes = Math.round(n / 100_000) / 10
    return `${String(milhoes).replace('.', ',')} ${milhoes < 2 ? 'milhão' : 'milhões'}`
  }
  if (n >= 1000) return `${Math.round(n / 1000)} mil`
  return String(Math.round(n))
}

/**
 * O que o anel mostra. `usado` em % (0-100); null = sem dado ainda (agente recem-aberto, antes
 * da 1a mensagem): nao aparece. O numero e inteiro, para a tela so mudar a cada ponto (D17).
 */
export function vistaDoContexto(usado: number | null, pref: PrefContexto, tamanho?: number): VistaContexto {
  if (usado === null || pref.mostrar === 'nunca') return { visivel: false }
  const pct = Math.round(Math.min(100, Math.max(0, usado)))
  if (pref.mostrar === 'apartir' && pct < pref.aPartirDe) return { visivel: false }
  const nivel: NivelContexto = pct >= pref.perigo ? 'perigo' : pct >= pref.alerta ? 'alerta' : 'ok'
  const numero = pref.mostrarRestante ? 100 - pct : pct
  const parte = pref.mostrarRestante ? 'livre' : 'usado'
  const tokens = tamanho
    ? ` (${tokensPorExtenso(((pref.mostrarRestante ? 100 - pct : pct) / 100) * tamanho)} de ${tokensPorExtenso(tamanho)})`
    : ''
  return { visivel: true, numero, nivel, texto: `${numero}% do contexto ${parte}${tokens}` }
}

const CHAVE = 'lousa.contexto'

const inteiro = (v: unknown, padrao: number): number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= 100 ? v : padrao

/** Valor ruim volta ao padrao so no proprio campo (como a Aparencia). */
export function prefContextoDe(texto: string | null): PrefContexto {
  let salvo: Record<string, unknown>
  try {
    const lido: unknown = JSON.parse(texto ?? '{}')
    salvo = lido && typeof lido === 'object' ? (lido as Record<string, unknown>) : {}
  } catch {
    salvo = {}
  }
  const p = PREF_CONTEXTO_PADRAO
  const mostrar = ['sempre', 'apartir', 'nunca'].includes(salvo.mostrar as string) ? (salvo.mostrar as QuandoMostrar) : p.mostrar
  const alerta = inteiro(salvo.alerta, p.alerta)
  const perigo = inteiro(salvo.perigo, p.perigo)
  return {
    mostrar,
    aPartirDe: inteiro(salvo.aPartirDe, p.aPartirDe),
    mostrarRestante: typeof salvo.mostrarRestante === 'boolean' ? salvo.mostrarRestante : p.mostrarRestante,
    // vermelho antes do ambar nao faz sentido: volta os dois ao padrao
    ...(alerta < perigo ? { alerta, perigo } : { alerta: p.alerta, perigo: p.perigo }),
  }
}

export function lerPrefContexto(): PrefContexto {
  try {
    return prefContextoDe(localStorage.getItem(CHAVE))
  } catch {
    return PREF_CONTEXTO_PADRAO
  }
}

const ouvintes = new Set<(p: PrefContexto) => void>()

/** Os aneis abertos escutam aqui: a escolha na engrenagem vale na hora para todos. */
export function aoMudarPrefContexto(fn: (p: PrefContexto) => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function guardarPrefContexto(p: PrefContexto): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    // sem localStorage: vale so ate fechar
  }
  for (const fn of ouvintes) fn(p)
}
