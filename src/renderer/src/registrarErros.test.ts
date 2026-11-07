import { describe, expect, it } from 'vitest'
import { avisoInofensivo } from './registrarErros'

describe('avisoInofensivo (R3.15)', () => {
  it('o aviso do ResizeObserver nao vai para o registro', () => {
    expect(avisoInofensivo('ResizeObserver loop completed with undelivered notifications. (:0)')).toBe(true)
    expect(avisoInofensivo('ResizeObserver loop limit exceeded (:0)')).toBe(true)
  })

  it('erro de verdade vai', () => {
    expect(avisoInofensivo("Cannot read properties of undefined (reading 'x') (index.js:10)")).toBe(false)
    expect(avisoInofensivo('promessa rejeitada: Error: ResizeObserver falhou')).toBe(false)
  })
})
