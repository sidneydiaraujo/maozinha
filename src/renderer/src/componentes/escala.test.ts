import { describe, expect, it } from 'vitest'
import { escalaDe, pontoSemZoom } from './escala'

describe('escalaDe', () => {
  it('largura na tela dividida pela largura sem zoom', () => {
    expect(escalaDe(400, 500)).toBe(0.8)
    expect(escalaDe(576, 500)).toBeCloseTo(1.152)
  })

  it('sem medida valida (terminal escondido): 1, sem corrigir', () => {
    expect(escalaDe(0, 500)).toBe(1)
    expect(escalaDe(400, 0)).toBe(1)
  })
})

describe('pontoSemZoom', () => {
  const origem = { left: 100, top: 50 }

  it('a 100% o ponto nao muda', () => {
    expect(pontoSemZoom({ x: 300, y: 250 }, origem, 1)).toEqual({ x: 300, y: 250 })
  })

  it('lousa reduzida: a distancia ate o canto do terminal cresce na mesma proporcao', () => {
    // 160 px na tela a 80% = 200 px no terminal
    expect(pontoSemZoom({ x: 260, y: 210 }, origem, 0.8)).toEqual({ x: 300, y: 250 })
  })

  it('lousa ampliada: a distancia encolhe', () => {
    // 300 px na tela a 150% = 200 px no terminal
    expect(pontoSemZoom({ x: 400, y: 350 }, origem, 1.5)).toEqual({ x: 300, y: 250 })
  })

  it('o canto do terminal fica no lugar com qualquer zoom', () => {
    expect(pontoSemZoom({ x: 100, y: 50 }, origem, 0.5)).toEqual({ x: 100, y: 50 })
  })
})
