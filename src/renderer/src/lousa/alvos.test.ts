import { describe, expect, it } from 'vitest'
import { escolherAlvos } from './alvos'

describe('escolherAlvos', () => {
  it('com selecao: os selecionados que ainda existem', () => {
    expect(escolherAlvos(['a', 'b', 'x'], 'c', ['a', 'b', 'c'])).toEqual(['a', 'b'])
  })

  it('sem selecao: o ultimo quadro usado', () => {
    expect(escolherAlvos([], 'c', ['a', 'c'])).toEqual(['c'])
  })

  it('o ultimo foi fechado e nada selecionado: ninguem', () => {
    expect(escolherAlvos([], 'c', ['a'])).toEqual([])
    expect(escolherAlvos([], null, ['a'])).toEqual([])
  })
})
