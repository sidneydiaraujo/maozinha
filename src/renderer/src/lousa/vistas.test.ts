import type { Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'
import { aplicarVista } from './vistas'

const no = (id: string, x: number): Node => ({ id, position: { x, y: 0 }, data: {}, style: { width: 100, height: 100 } })

describe('aplicarVista', () => {
  it('quem esta na vista volta para a caixa guardada; quem nasceu depois fica onde esta', () => {
    const vista = { caixas: { a: { x: 50, y: 60, largura: 400, altura: 300 } } }
    const [a, b] = aplicarVista([no('a', 0), no('b', 999)], vista)
    expect(a).toMatchObject({ position: { x: 50, y: 60 }, width: 400, height: 300, style: { width: 400, height: 300 } })
    expect(b).toEqual(no('b', 999))
  })
})
