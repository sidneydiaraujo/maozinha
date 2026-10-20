import { describe, expect, it } from 'vitest'
import { podeCompactar } from './compactar'

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
