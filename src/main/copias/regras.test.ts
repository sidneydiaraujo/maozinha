import { describe, expect, it } from 'vitest'
import { apelidoDaCopia, pastaDasCopias, planejarCopia } from './regras'

describe('apelidoDaCopia', () => {
  it('vira minusculas com hifen', () => {
    expect(apelidoDaCopia('Claude 3', [])).toBe('claude-3')
  })
  it('tira acento', () => {
    expect(apelidoDaCopia('Sessão Ágil', [])).toBe('sessao-agil')
  })
  it('repetido ganha numero, sem diferenciar caixa', () => {
    expect(apelidoDaCopia('Claude 3', ['CLAUDE-3'])).toBe('claude-3-2')
    expect(apelidoDaCopia('Claude 3', ['claude-3', 'claude-3-2'])).toBe('claude-3-3')
  })
  it('titulo sem letra vira "copia"', () => {
    expect(apelidoDaCopia('***', [])).toBe('copia')
  })
})

describe('planejarCopia', () => {
  it('fica ao lado do repositorio, com branch lousa/<apelido>', () => {
    expect(planejarCopia({ caminho: 'C:\\Users\\sidne\\pessoal\\lousa-ia' }, 'Claude 3', [])).toEqual({
      caminho: 'C:\\Users\\sidne\\pessoal\\lousa-ia.copias\\claude-3',
      branch: 'lousa/claude-3',
      apelido: 'claude-3',
    })
  })
  it('ignora a barra no fim da pasta', () => {
    expect(pastaDasCopias('C:\\x\\repo\\')).toBe('C:\\x\\repo.copias')
    expect(pastaDasCopias('C:/x/repo/')).toBe('C:/x/repo.copias')
  })
})
