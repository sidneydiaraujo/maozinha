import { describe, expect, it } from 'vitest'
import { PREF_CONTEXTO_PADRAO, prefCompactarDe, prefContextoDe, tokensPorExtenso, vistaDoContexto } from './contexto'

const P = PREF_CONTEXTO_PADRAO

describe('vistaDoContexto', () => {
  it('sem dado ainda (null): nao aparece, mesmo com "sempre"', () => {
    expect(vistaDoContexto(null, { ...P, mostrar: 'sempre' })).toEqual({ visivel: false })
  })

  it('nunca: nao aparece nem cheio', () => {
    expect(vistaDoContexto(99, { ...P, mostrar: 'nunca' })).toEqual({ visivel: false })
  })

  it('sempre: aparece ate com 3%', () => {
    expect(vistaDoContexto(3, { ...P, mostrar: 'sempre' })).toMatchObject({ visivel: true, numero: 3, nivel: 'ok' })
  })

  it('a partir de 50 (padrao): 49 some, 50 aparece', () => {
    expect(vistaDoContexto(49.4, P)).toEqual({ visivel: false })
    expect(vistaDoContexto(50, P)).toMatchObject({ visivel: true, numero: 50 })
  })

  it('os dois limiares: 69 ok, 70 alerta, 89 alerta, 90 perigo', () => {
    const sempre = { ...P, mostrar: 'sempre' as const }
    expect(vistaDoContexto(69, sempre)).toMatchObject({ nivel: 'ok' })
    expect(vistaDoContexto(70, sempre)).toMatchObject({ nivel: 'alerta' })
    expect(vistaDoContexto(89, sempre)).toMatchObject({ nivel: 'alerta' })
    expect(vistaDoContexto(90, sempre)).toMatchObject({ nivel: 'perigo' })
  })

  it('restante: mostra 100 - usado, mas a cor segue o usado', () => {
    expect(vistaDoContexto(62, { ...P, mostrarRestante: true }, 200_000)).toEqual({
      visivel: true,
      numero: 38,
      nivel: 'ok',
      texto: '38% do contexto livre (76 mil de 200 mil)',
    })
    expect(vistaDoContexto(95, { ...P, mostrarRestante: true })).toMatchObject({ numero: 5, nivel: 'perigo' })
  })

  it('balao do plano: "62% do contexto usado (124 mil de 200 mil)"', () => {
    expect(vistaDoContexto(62, P, 200_000)).toMatchObject({ texto: '62% do contexto usado (124 mil de 200 mil)' })
  })

  it('numero inteiro: 62,4 e 62,0 dao o mesmo (a tela nao muda a cada decimal)', () => {
    expect(vistaDoContexto(62.4, P)).toEqual(vistaDoContexto(62, P))
  })
})

describe('tokensPorExtenso', () => {
  it('mil, milhao e milhoes', () => {
    expect(tokensPorExtenso(124_000)).toBe('124 mil')
    expect(tokensPorExtenso(1_000_000)).toBe('1 milhão')
    expect(tokensPorExtenso(1_500_000)).toBe('1,5 milhão')
    expect(tokensPorExtenso(2_000_000)).toBe('2 milhões')
  })
})

describe('prefContextoDe', () => {
  it('vazio ou estragado: padrao', () => {
    expect(prefContextoDe(null)).toEqual(P)
    expect(prefContextoDe('{nao e json')).toEqual(P)
  })

  it('campo ruim volta ao padrao so nele', () => {
    expect(prefContextoDe('{"mostrar":"sempre","aPartirDe":"x","alerta":60}')).toEqual({
      ...P,
      mostrar: 'sempre',
      alerta: 60,
    })
  })

  it('compactar sozinho (A17): desligado e 40% por padrao; limite fora de 10-90 volta ao padrao', () => {
    expect(P).toMatchObject({ compactarSozinho: false, limiteCompactar: 40 })
    expect(prefContextoDe('{"compactarSozinho":true,"limiteCompactar":60}')).toMatchObject({
      compactarSozinho: true,
      limiteCompactar: 60,
    })
    expect(prefContextoDe('{"compactarSozinho":"sim","limiteCompactar":95}')).toMatchObject({
      compactarSozinho: false,
      limiteCompactar: 40,
    })
    expect(prefCompactarDe({ ...P, compactarSozinho: true })).toEqual({ ligado: true, limite: 40 })
  })

  it('alerta >= perigo: os dois voltam ao padrao', () => {
    expect(prefContextoDe('{"alerta":95,"perigo":80}')).toMatchObject({ alerta: 70, perigo: 90 })
  })
})
