import { afterEach, describe, expect, it, vi } from 'vitest'
import { descrever, gravarEm, log, mascarar } from './log'

describe('mascarar', () => {
  it('e-mail vira ***@dominio, o resto fica', () => {
    expect(mascarar('conta fulano.silva+x@empresa.com.br logada')).toBe('conta ***@empresa.com.br logada')
    expect(mascarar('a@b.co e c_d@mail.gmail.com')).toBe('***@b.co e ***@mail.gmail.com')
    expect(mascarar('C:\\Users\\sidne\\.claude-pessoal sem email')).toBe('C:\\Users\\sidne\\.claude-pessoal sem email')
  })
})

describe('descrever', () => {
  it('erro com mensagem e pilha; objeto em JSON; texto como esta', () => {
    const erro = new Error('quebrou')
    expect(descrever(erro)).toMatch(/^Error: quebrou\n/)
    expect(descrever({ a: 1 })).toBe('{"a":1}')
    expect(descrever('x')).toBe('x')
    const ciclo: Record<string, unknown> = {}
    ciclo.eu = ciclo
    expect(descrever(ciclo)).toBe('[object Object]')
  })
})

describe('log com destino', () => {
  afterEach(() => gravarEm(null))

  it('grava a linha mascarada com \\n; destino que falha nao derruba o app', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const linhas: string[] = []
    gravarEm((l) => linhas.push(l))
    log('error', 'canal falhou para quem@empresa.com', new Error('x'))
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatch(/ERROR canal falhou para \*\*\*@empresa\.com Error: x/)
    expect(linhas[0]?.endsWith('\n')).toBe(true)
    gravarEm(() => {
      throw new Error('disco cheio')
    })
    expect(() => log('error', 'de novo')).not.toThrow()
  })
})
