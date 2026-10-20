import { afterEach, describe, expect, it, vi } from 'vitest'
import { fontePadrao, lerFonte, proximaFonte } from './fonte'
import { APARENCIA_PADRAO } from './tema'

describe('proximaFonte', () => {
  it('um ponto por passo da roda, entre 9 e 24', () => {
    expect(proximaFonte(13, -100)).toBe(14)
    expect(proximaFonte(13, 100)).toBe(12)
    expect(proximaFonte(24, -1)).toBe(24)
    expect(proximaFonte(9, 1)).toBe(9)
    expect(proximaFonte(13, 0)).toBe(13)
  })
})

describe('lerFonte', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sem localStorage (teste) volta ao padrao da Aparencia', () => {
    expect(fontePadrao()).toBe(APARENCIA_PADRAO.tamanho)
    expect(lerFonte('quadro:q1')).toBe(APARENCIA_PADRAO.tamanho)
  })

  it('quadro com tamanho guardado ignora a Aparencia; o outro segue ela', () => {
    const salvo: Record<string, string> = {
      'lousa.fontes': JSON.stringify({ 'quadro:q1': 18 }),
      'lousa.aparencia': JSON.stringify({ ...APARENCIA_PADRAO, tamanho: 16 }),
    }
    vi.stubGlobal('localStorage', { getItem: (k: string) => salvo[k] ?? null })
    expect(lerFonte('quadro:q1')).toBe(18)
    expect(lerFonte('quadro:q2')).toBe(16)
  })
})
