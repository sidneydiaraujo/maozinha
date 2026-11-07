import { describe, expect, it } from 'vitest'
import { FichasDePasta } from './fichas'

const contador = (): (() => string) => {
  let n = 0
  return () => `f${++n}`
}

describe('FichasDePasta (R2.11)', () => {
  it('troca a ficha pelo caminho escolhido, uma vez so', () => {
    const fichas = new FichasDePasta(contador())
    const ficha = fichas.emitir('C:/repos/app')
    expect(fichas.usar(ficha)).toBe('C:/repos/app')
    expect(() => fichas.usar(ficha)).toThrow('Escolha a pasta de novo')
  })

  it('ficha inventada pela tela nao vira pasta', () => {
    const fichas = new FichasDePasta(contador())
    fichas.emitir('C:/repos/app')
    expect(() => fichas.usar('C:/Users/x')).toThrow('Escolha a pasta de novo')
  })

  it('guarda no maximo 20; a mais antiga sai primeiro', () => {
    const fichas = new FichasDePasta(contador())
    const todas = Array.from({ length: 21 }, (_, i) => fichas.emitir(`C:/p${i}`))
    expect(() => fichas.usar(todas[0] ?? '')).toThrow()
    expect(fichas.usar(todas[20] ?? '')).toBe('C:/p20')
  })
})
