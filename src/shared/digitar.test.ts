import { describe, expect, it } from 'vitest'
import { PAUSA_ENTER_MS } from './contratoClaude'
import { apertarEnter, digitarMensagem, montarEnvio } from './digitar'

function teclado() {
  const feito: string[] = []
  return {
    feito,
    escrever: (d: string) => void feito.push(d),
    esperar: async (ms: number) => void feito.push(`<${ms}>`),
  }
}

describe('montarEnvio', () => {
  it('uma linha: o texto e o Enter separados', () => {
    expect(montarEnvio('rode os testes')).toEqual(['rode os testes', '\r'])
  })

  it('varias linhas vao como colagem, sem as quebras do fim', () => {
    expect(montarEnvio('faça commit\r\ne push\n\n')).toEqual(['\x1b[200~faça commit\ne push\x1b[201~', '\r'])
  })

  it('so espacos: nada para enviar', () => {
    expect(montarEnvio('  \n ')).toBeNull()
  })
})

describe('digitarMensagem e apertarEnter (R4.22)', () => {
  it('texto, a pausa do contrato e o Enter, nesta ordem', async () => {
    const t = teclado()
    expect(await digitarMensagem(t, 'oi')).toBe(true)
    expect(t.feito).toEqual(['oi', `<${PAUSA_ENTER_MS}>`, '\r'])
  })

  it('texto vazio nao digita nada', async () => {
    const t = teclado()
    expect(await digitarMensagem(t, '   ')).toBe(false)
    expect(t.feito).toEqual([])
  })

  it('apertarEnter so pausa e aperta', async () => {
    const t = teclado()
    await apertarEnter(t)
    expect(t.feito).toEqual([`<${PAUSA_ENTER_MS}>`, '\r'])
  })
})
