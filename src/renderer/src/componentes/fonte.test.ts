import { describe, expect, it } from 'vitest'
import { FONTE_PADRAO, lerFonte, proximaFonte } from './fonte'

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
  it('sem localStorage (teste) volta ao padrao', () => {
    expect(lerFonte('quadro:q1')).toBe(FONTE_PADRAO)
  })
})
