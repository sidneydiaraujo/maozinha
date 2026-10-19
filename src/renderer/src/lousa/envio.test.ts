import { describe, expect, it } from 'vitest'
import { montarEnvio, quadrosPorExtenso } from './envio'

describe('montarEnvio', () => {
  it('uma linha: o texto e depois o Enter, separados', () => {
    expect(montarEnvio('rode os testes')).toEqual(['rode os testes', '\r'])
  })

  it('varias linhas viram uma colagem so', () => {
    expect(montarEnvio('faça commit\r\ne push\n\n')).toEqual(['\x1b[200~faça commit\ne push\x1b[201~', '\r'])
  })

  it('vazio ou so espacos nao envia', () => {
    expect(montarEnvio('  \n ')).toBeNull()
  })
})

describe('quadrosPorExtenso', () => {
  it('singular e plural', () => {
    expect(quadrosPorExtenso(1)).toBe('1 quadro')
    expect(quadrosPorExtenso(3)).toBe('3 quadros')
  })
})
