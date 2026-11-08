import { describe, expect, it } from 'vitest'
import { CONTRATO_CLAUDE, VERSAO_CONFERIDA } from './contratoClaude'

describe('CONTRATO_CLAUDE (R4.21)', () => {
  it('todo item diz em que versao foi provado e como se confere', () => {
    for (const i of CONTRATO_CLAUDE) {
      expect(i.provadoEm).toMatch(/^2\.\d+\.\d+|^2\.1\.30x/)
      expect(i.prova.length).toBeGreaterThan(5)
    }
  })

  it('a versao conferida tem o formato do claude --version', () => {
    expect(VERSAO_CONFERIDA).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
