import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { MAXIMO_VISTAS, ServicoVistas } from './servico'

const c = (x: number) => ({ x, y: 0, largura: 400, altura: 300 })
const vp = { x: 1, y: 2, zoom: 0.8 }

function armazemNaMemoria(): Armazem & { estado: EstadoSalvo } {
  const a: Armazem & { estado: EstadoSalvo } = {
    estado: {
      ...structuredClone(ESTADO_PADRAO),
      quadros: [{ id: 'q1', repoId: 'r', perfilId: 'p', tipo: 'terminal', titulo: 'Terminal 1', caixa: c(0) }],
      notas: [{ id: 'n1', texto: '', caixa: c(500) }],
    },
    carregar: () => structuredClone(a.estado),
    salvar: (e: EstadoSalvo) => {
      a.estado = structuredClone(e)
    },
  }
  return a
}

let n = 0
const novoId = (): string => `v${++n}`

describe('ServicoVistas', () => {
  it('guarda camera e caixas so dos quadros e notas que existem', () => {
    const armazem = armazemNaMemoria()
    const lista = new ServicoVistas({ armazem, novoId }).salvar('  Revisão  ', {
      quadros: [
        { id: 'q1', caixa: c(10) },
        { id: 'n1', caixa: c(20) },
        { id: 'inventado', caixa: c(30) },
      ],
      viewport: vp,
    })
    expect(lista).toEqual([{ id: expect.any(String), nome: 'Revisão', viewport: vp, caixas: { q1: c(10), n1: c(20) } }])
    expect(armazem.estado.vistas).toEqual(lista)
  })

  it('mesmo nome (sem diferenciar maiuscula) substitui e mantem o id', () => {
    const s = new ServicoVistas({ armazem: armazemNaMemoria(), novoId })
    const [primeira] = s.salvar('Foco', { quadros: [{ id: 'q1', caixa: c(1) }], viewport: vp })
    const lista = s.salvar('foco', { quadros: [{ id: 'q1', caixa: c(2) }], viewport: vp })
    expect(lista).toHaveLength(1)
    expect(lista[0]).toMatchObject({ id: primeira?.id, nome: 'foco', caixas: { q1: c(2) } })
  })

  it('nome vazio ou vistas demais: lanca sem gravar', () => {
    const s = new ServicoVistas({ armazem: armazemNaMemoria(), novoId })
    expect(() => s.salvar('   ', { quadros: [], viewport: vp })).toThrow('Dê um nome')
    for (let i = 0; i < MAXIMO_VISTAS; i++) s.salvar(`v${i}`, { quadros: [], viewport: vp })
    expect(() => s.salvar('mais uma', { quadros: [], viewport: vp })).toThrow('apague uma antes')
    // substituir uma que ja existe continua valendo
    expect(s.salvar('v0', { quadros: [], viewport: vp })).toHaveLength(MAXIMO_VISTAS)
  })

  it('remover tira a vista; remover de novo nao e erro', () => {
    const s = new ServicoVistas({ armazem: armazemNaMemoria(), novoId })
    const [v] = s.salvar('A', { quadros: [], viewport: vp })
    expect(s.remover(v?.id ?? '')).toEqual([])
    expect(s.remover(v?.id ?? '')).toEqual([])
  })
})
