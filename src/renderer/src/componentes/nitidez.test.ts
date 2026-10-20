import { describe, expect, it } from 'vitest'
import { ajusteSubpixel, fonteNaTela, zoomACompensar } from './nitidez'

describe('zoomACompensar', () => {
  it('a 100% nao mexe', () => {
    expect(zoomACompensar(1, 14)).toBeNull()
    expect(zoomACompensar(1.002, 14)).toBeNull()
  })

  it('afastado ou ampliado: desfaz o zoom da lousa', () => {
    expect(zoomACompensar(0.85, 14)).toBe(0.85)
    expect(zoomACompensar(1.6, 14)).toBe(1.6)
  })

  it('letra miuda demais para ler: fica a imagem encolhida', () => {
    expect(zoomACompensar(0.3, 14)).toBeNull()
  })

  it('zoom invalido: nao mexe', () => {
    expect(zoomACompensar(0, 14)).toBeNull()
    expect(zoomACompensar(Number.NaN, 14)).toBeNull()
  })
})

describe('fonteNaTela', () => {
  it('multiplica pelo zoom e arredonda em meio pixel', () => {
    expect(fonteNaTela(14, 0.85)).toBe(12)
    expect(fonteNaTela(13, 1.5)).toBe(19.5)
    expect(fonteNaTela(14, 0.93)).toBe(13)
  })
})

describe('ajusteSubpixel', () => {
  it('leva a posicao ao pixel inteiro do monitor', () => {
    expect(ajusteSubpixel(100.3, 1)).toBeCloseTo(-0.3)
    expect(ajusteSubpixel(100.7, 1)).toBeCloseTo(0.3)
  })

  it('com escala do Windows em 150%, o pixel do monitor e 2/3 de px', () => {
    expect(ajusteSubpixel(100.5, 1.5)).toBeCloseTo(100.6667 - 100.5, 3)
  })
})
