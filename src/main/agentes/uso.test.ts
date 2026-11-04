import { describe, expect, it } from 'vitest'
import type { Limite, PainelAgente } from '../../shared/model'
import { juntarUso, UsoDasContas } from './uso'

const painel = (quando: number, cinco: Limite | null, semana: Limite | null = null): PainelAgente => ({
  modelo: null,
  esforco: null,
  contexto: null,
  limites: cinco || semana ? { cincoHoras: cinco, semana } : null,
  quando,
})
const l = (usado: number, zeraEm: number | null = null): Limite => ({ usado, zeraEm })

describe('juntarUso', () => {
  it('o mais novo vence', () => {
    const a = juntarUso(undefined, painel(10, l(40), l(10)), 'p')
    expect(juntarUso(a, painel(20, l(50), l(12)), 'p')).toEqual({ perfilId: 'p', cincoHoras: l(50), semana: l(12), quando: 20 })
    expect(juntarUso(a, painel(5, l(1), l(1)), 'p')).toBe(a)
  })
  it('painel sem limites mantem o anterior', () => {
    const a = juntarUso(undefined, painel(10, l(40), l(10)), 'p')
    expect(juntarUso(a, painel(20, null), 'p')).toBe(a)
  })
  it('painel com um limite so mantem o outro', () => {
    const a = juntarUso(undefined, painel(10, l(40), l(10)), 'p')
    expect(juntarUso(a, painel(20, l(45)), 'p')).toEqual({ perfilId: 'p', cincoHoras: l(45), semana: l(10), quando: 20 })
  })
  it('primeiro painel sem limites: conta sem dado', () => {
    expect(juntarUso(undefined, painel(10, null), 'p')).toEqual({ perfilId: 'p', cincoHoras: null, semana: null, quando: 10 })
  })
})

describe('juntarUso: dado parado de outro agente da mesma conta (A29)', () => {
  const HORA = 3_600_000
  it('no mesmo periodo, uso menor nao faz a barra voltar nem renova o "visto"', () => {
    const a = juntarUso(undefined, painel(100, l(23, 5 * HORA), l(38, 90 * HORA)), 'p')
    // agente parado desde ontem redesenha a linha de status com os numeros que tinha
    expect(juntarUso(a, painel(200, l(23, 5 * HORA), l(5, 90 * HORA)), 'p')).toBe(a)
  })

  it('periodo anterior (zerava antes) e ignorado', () => {
    const a = juntarUso(undefined, painel(100, l(10, 10 * HORA)), 'p')
    expect(juntarUso(a, painel(200, l(80, 5 * HORA)), 'p')).toBe(a)
  })

  it('periodo novo vence mesmo com uso menor: a sessao zerou', () => {
    const a = juntarUso(undefined, painel(100, l(80, 5 * HORA)), 'p')
    expect(juntarUso(a, painel(200, l(3, 10 * HORA)), 'p').cincoHoras).toEqual(l(3, 10 * HORA))
  })

  it('mesmo uso de um agente ativo renova o "visto"; hora de zerar com segundos de diferenca e o mesmo periodo', () => {
    const a = juntarUso(undefined, painel(100, l(23, 5 * HORA)), 'p')
    const b = juntarUso(a, painel(200, l(23, 5 * HORA + 1000)), 'p')
    expect(b.quando).toBe(200)
    expect(juntarUso(b, painel(300, l(24, 5 * HORA)), 'p').cincoHoras?.usado).toBe(24)
  })

  it('metade velha e metade nova: entra so a nova, o "visto" fica', () => {
    const a = juntarUso(undefined, painel(100, l(20, 5 * HORA), l(30, 90 * HORA)), 'p')
    const b = juntarUso(a, painel(200, l(25, 5 * HORA), l(10, 90 * HORA)), 'p')
    expect(b).toEqual({ perfilId: 'p', cincoHoras: l(25, 5 * HORA), semana: l(30, 90 * HORA), quando: 100 })
  })
})

describe('UsoDasContas', () => {
  it('outra conta nao mistura', () => {
    const usos = new UsoDasContas()
    usos.aoPainel('a', painel(10, l(40)))
    usos.aoPainel('b', painel(20, l(90)))
    expect(usos.todos(0).map((u) => [u.perfilId, u.cincoHoras?.usado])).toEqual([
      ['a', 40],
      ['b', 90],
    ])
  })
  it('so avisa quando muda', () => {
    const usos = new UsoDasContas()
    expect(usos.aoPainel('a', painel(10, l(40)))).not.toBeNull()
    expect(usos.aoPainel('a', painel(5, l(10)))).toBeNull()
    expect(usos.aoPainel('a', painel(20, null))).toBeNull()
  })
  it('o que ja zerou aparece com 0%', () => {
    const usos = new UsoDasContas()
    usos.aoPainel('a', painel(10, l(80, 1000), l(30, 9000)))
    const [uso] = usos.todos(2000)
    expect(uso?.cincoHoras).toEqual({ usado: 0, zeraEm: null })
    expect(uso?.semana).toEqual(l(30, 9000))
  })
})
