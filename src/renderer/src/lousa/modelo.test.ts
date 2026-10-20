import { describe, expect, it } from 'vitest'
import type { PainelAgente } from '../../../shared/model'
import { esforcoRecusado, familiaDoModelo, nomeCurto, rotuloDoEsforco, rotuloDoModelo } from './modelo'

const painel = (p: Partial<PainelAgente>): PainelAgente => ({
  modelo: null,
  esforco: null,
  contexto: null,
  limites: null,
  quando: 10_000,
  ...p,
})

describe('rotulos do cabecalho', () => {
  it('com painel: o que vale agora, com o nome curto do modelo', () => {
    const p = painel({ modelo: { id: 'claude-opus-5-5', nome: 'Opus 5.5 (1M context)' }, esforco: 'xhigh' })
    expect(rotuloDoModelo({ modelo: 'sonnet' }, p)).toEqual({ texto: 'Opus 5.5', valendo: true })
    expect(rotuloDoEsforco({ esforco: 'low' }, p)).toEqual({ texto: 'muito alto', valendo: true })
  })

  it('antes do primeiro painel: o guardado no quadro, em cinza', () => {
    expect(rotuloDoModelo({ modelo: 'fable' }, undefined)).toEqual({ texto: 'Fable', valendo: false })
    expect(rotuloDoEsforco({ esforco: 'medium' }, undefined)).toEqual({ texto: 'médio', valendo: false })
  })

  it('nada guardado e sem painel: o nome do seletor', () => {
    expect(rotuloDoModelo({}, undefined).texto).toBe('modelo')
    expect(rotuloDoEsforco({}, painel({})).texto).toBe('esforço')
  })
})

describe('familiaDoModelo e nomeCurto', () => {
  it('acha a familia pelo id', () => {
    expect(familiaDoModelo('claude-sonnet-5-5')).toBe('sonnet')
    expect(familiaDoModelo('claude-fable-5-1')).toBe('fable')
    expect(familiaDoModelo('gpt-9')).toBeNull()
  })

  it('tira o parentese do fim', () => {
    expect(nomeCurto('Opus 5.5 (1M context)')).toBe('Opus 5.5')
    expect(nomeCurto('Haiku 5.5')).toBe('Haiku 5.5')
  })
})

describe('esforcoRecusado', () => {
  const pedido = { esforco: 'max' as const, quando: 10_000 }

  it('painel bem depois do pedido com outro nivel: o modelo nao aceitou', () => {
    expect(esforcoRecusado(pedido, painel({ esforco: 'high', quando: 15_000 }))).toBe(true)
  })

  it('painel logo depois (o Claude ainda nao trocou): nao avisa', () => {
    expect(esforcoRecusado(pedido, painel({ esforco: 'high', quando: 11_000 }))).toBe(false)
  })

  it('pegou, ou sem pedido: nao avisa', () => {
    expect(esforcoRecusado(pedido, painel({ esforco: 'max', quando: 15_000 }))).toBe(false)
    expect(esforcoRecusado(null, painel({ esforco: 'high', quando: 15_000 }))).toBe(false)
  })
})
