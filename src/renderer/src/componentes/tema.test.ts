import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  APARENCIA_PADRAO,
  aoMudarAparencia,
  aparenciaDe,
  familiaDaFonte,
  guardarAparencia,
  lerAparencia,
  PALETAS,
  temaDoXterm,
} from './tema'

const ANSI = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite',
] as const

describe('temaDoXterm', () => {
  it.each(PALETAS)('%s tem fundo, texto, cursor, selecao e as 16 cores ANSI', (paleta) => {
    const tema = temaDoXterm(paleta)
    for (const cor of [...ANSI, 'background', 'foreground', 'cursor', 'selectionBackground'] as const) {
      expect(tema[cor], cor).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('abyss usa o fundo do VSCode; lousa tem fundo proprio', () => {
    expect(temaDoXterm('abyss').background).toBe('#000c18')
    expect(temaDoXterm('lousa').background).not.toBe('#000c18')
  })
})

describe('familiaDaFonte', () => {
  it('sempre termina em Consolas e monospace', () => {
    expect(familiaDaFonte('Cascadia Code')).toBe("'Cascadia Code', Consolas, monospace")
    expect(familiaDaFonte('Consolas')).toBe('Consolas, monospace')
  })
})

describe('aparenciaDe', () => {
  it('nada guardado ou JSON estragado volta ao padrao', () => {
    expect(aparenciaDe(null)).toEqual(APARENCIA_PADRAO)
    expect(aparenciaDe('{nao e json')).toEqual(APARENCIA_PADRAO)
    expect(aparenciaDe('42')).toEqual(APARENCIA_PADRAO)
  })

  it('valor ruim volta ao padrao so naquele campo', () => {
    const lido = aparenciaDe(JSON.stringify({ fonte: 'Comic Sans', tamanho: 30, entrelinha: 1.4, paleta: 'abyss' }))
    expect(lido).toEqual({ fonte: 'Cascadia Code', tamanho: 14, entrelinha: 1.4, paleta: 'abyss' })
    expect(aparenciaDe(JSON.stringify({ tamanho: 8 })).tamanho).toBe(14)
    expect(aparenciaDe(JSON.stringify({ tamanho: '16', paleta: 'roxa' }))).toEqual(APARENCIA_PADRAO)
  })

  it('valor bom passa inteiro', () => {
    const a = { fonte: 'Consolas', tamanho: 9, entrelinha: 1, paleta: 'abyss' } as const
    expect(aparenciaDe(JSON.stringify(a))).toEqual(a)
  })
})

describe('lerAparencia e guardarAparencia', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem localStorage (teste) le o padrao e guardar ainda avisa os terminais', () => {
    expect(lerAparencia()).toEqual(APARENCIA_PADRAO)
    const recebido = vi.fn()
    const parar = aoMudarAparencia(recebido)
    const nova = { ...APARENCIA_PADRAO, paleta: 'abyss' } as const
    guardarAparencia(nova)
    parar()
    guardarAparencia(APARENCIA_PADRAO)
    expect(recebido).toHaveBeenCalledTimes(1)
    expect(recebido).toHaveBeenCalledWith(nova)
  })

  it('guarda e le de volta pela chave lousa.aparencia', () => {
    const salvo = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => salvo.get(k) ?? null,
      setItem: (k: string, v: string) => salvo.set(k, v),
    })
    const nova = { fonte: 'Cascadia Mono', tamanho: 16, entrelinha: 1.3, paleta: 'abyss' } as const
    guardarAparencia(nova)
    expect(salvo.has('lousa.aparencia')).toBe(true)
    expect(lerAparencia()).toEqual(nova)
  })
})
