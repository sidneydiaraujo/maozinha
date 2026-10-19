import { describe, expect, it } from 'vitest'
import { acharOcorrencias, vizinha } from './procurar'

describe('acharOcorrencias', () => {
  it('acha varias na mesma linha e em linhas diferentes, sem diferenciar maiuscula', () => {
    expect(acharOcorrencias(['erro aqui, ERRO ali', 'nada', 'Erro'], 'erro')).toEqual([
      { linha: 0, coluna: 0 },
      { linha: 0, coluna: 11 },
      { linha: 2, coluna: 0 },
    ])
  })
  it('vazio nao acha nada', () => {
    expect(acharOcorrencias(['abc'], '')).toEqual([])
  })
})

describe('vizinha', () => {
  it('da a volta nas pontas', () => {
    expect(vizinha(3, 2, 1)).toBe(0)
    expect(vizinha(3, 0, -1)).toBe(2)
    expect(vizinha(0, 0, 1)).toBe(-1)
  })
})
