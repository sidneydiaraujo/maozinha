import { describe, expect, it } from 'vitest'
import { nivelDoUso, quandoZera, textoVisto, textoZera, vistaDoUso } from './uso'

const MIN = 60_000
// terca 20/10/2026 10:00, hora local
const agora = new Date(2026, 9, 20, 10, 0).getTime()
const sexta = new Date(2026, 9, 23, 9, 0).getTime()

describe('textoZera', () => {
  it('menos de uma hora', () => {
    expect(textoZera(agora + 35 * MIN, agora)).toBe('zera em 35 min')
  })
  it('horas e minutos', () => {
    expect(textoZera(agora + 130 * MIN, agora)).toBe('zera em 2h10')
    expect(textoZera(agora + 125 * MIN, agora)).toBe('zera em 2h05')
  })
  it('mais de um dia: dia da semana e hora', () => {
    expect(textoZera(sexta, agora)).toBe('zera sex 09:00')
  })
})

describe('textoVisto', () => {
  it('agora, minutos e horas', () => {
    expect(textoVisto(agora - 20_000, agora)).toBe('visto agora')
    expect(textoVisto(agora - 12 * MIN, agora)).toBe('visto há 12 min')
    expect(textoVisto(agora - 130 * MIN, agora)).toBe('visto há 2 h')
  })
})

describe('nivelDoUso', () => {
  it('muda em 70 e 90', () => {
    expect([69, 70, 89, 90].map(nivelDoUso)).toEqual(['normal', 'alerta', 'alerta', 'perigo'])
  })
})

describe('vistaDoUso', () => {
  const uso = {
    perfilId: 'p',
    cincoHoras: { usado: 42, zeraEm: agora + 130 * MIN },
    semana: { usado: 18, zeraEm: sexta },
    quando: agora - 12 * MIN,
  }
  it('as duas linhas do balao', () => {
    const vista = vistaDoUso(uso, agora)
    expect(vista?.linhas).toEqual(['Sessão 42% · zera em 2h10', 'Semana 18% · zera sex 09:00'])
    expect(vista?.visto).toBe('visto há 12 min')
    expect(vista?.velho).toBe(false)
  })
  it('o mostrador da barra de cima (A4): numero, nivel e quando zera, curto', () => {
    expect(vistaDoUso(uso, agora)?.barras).toEqual([
      { nome: 'Sessão', usado: 42, nivel: 'normal', zera: '2h10' },
      { nome: 'Semana', usado: 18, nivel: 'normal', zera: 'sex 09:00' },
    ])
    const perto = { ...uso, cincoHoras: { usado: 93, zeraEm: null } }
    expect(vistaDoUso(perto, agora)?.barras[0]).toEqual({ nome: 'Sessão', usado: 93, nivel: 'perigo', zera: null })
  })
  it('mais de 1 h: velho', () => {
    expect(vistaDoUso({ ...uso, quando: agora - 61 * MIN }, agora)?.velho).toBe(true)
  })
  it('a sessao que ja zerou fica em 0%', () => {
    expect(vistaDoUso(uso, agora + 131 * MIN)?.linhas[0]).toBe('Sessão 0%')
  })
  it('sem dado ou sem limites: nada', () => {
    expect(vistaDoUso(undefined, agora)).toBeNull()
    expect(vistaDoUso({ ...uso, cincoHoras: null, semana: null }, agora)).toBeNull()
  })
})

describe('quandoZera', () => {
  it('curto, sem o "zera em"', () => {
    expect(quandoZera(agora + 35 * MIN, agora)).toBe('35 min')
    expect(quandoZera(agora + 124 * MIN, agora)).toBe('2h04')
    expect(quandoZera(sexta, agora)).toBe('sex 09:00')
  })
  it('ja passou: 0 min', () => {
    expect(quandoZera(agora - MIN, agora)).toBe('0 min')
  })
})
