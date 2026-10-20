import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('./log', () => ({ log: vi.fn() }))
const { desenhoDasOpcoes, lerCenario, nomeDaFoto, pastaDoSmoke } = await import('./cenario')

describe('pastaDoSmoke', () => {
  it('npm run smoke nunca usa a pasta de dados de verdade', () => {
    expect(pastaDoSmoke(['electron', '.', '--smoke'], 'C:\\Temp')).toBe(join('C:\\Temp', 'lousa-ia-smoke'))
  })

  it('a rodada de prova ja traz a dela', () => {
    expect(pastaDoSmoke(['electron', '.', '--smoke', '--user-data-dir=C:\\p\\dados'], 'C:\\Temp')).toBeNull()
  })
})

describe('desenhoDasOpcoes', () => {
  it('a rodada usa o desenho normal, salvo a opcao webgl', () => {
    expect(desenhoDasOpcoes({ opcoes: [] })).toBe('dom')
    expect(desenhoDasOpcoes({ opcoes: ['acumular'] })).toBe('dom')
    expect(desenhoDasOpcoes({ opcoes: ['webgl'] })).toBe('webgl')
    expect(desenhoDasOpcoes({})).toBe('dom')
    expect(desenhoDasOpcoes(null)).toBe('dom')
    expect(desenhoDasOpcoes({ opcoes: 'webgl' })).toBe('dom')
  })
})

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
