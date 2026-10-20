import { describe, expect, it, vi } from 'vitest'

vi.mock('./log', () => ({ log: vi.fn() }))
const { lerCenario, nomeDaFoto } = await import('./cenario')

describe('lerCenario', () => {
  const argv = ['electron', '.', '--smoke', '--cenario=C:\\p\\vivo.js', '--saida=C:\\p\\saida\\vivo-1']

  it('le o roteiro e a pasta de saida', () => {
    expect(lerCenario(argv, false)).toEqual({ arquivo: 'C:\\p\\vivo.js', saida: 'C:\\p\\saida\\vivo-1' })
  })

  it('no instalador nunca roda cenario', () => {
    expect(lerCenario(argv, true)).toBeNull()
  })

  it('sem os dois argumentos (ou com valor vazio) e o smoke de sempre', () => {
    expect(lerCenario(['electron', '.', '--smoke'], false)).toBeNull()
    expect(lerCenario(['--cenario=C:\\p\\vivo.js'], false)).toBeNull()
    expect(lerCenario(['--cenario=', '--saida=C:\\x'], false)).toBeNull()
  })
})

describe('nomeDaFoto', () => {
  it('vira nome de arquivo sem caminho', () => {
    expect(nomeDaFoto('leitor')).toBe('leitor.png')
    expect(nomeDaFoto('..\\..\\x/y')).toBe('-x-y.png')
    expect(nomeDaFoto(undefined)).toBe('foto.png')
  })
})
