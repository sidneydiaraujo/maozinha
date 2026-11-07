import { describe, expect, it } from 'vitest'
import { pastaAmpla } from './pastaAmpla'

describe('pastaAmpla (R2.10)', () => {
  const usuario = 'C:\\Users\\sidne'

  it('a pasta do usuario e as de cima dela sao amplas', () => {
    expect(pastaAmpla('C:\\Users\\sidne', usuario)).toBe(true)
    expect(pastaAmpla('c:\\users\\SIDNE\\', usuario)).toBe(true)
    expect(pastaAmpla('C:\\Users', usuario)).toBe(true)
    expect(pastaAmpla('C:\\', usuario)).toBe(true)
  })

  it('a pasta de um projeto, mesmo dentro da do usuario, nao e', () => {
    expect(pastaAmpla('C:\\Users\\sidne\\pessoal\\lousa-ia', usuario)).toBe(false)
    expect(pastaAmpla('C:\\Users\\sidneia', usuario)).toBe(false)
    expect(pastaAmpla('D:\\', usuario)).toBe(false)
  })

  it('caminho vazio nao e ampla', () => {
    expect(pastaAmpla('', usuario)).toBe(false)
    expect(pastaAmpla('C:\\', '')).toBe(false)
  })
})
