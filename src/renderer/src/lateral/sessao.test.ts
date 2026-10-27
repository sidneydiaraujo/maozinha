import { describe, expect, it } from 'vitest'
import { detalheDoItem, emOrdem, haQuanto, juntarQuadros, marcarAtividade, type QuadroVisto } from './sessao'

const quadro = (quadroId: string, nome = quadroId): QuadroVisto => ({
  quadroId,
  nome,
  pasta: 'app',
  conta: 'Pessoal',
  cor: '#22c55e',
  tipo: 'agente',
})
const MIN = 60_000

describe('historico da sessao (D48)', () => {
  it('quadro novo entra aberto; o que sumiu fica fechado; o que voltou reabre', () => {
    let h = juntarQuadros([], [quadro('a'), quadro('b')], 0)
    expect(h.map((i) => [i.quadroId, i.abertoEm, i.fechadoEm])).toEqual([
      ['a', 0, undefined],
      ['b', 0, undefined],
    ])
    h = juntarQuadros(h, [quadro('b', 'Revisor')], 5 * MIN)
    expect(h.find((i) => i.quadroId === 'a')?.fechadoEm).toBe(5 * MIN)
    expect(h.find((i) => i.quadroId === 'b')?.nome).toBe('Revisor')
    // fechado continua com a hora em que fechou, mesmo com outras mudancas depois
    h = juntarQuadros(h, [quadro('b')], 9 * MIN)
    expect(h.find((i) => i.quadroId === 'a')?.fechadoEm).toBe(5 * MIN)
    h = juntarQuadros(h, [quadro('a'), quadro('b')], 10 * MIN)
    expect(h.find((i) => i.quadroId === 'a')?.fechadoEm).toBeUndefined()
  })

  it('atividade sobe o quadro; fechados vao para o fim, o ultimo fechado em cima', () => {
    let h = juntarQuadros([], [quadro('a'), quadro('b'), quadro('c'), quadro('d')], 0)
    h = marcarAtividade(h, 'b', 3 * MIN, 'trabalhando')
    h = marcarAtividade(h, 'a', 4 * MIN)
    h = juntarQuadros(h, [quadro('a'), quadro('b')], 6 * MIN)
    h = juntarQuadros(h, [quadro('a'), quadro('b')], 7 * MIN)
    expect(emOrdem(h).map((i) => i.quadroId)).toEqual(['a', 'b', 'c', 'd'])
    expect(h.find((i) => i.quadroId === 'b')?.estado).toBe('trabalhando')
    // fechado nao sobe com atividade atrasada
    expect(marcarAtividade(h, 'c', 8 * MIN).find((i) => i.quadroId === 'c')?.ultimoEm).toBe(0)
  })

  it('detalhe: pasta, conta, estado e quando; fechado diz quando fechou', () => {
    const [item] = marcarAtividade(juntarQuadros([], [quadro('a')], 0), 'a', MIN, 'esperando')
    expect(detalheDoItem(item!, 6 * MIN)).toBe('app · Pessoal · esperando você · há 5 min')
    const [fechado] = juntarQuadros([item!], [], 2 * MIN)
    expect(detalheDoItem(fechado!, 3 * 60 * MIN)).toBe('app · Pessoal · fechado há 2 h')
  })

  it('haQuanto arredonda para baixo', () => {
    expect(haQuanto(0, 59_000)).toBe('agora')
    expect(haQuanto(0, 61 * MIN)).toBe('há 1 h')
  })
})
