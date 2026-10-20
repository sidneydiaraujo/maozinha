import { describe, expect, it } from 'vitest'
import { montarEnvio } from './envio'
import { ehConflito, pedidoDeResolver } from './resolver'

describe('ehConflito', () => {
  it('so o erro de conflito do main', () => {
    expect(ehConflito('Conflito: os dois lados mudaram a.txt. Nada foi juntado; peça a um agente para resolver.')).toBe(true)
    expect(ehConflito('A cópia tem alterações sem commit: peça ao agente para fazer commit antes de juntar')).toBe(false)
    expect(ehConflito(null)).toBe(false)
  })
})

describe('pedidoDeResolver', () => {
  it('pede o merge da branch da original dentro da copia, em uma linha so', () => {
    const pedido = pedidoDeResolver('lousa/claude-2', 'main')
    expect(pedido).toContain('git merge main')
    expect(pedido).toContain('lousa/claude-2')
    expect(pedido).not.toContain('\n')
    // uma linha so: vai como mensagem digitada, sem colagem
    expect(montarEnvio(pedido)).toEqual([pedido, '\r'])
  })
})
