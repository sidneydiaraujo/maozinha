import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { juntarComAtuais, mesmoDado } from './juntarNos'

const quadro = { id: 'q1' }
const conta = { id: 'pessoal' }
const no = (id: string, data: Record<string, unknown>, extra: Partial<Node> = {}): Node => ({
  id,
  type: 'quadro',
  position: { x: 0, y: 0 },
  style: { width: 100, height: 100 },
  data,
  ...extra,
})

describe('mesmoDado (R4.23)', () => {
  it('mesmos objetos e listas com os mesmos itens: igual', () => {
    expect(mesmoDado({ quadro, contas: [conta] }, { quadro, contas: [conta] })).toBe(true)
  })

  it('um objeto novo, uma lista diferente ou um campo a mais: diferente', () => {
    expect(mesmoDado({ quadro }, { quadro: { ...quadro } })).toBe(false)
    expect(mesmoDado({ contas: [conta] }, { contas: [] })).toBe(false)
    expect(mesmoDado({ quadro }, { quadro, rotulo: 'app' })).toBe(false)
  })
})

describe('juntarComAtuais (R4.23)', () => {
  it('quadro sem mudanca: o mesmo objeto da tela (o React Flow nao redesenha)', () => {
    const antigo = no('q1', { quadro, contas: [conta] }, { position: { x: 50, y: 60 }, measured: { width: 100, height: 100 } })
    const [junto] = juntarComAtuais([no('q1', { quadro, contas: [conta] })], [antigo])
    expect(junto).toBe(antigo)
  })

  it('quadro que mudou: data nova, com a posicao e o tamanho da tela', () => {
    const antigo = no('q1', { quadro }, { position: { x: 50, y: 60 }, style: { width: 300, height: 200 } })
    const outro = { id: 'q1', titulo: 'novo' }
    const [junto] = juntarComAtuais([no('q1', { quadro: outro })], [antigo])
    expect(junto).not.toBe(antigo)
    expect(junto?.data).toEqual({ quadro: outro })
    expect(junto?.position).toEqual({ x: 50, y: 60 })
    expect(junto?.style).toEqual({ width: 300, height: 200 })
  })

  it('selecionado e sem mudanca: reaproveita o data, mas sai sem selecao como antes', () => {
    const dados = { quadro }
    const antigo = no('q1', dados, { selected: true })
    const [junto] = juntarComAtuais([no('q1', { quadro })], [antigo])
    expect(junto).not.toBe(antigo)
    expect(junto?.data).toBe(dados)
    expect(junto?.selected).toBeUndefined()
  })

  it('quadro novo entra como veio; o que saiu do estado sai da tela', () => {
    const novo = no('q2', { quadro })
    expect(juntarComAtuais([novo], [no('q1', { quadro })])).toEqual([novo])
  })
})
