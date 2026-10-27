import { describe, expect, it } from 'vitest'
import { podeCompactar, podeDigitar } from './compactar'

describe('podeCompactar', () => {
  it('so parado ou terminou', () => {
    expect(podeCompactar('parado')).toBe(true)
    expect(podeCompactar('terminou')).toBe(true)
    expect(podeCompactar('trabalhando')).toBe(false)
    expect(podeCompactar('esperando')).toBe(false)
    expect(podeCompactar('erro')).toBe(false)
    expect(podeCompactar(undefined)).toBe(false)
  })
})

describe('podeDigitar (D48)', () => {
  it('parado ou terminou, com ou sem linha de status', () => {
    expect(podeDigitar('parado', false)).toBe(true)
    expect(podeDigitar('terminou', false)).toBe(true)
  })

  it('sem estado: so com a linha de status (o Claude pronto, fora da pergunta de confianca)', () => {
    expect(podeDigitar(undefined, true)).toBe(true)
    expect(podeDigitar(undefined, false)).toBe(false)
  })

  it('trabalhando, esperando ou erro: nunca, nem com a linha de status', () => {
    for (const e of ['trabalhando', 'esperando', 'erro'] as const) expect(podeDigitar(e, true)).toBe(false)
  })
})
