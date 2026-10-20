import { describe, expect, it } from 'vitest'
import { FOLGA, lugarLivre } from './lugar'

const tamanho = { largura: 600, altura: 400 }
const caixa = (x: number, y: number) => ({ x, y, ...tamanho })

describe('lugarLivre', () => {
  it('lousa vazia ou lugar livre: fica onde pediu', () => {
    expect(lugarLivre([], { x: 10, y: 20 }, tamanho)).toEqual({ x: 10, y: 20 })
    expect(lugarLivre([caixa(0, 0)], { x: 700, y: 0 }, tamanho)).toEqual({ x: 700, y: 0 })
  })

  it('em cima de um quadro: vai para o vizinho livre mais perto', () => {
    // pedido no meio-direito do quadro: o lado direito e o mais perto
    expect(lugarLivre([caixa(0, 0)], { x: 300, y: 0 }, tamanho)).toEqual({ x: 600 + FOLGA, y: 0 })
    // pedido um pouco abaixo: embaixo e o mais perto
    expect(lugarLivre([caixa(0, 0)], { x: 0, y: 150 }, tamanho)).toEqual({ x: 0, y: 400 + FOLGA })
  })

  it('encostado demais (menos que a folga) tambem conta como em cima', () => {
    expect(lugarLivre([caixa(0, 0)], { x: 610, y: 0 }, tamanho)).toEqual({ x: 600 + FOLGA, y: 0 })
  })

  it('pula vizinhos ocupados por outro quadro', () => {
    const ocupadas = [caixa(0, 0), caixa(600 + FOLGA, 0)]
    const p = lugarLivre(ocupadas, { x: 300, y: 0 }, tamanho)
    expect(ocupadas.some((c) => Math.abs(c.x - p.x) < 600 + FOLGA && Math.abs(c.y - p.y) < 400 + FOLGA)).toBe(false)
  })
})
