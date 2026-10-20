import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { ESTADO_PADRAO } from '../estado/armazem'
import { aplicarLayout, SchemaLayout } from './layout'

const c = (x: number) => ({ x, y: 0, largura: 100, altura: 100 })
const estado: EstadoSalvo = {
  ...structuredClone(ESTADO_PADRAO),
  repos: [{ id: 'r1', nome: 'a', caminho: 'C:/a', perfilPadraoId: 'p' }],
  quadros: [{ id: 'q1', repoId: 'r1', perfilId: 'p', tipo: 'agente', titulo: 'Claude 1', caixa: c(0) }],
}
const vp = { x: 5, y: 6, zoom: 0.5 }

describe('aplicarLayout', () => {
  it('atualiza a caixa dos quadros e o viewport', () => {
    const novo = aplicarLayout(estado, { quadros: [{ id: 'q1', caixa: c(20) }], viewport: vp })
    expect(novo.quadros[0]?.caixa).toEqual(c(20))
    expect(novo.viewport).toEqual(vp)
    expect(estado.quadros[0]?.caixa).toEqual(c(0)) // o original nao e alterado
  })

  it('ids desconhecidos sao ignorados e nada novo aparece', () => {
    const novo = aplicarLayout(estado, { quadros: [{ id: 'yyy', caixa: c(9) }], viewport: vp })
    expect(novo.quadros.map((q) => q.id)).toEqual(['q1'])
    expect(novo.quadros[0]?.caixa).toEqual(c(0))
  })

  it('notas tambem guardam posicao e tamanho (T26); sem notas, nada aparece', () => {
    const comNota = { ...estado, notas: [{ id: 'n1', texto: 'oi', caixa: c(0) }] }
    const novo = aplicarLayout(comNota, { quadros: [{ id: 'n1', caixa: c(30) }], viewport: vp })
    expect(novo.notas).toEqual([{ id: 'n1', texto: 'oi', caixa: c(30) }])
    expect('notas' in aplicarLayout(estado, { quadros: [], viewport: vp })).toBe(false)
  })
})

describe('SchemaLayout', () => {
  const ok = { quadros: [{ id: 'q1', caixa: c(1) }], viewport: vp }

  it('aceita um layout valido', () => {
    expect(SchemaLayout.safeParse(ok).success).toBe(true)
  })

  it('recusa numeros nao finitos, tamanho menor que 50 e zoom absurdo', () => {
    expect(SchemaLayout.safeParse({ ...ok, quadros: [{ id: 'q1', caixa: { ...c(1), x: Infinity } }] }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, quadros: [{ id: 'q1', caixa: { ...c(1), largura: 10 } }] }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, viewport: { ...vp, zoom: 100 } }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, viewport: { ...vp, x: NaN } }).success).toBe(false)
  })
})
