import { describe, expect, it } from 'vitest'
import { querWebgl } from './desenhista'

describe('querWebgl', () => {
  it('o app usa WebGL; so a rodada de prova pede o desenho normal', () => {
    expect(querWebgl('')).toBe(true)
    expect(querWebgl('?outra=1')).toBe(true)
    expect(querWebgl('?desenho=dom')).toBe(false)
    expect(querWebgl('?x=1&desenho=dom')).toBe(false)
    expect(querWebgl('?desenho=webgl')).toBe(true)
  })
})
