import { describe, expect, it } from 'vitest'
import { pontuar } from './pontuar'

describe('pontuar', () => {
  it('vazio combina com tudo', () => {
    expect(pontuar('  ', 'qualquer')).toBe(0)
  })

  it('comeco > meio > letras na ordem > nada', () => {
    const comeco = pontuar('lei', 'leia.md') ?? -1
    const meio = pontuar('ia', 'leia.md') ?? -1
    const letras = pontuar('lmd', 'leia.md') ?? -1
    expect(comeco).toBeGreaterThan(meio)
    expect(meio).toBeGreaterThan(letras)
    expect(letras).toBeGreaterThan(0)
    expect(pontuar('xyz', 'leia.md')).toBeNull()
  })

  it('letras muito espalhadas nao combinam', () => {
    expect(pontuar('api', 'app · Terminal 1 Ir ao quadro · Principal')).toBeNull()
  })

  it('ignora maiuscula e acento', () => {
    expect(pontuar('SESSAO', 'sessão.md')).not.toBeNull()
  })

  it('nome mais curto ganha no empate', () => {
    expect(pontuar('app', 'app')! > pontuar('app', 'app-grande-demais')!).toBe(true)
  })
})
