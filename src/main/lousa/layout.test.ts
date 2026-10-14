import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { ESTADO_PADRAO } from '../estado/armazem'
import { aplicarLayout, SchemaLayout } from './layout'

const c = (x: number) => ({ x, y: 0, largura: 100, altura: 100 })
const estado: EstadoSalvo = {
  ...structuredClone(ESTADO_PADRAO),
  repos: [{ id: 'r1', nome: 'a', caminho: 'C:/a', perfilPadraoId: 'p', caixa: c(0) }],
  quadros: [{ id: 'q1', repoId: 'r1', perfilId: 'p', tipo: 'agente', titulo: 'Claude 1', caixa: c(0) }],
}
const vp = { x: 5, y: 6, zoom: 0.5 }

describe('aplicarLayout', () => {
  it('atualiza caixa de repos e quadros e o viewport', () => {
    const novo = aplicarLayout(estado, {
      repos: [{ id: 'r1', caixa: c(10) }],
      quadros: [{ id: 'q1', caixa: c(20) }],
      viewport: vp,
    })
    expect(novo.repos[0]?.caixa).toEqual(c(10))
    expect(novo.quadros[0]?.caixa).toEqual(c(20))
    expect(novo.viewport).toEqual(vp)
    expect(estado.repos[0]?.caixa).toEqual(c(0)) // o original nao e alterado
  })

  it('ids desconhecidos sao ignorados e nada novo aparece', () => {
    const novo = aplicarLayout(estado, { repos: [{ id: 'zzz', caixa: c(9) }], quadros: [{ id: 'yyy', caixa: c(9) }], viewport: vp })
    expect(novo.repos.map((r) => r.id)).toEqual(['r1'])
    expect(novo.quadros.map((q) => q.id)).toEqual(['q1'])
    expect(novo.repos[0]?.caixa).toEqual(c(0))
  })
})

describe('SchemaLayout', () => {
  const ok = { repos: [{ id: 'r1', caixa: c(1) }], quadros: [], viewport: vp }

  it('aceita um layout valido', () => {
    expect(SchemaLayout.safeParse(ok).success).toBe(true)
  })

  it('recusa numeros nao finitos, tamanho menor que 50 e zoom absurdo', () => {
    expect(SchemaLayout.safeParse({ ...ok, repos: [{ id: 'r1', caixa: { ...c(1), x: Infinity } }] }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, repos: [{ id: 'r1', caixa: { ...c(1), largura: 10 } }] }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, viewport: { ...vp, zoom: 100 } }).success).toBe(false)
    expect(SchemaLayout.safeParse({ ...ok, viewport: { ...vp, x: NaN } }).success).toBe(false)
  })
})
