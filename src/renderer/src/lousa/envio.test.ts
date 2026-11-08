import { describe, expect, it } from 'vitest'
import { quadrosPorExtenso } from './envio'

// montarEnvio mudou para shared/digitar.ts (R4.22), com os testes dele

describe('quadrosPorExtenso', () => {
  it('singular e plural', () => {
    expect(quadrosPorExtenso(1)).toBe('1 quadro')
    expect(quadrosPorExtenso(3)).toBe('3 quadros')
  })
})
