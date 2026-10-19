import { describe, expect, it } from 'vitest'
import { Historico } from './historico'

describe('Historico', () => {
  it('comeca vazio', () => {
    expect(new Historico(10).texto()).toBe('')
  })

  it('devolve tudo enquanto cabe no limite', () => {
    const h = new Historico(10)
    h.anotar('ola ')
    h.anotar('mundo')
    expect(h.texto()).toBe('ola mundo')
  })

  it('guarda so os ultimos caracteres, antes e depois de juntar', () => {
    const h = new Historico(5)
    for (const c of '0123456789ABC') h.anotar(c)
    expect(h.texto()).toBe('89ABC')
    h.anotar('DEFGHIJKLMNOP')
    h.anotar('Q')
    expect(h.texto()).toBe('MNOPQ')
  })

  it('pedaco maior que o limite tambem e cortado', () => {
    const h = new Historico(4)
    h.anotar('abcdefghij')
    expect(h.texto()).toBe('ghij')
  })

  it('nao junta a cada pedaco: o custo nao cresce com o limite', () => {
    const h = new Historico(1_000_000)
    h.anotar('x'.repeat(1_000_000))
    const inicio = performance.now()
    for (let i = 0; i < 20_000; i++) h.anotar('y'.repeat(120))
    // juntar a cada pedaco levava ~18 s aqui (0,9 ms por pedaco); em pedacos sao poucos ms
    expect(performance.now() - inicio).toBeLessThan(2_000)
    expect(h.texto()).toHaveLength(1_000_000)
  })
})
