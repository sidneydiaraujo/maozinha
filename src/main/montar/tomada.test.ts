import { describe, expect, it } from 'vitest'
import { Tomada } from './tomada'

describe('Tomada (R4.20)', () => {
  it('usar antes de ligar da erro com o nome; depois devolve o alvo', () => {
    const t = new Tomada<{ oi(): string }>('estado do agente')
    expect(t.ligada).toBe(false)
    expect(() => t.usar()).toThrow('estado do agente usada antes de ser ligada')
    t.ligar({ oi: () => 'oi' })
    expect(t.ligada).toBe(true)
    expect(t.usar().oi()).toBe('oi')
  })

  it('so liga uma vez', () => {
    const t = new Tomada<object>('time')
    t.ligar({})
    expect(() => t.ligar({})).toThrow('time já está ligada')
  })
})
