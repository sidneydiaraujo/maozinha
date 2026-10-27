import { describe, expect, it } from 'vitest'
import { ajusteSubpixel, desenhoNoZoom, fonteNaTela } from './nitidez'

describe('desenhoNoZoom (D46)', () => {
  it('a 100% fica o desenho normal, com ou sem foco', () => {
    expect(desenhoNoZoom(1, 14, false)).toBe('imagem')
    expect(desenhoNoZoom(1.002, 14, true)).toBe('imagem')
  })

  it('letra legivel: redesenha nitido (afastado ou ampliado)', () => {
    expect(desenhoNoZoom(0.85, 14, false)).toBe('nitido')
    expect(desenhoNoZoom(1.6, 14, false)).toBe('nitido')
  })

  it('letra miuda (6 a 9 px): so o quadro com foco redesenha; os outros ficam na imagem', () => {
    // 14 x 0,5 = 7 px na tela
    expect(desenhoNoZoom(0.5, 14, true)).toBe('nitido')
    expect(desenhoNoZoom(0.5, 14, false)).toBe('imagem')
  })

  it('lousa vista de cima (menos de 6 px): para de desenhar, menos o quadro com foco', () => {
    expect(desenhoNoZoom(0.3, 14, false)).toBe('pausado')
    expect(desenhoNoZoom(0.3, 14, true)).toBe('imagem')
  })

  it('zoom invalido: nao mexe', () => {
    expect(desenhoNoZoom(0, 14, false)).toBe('imagem')
    expect(desenhoNoZoom(Number.NaN, 14, false)).toBe('imagem')
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
