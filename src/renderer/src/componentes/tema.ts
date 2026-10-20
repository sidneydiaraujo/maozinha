// Aparencia do terminal (T15.1): fonte, tamanho, entrelinha e paleta, iguais para todos os
// quadros deste PC (localStorage, como a letra; preferencia do PC, nao da conta).
import type { ITheme } from '@xterm/xterm'

export type NomeFonte = 'Cascadia Code' | 'Cascadia Mono' | 'Consolas'
export type NomePaleta = 'lousa' | 'abyss'
export interface Aparencia {
  fonte: NomeFonte
  tamanho: number
  entrelinha: number
  paleta: NomePaleta
}

export const FONTES: readonly NomeFonte[] = ['Cascadia Code', 'Cascadia Mono', 'Consolas']
export const PALETAS: readonly NomePaleta[] = ['lousa', 'abyss']
export const TAMANHO_MENOR = 9
export const TAMANHO_MAIOR = 24
export const ENTRELINHA_MENOR = 1
export const ENTRELINHA_MAIOR = 1.6

export const APARENCIA_PADRAO: Aparencia = {
  fonte: 'Cascadia Code',
  tamanho: 14,
  entrelinha: 1.2,
  paleta: 'lousa',
}

const CHAVE = 'lousa.aparencia'

// As 16 cores ANSI do tema Abyss do VSCode (abyss-color-theme.json, "terminal.ansi*").
const ANSI_ABYSS = {
  black: '#111111',
  red: '#ff9da4',
  green: '#d1f1a9',
  yellow: '#ffeead',
  blue: '#bbdaff',
  magenta: '#ebbbff',
  cyan: '#99ffff',
  white: '#cccccc',
  brightBlack: '#333333',
  brightRed: '#ff7882',
  brightGreen: '#b8f171',
  brightYellow: '#ffe580',
  brightBlue: '#80baff',
  brightMagenta: '#d778ff',
  brightCyan: '#78ffff',
  brightWhite: '#ffffff',
} satisfies ITheme

const TEMAS: Record<NomePaleta, ITheme> = {
  // Abyss puro: fundo do editor, texto padrao do terminal escuro, cursor e selecao do editor.
  abyss: {
    ...ANSI_ABYSS,
    background: '#000c18',
    foreground: '#cccccc',
    cursor: '#ddbb88',
    cursorAccent: '#000c18',
    selectionBackground: '#770811',
  },
  // Lousa: o mesmo desenho em ardosia e giz. O cinza do Abyss (#333333) some no fundo ardosia.
  lousa: {
    ...ANSI_ABYSS,
    black: '#0b1118',
    brightBlack: '#5d6b7d',
    background: '#131c27',
    foreground: '#dcd8cc',
    cursor: '#e8c07a',
    cursorAccent: '#131c27',
    selectionBackground: '#2c4260',
  },
}

/** Fundo, texto, cursor, selecao e as 16 cores ANSI da paleta. */
export function temaDoXterm(paleta: NomePaleta): ITheme {
  return TEMAS[paleta]
}

/** A Cascadia pode nao estar instalada: a lista sempre termina em Consolas e monospace. */
export function familiaDaFonte(fonte: NomeFonte): string {
  return fonte === 'Consolas' ? 'Consolas, monospace' : `'${fonte}', Consolas, monospace`
}

const umDe = <T>(lista: readonly T[], valor: unknown, padrao: T): T =>
  lista.includes(valor as T) ? (valor as T) : padrao

const entre = (valor: unknown, menor: number, maior: number, padrao: number): number =>
  typeof valor === 'number' && valor >= menor && valor <= maior ? valor : padrao

/** Cada campo ruim volta ao padrao sozinho; JSON estragado volta tudo. */
export function aparenciaDe(texto: string | null): Aparencia {
  let salvo: Record<string, unknown>
  try {
    const lido: unknown = JSON.parse(texto ?? '{}')
    salvo = lido && typeof lido === 'object' ? (lido as Record<string, unknown>) : {}
  } catch {
    return APARENCIA_PADRAO
  }
  const p = APARENCIA_PADRAO
  return {
    fonte: umDe(FONTES, salvo.fonte, p.fonte),
    tamanho: entre(salvo.tamanho, TAMANHO_MENOR, TAMANHO_MAIOR, p.tamanho),
    entrelinha: entre(salvo.entrelinha, ENTRELINHA_MENOR, ENTRELINHA_MAIOR, p.entrelinha),
    paleta: umDe(PALETAS, salvo.paleta, p.paleta),
  }
}

export function lerAparencia(): Aparencia {
  try {
    return aparenciaDe(localStorage.getItem(CHAVE))
  } catch {
    return APARENCIA_PADRAO
  }
}

const ouvintes = new Set<(a: Aparencia) => void>()

/** Os terminais abertos escutam aqui para mudar na hora, sem reabrir. */
export function aoMudarAparencia(fn: (a: Aparencia) => void): () => void {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}

export function guardarAparencia(a: Aparencia): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(a))
  } catch {
    // sem localStorage (janela privada, teste): vale so ate fechar
  }
  for (const fn of ouvintes) fn(a)
}
