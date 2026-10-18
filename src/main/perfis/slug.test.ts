import { describe, expect, it } from 'vitest'
import { slugConta } from './slug'

describe('slugConta', () => {
  it('minusculas, sem acento, espacos e simbolos viram um traco', () => {
    expect(slugConta('Trabalho Dev')).toBe('trabalho-dev')
    expect(slugConta('Ação!')).toBe('acao')
    expect(slugConta('  Cliente -- X  ')).toBe('cliente-x')
  })

  it('so simbolos = vazio', () => {
    expect(slugConta('!!! ???')).toBe('')
    expect(slugConta('')).toBe('')
  })

  it('corta em 30 sem deixar traco no fim', () => {
    expect(slugConta('a'.repeat(29) + ' b')).toBe('a'.repeat(29))
    expect(slugConta('x'.repeat(40))).toHaveLength(30)
  })
})
