// Textos e cores das barras de uso da conta (T20.2): "Sessão 42% · zera em 2h10".
import type { Limite, UsoConta } from '../../../shared/model'
import { usoVigente } from '../../../shared/uso'

const MINUTO = 60_000
const HORA = 60 * MINUTO
/** Dado com mais de 1 h fica em cinza: a conta pode ter gastado mais em outro lugar. */
export const VELHO_MS = HORA
/** Os mesmos limiares do anel de contexto (T18.1). */
export const ALERTA = 70
export const PERIGO = 90
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

export type NivelUso = 'normal' | 'alerta' | 'perigo'

export function nivelDoUso(usado: number): NivelUso {
  if (usado >= PERIGO) return 'perigo'
  return usado >= ALERTA ? 'alerta' : 'normal'
}

const doisDigitos = (n: number): string => String(n).padStart(2, '0')

/** "zera em 35 min", "zera em 2h10" (menos de um dia) ou "zera sex 09:00". */
export function textoZera(zeraEm: number, agora: number): string {
  const falta = Math.max(0, zeraEm - agora)
  const minutos = Math.ceil(falta / MINUTO)
  if (minutos < 60) return `zera em ${minutos} min`
  if (falta < 24 * HORA) return `zera em ${Math.floor(minutos / 60)}h${doisDigitos(minutos % 60)}`
  const d = new Date(zeraEm)
  return `zera ${DIAS[d.getDay()]} ${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`
}

/** "visto agora", "visto há 12 min", "visto há 2 h". */
export function textoVisto(quando: number, agora: number): string {
  const minutos = Math.floor(Math.max(0, agora - quando) / MINUTO)
  if (minutos < 1) return 'visto agora'
  return minutos < 60 ? `visto há ${minutos} min` : `visto há ${Math.floor(minutos / 60)} h`
}

function linha(nome: string, limite: Limite | null, agora: number): string | null {
  if (!limite) return null
  const zera = limite.zeraEm === null ? '' : ` · ${textoZera(limite.zeraEm, agora)}`
  return `${nome} ${limite.usado}%${zera}`
}

export interface VistaUso {
  barras: Array<{ nome: string; usado: number; nivel: NivelUso }>
  linhas: string[]
  visto: string
  velho: boolean
}

/** null = sem dado ainda (nenhum agente da conta falou) ou conta sem plano (sem limites). */
export function vistaDoUso(bruto: UsoConta | undefined, agora: number): VistaUso | null {
  if (!bruto) return null
  const uso = usoVigente(bruto, agora)
  const pares = [
    ['Sessão', uso.cincoHoras],
    ['Semana', uso.semana],
  ] as const
  const barras = pares.flatMap(([nome, l]) => (l ? [{ nome, usado: l.usado, nivel: nivelDoUso(l.usado) }] : []))
  if (barras.length === 0) return null
  return {
    barras,
    linhas: pares.map(([nome, l]) => linha(nome, l, agora)).filter((x): x is string => x !== null),
    visto: textoVisto(uso.quando, agora),
    velho: agora - uso.quando > VELHO_MS,
  }
}
