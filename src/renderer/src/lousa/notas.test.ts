import { describe, expect, it } from 'vitest'
import type { EstadoTela } from '../../../shared/model'
import { comTextoDaNota, montarNotas } from './notas'

const caixa = { x: 10, y: 20, largura: 380, altura: 280 }
const estado: EstadoTela = {
  perfis: [],
  repos: [],
  quadros: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  notas: [{ id: 'n1', texto: '# plano', caixa }],
}
const acoes = { salvar: () => undefined, remover: () => undefined }

describe('montarNotas', () => {
  it('cada nota vira um no "nota" com a caixa salva, arrastado pelo cabecalho', () => {
    expect(montarNotas(estado, acoes)).toEqual([
      {
        id: 'n1',
        type: 'nota',
        position: { x: 10, y: 20 },
        style: { width: 380, height: 280 },
        dragHandle: '.cabecalho-nota',
        data: { nota: { id: 'n1', texto: '# plano', caixa }, acoes },
      },
    ])
  })

  it('estado sem notas (versao antiga): nenhum no', () => {
    expect(montarNotas({ ...estado, notas: undefined }, acoes)).toEqual([])
  })
})

describe('comTextoDaNota', () => {
  it('troca so o texto da nota pedida', () => {
    expect(comTextoDaNota(estado, 'n1', 'novo').notas?.[0]).toEqual({ id: 'n1', texto: 'novo', caixa })
    expect(comTextoDaNota(estado, 'x', 'novo').notas?.[0]?.texto).toBe('# plano')
  })
})
