import { describe, expect, it } from 'vitest'
import { normalizarCaminho, sugerirPerfil } from './sugerir'

const perfis = [
  { id: 'principal', raizes: [] },
  { id: 'pessoal', raizes: ['C:\\Users\\x\\pessoal'] },
]

describe('normalizarCaminho', () => {
  it('minusculas, barras para \\ e sem barra no fim', () => {
    expect(normalizarCaminho('C:/Users/X/Repo/')).toBe('c:\\users\\x\\repo')
    expect(normalizarCaminho('C:\\Users\\X\\Repo\\\\')).toBe('c:\\users\\x\\repo')
  })
})

describe('sugerirPerfil', () => {
  it('pasta dentro da raiz de uma conta sugere essa conta', () => {
    expect(sugerirPerfil('C:\\Users\\x\\pessoal\\lousa-ia', perfis, 'principal')).toBe('pessoal')
  })

  it('pasta igual a raiz tambem vale', () => {
    expect(sugerirPerfil('C:\\Users\\x\\pessoal', perfis, null)).toBe('pessoal')
  })

  it('pessoal-2 NAO casa com a raiz pessoal', () => {
    expect(sugerirPerfil('C:\\Users\\x\\pessoal-2\\app', perfis, 'principal')).toBe('principal')
  })

  it('ignora caixa e tipo de barra', () => {
    expect(sugerirPerfil('c:/USERS/x/Pessoal/app', perfis, null)).toBe('pessoal')
  })

  it('fora de qualquer raiz volta para a ultima conta usada', () => {
    expect(sugerirPerfil('D:\\trabalho\\app', perfis, 'pessoal')).toBe('pessoal')
  })

  it('ultima conta que sumiu cai na primeira da lista', () => {
    expect(sugerirPerfil('D:\\trabalho\\app', perfis, 'apagada')).toBe('principal')
  })

  it('sem contas devolve null', () => {
    expect(sugerirPerfil('D:\\x', [], 'pessoal')).toBeNull()
  })
})
