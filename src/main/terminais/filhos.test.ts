import { describe, expect, it } from 'vitest'
import { argumentosDaBusca, temClaudeDentro } from './filhos'

describe('temClaudeDentro (T29.1)', () => {
  it('pergunta so pelos filhos claude.exe daquele pid', () => {
    const args = argumentosDaBusca(1234)
    expect(args.at(-1)).toContain("ParentProcessId=1234")
    expect(args.at(-1)).toContain("'claude.exe'")
  })

  it('pid que nao e numero inteiro positivo e recusado (nada de texto de fora no comando)', () => {
    expect(() => argumentosDaBusca(Number.NaN)).toThrow('pid inválido')
    expect(() => argumentosDaBusca(-1)).toThrow('pid inválido')
    expect(() => argumentosDaBusca(1.5)).toThrow('pid inválido')
  })

  it('conta > 0 e sim; 0, saida estranha ou erro e nao', async () => {
    expect(await temClaudeDentro(10, async () => '1\r\n')).toBe(true)
    expect(await temClaudeDentro(10, async () => '0\r\n')).toBe(false)
    expect(await temClaudeDentro(10, async () => 'erro')).toBe(false)
    expect(
      await temClaudeDentro(10, async () => {
        throw new Error('powershell falhou')
      }),
    ).toBe(false)
  })
})
