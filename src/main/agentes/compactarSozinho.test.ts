import { describe, expect, it } from 'vitest'
import type { EstadoAgente } from '../../shared/model'
import { CompactarSozinho } from './compactarSozinho'

function montar(o: { usado?: number | null; ocupado?: boolean; falha?: boolean } = {}) {
  const ev: string[] = []
  const estado = { usado: o.usado === undefined ? 55 : o.usado, ocupado: o.ocupado ?? false }
  const c = new CompactarSozinho({
    usado: () => estado.usado,
    ocupado: () => estado.ocupado,
    compactar: async (id) => {
      ev.push(`compactar:${id}`)
      if (o.falha) throw new Error('Espere o agente parar')
    },
    aoCompactar: (id) => void ev.push(`marca:${id}`),
    aoDesistir: (id) => void ev.push(`desistiu:${id}`),
  })
  const passar = (...estados: EstadoAgente[]): void => {
    for (const e of estados) c.aoEstado('a', { estado: e })
  }
  return { c, ev, estado, passar }
}

describe('CompactarSozinho (A17)', () => {
  it('desligado (o padrao): nunca compacta, mesmo cheio', () => {
    const { ev, passar } = montar({ usado: 95 })
    passar('trabalhando', 'terminou')
    expect(ev).toEqual([])
  })

  it('ligado: no meio do trabalho nao; ao terminar a vez acima do limite, compacta uma vez', async () => {
    const { c, ev, passar } = montar({ usado: 70 })
    c.definir({ ligado: true, limite: 40 })
    passar('trabalhando', 'esperando', 'trabalhando')
    expect(ev).toEqual([])
    passar('terminou')
    await Promise.resolve()
    await Promise.resolve()
    expect(ev).toEqual(['compactar:a', 'marca:a'])
    expect(c.segurando('a')).toBe(true)
    // a vez do proprio /compact termina: solta, e nao compacta de novo
    passar('trabalhando', 'terminou')
    expect(ev).toEqual(['compactar:a', 'marca:a'])
    expect(c.segurando('a')).toBe(false)
  })

  it('abaixo do limite ou sem dado: nao compacta', () => {
    const abaixo = montar({ usado: 39 })
    abaixo.c.definir({ ligado: true, limite: 40 })
    abaixo.passar('trabalhando', 'terminou')
    const semDado = montar({ usado: null })
    semDado.c.definir({ ligado: true, limite: 40 })
    semDado.passar('trabalhando', 'terminou')
    expect([...abaixo.ev, ...semDado.ev]).toEqual([])
  })

  it('troca de modelo esperando: deixa para a reabertura', () => {
    const { c, ev, passar } = montar({ usado: 80, ocupado: true })
    c.definir({ ligado: true, limite: 40 })
    passar('trabalhando', 'terminou')
    expect(ev).toEqual([])
  })

  it('o main recusou (Claude saiu): solta a fila e avisa', async () => {
    const { c, ev, passar } = montar({ usado: 80, falha: true })
    c.definir({ ligado: true, limite: 40 })
    passar('trabalhando', 'terminou')
    await Promise.resolve()
    await Promise.resolve()
    // nao marcou o repasse: a proxima vez de verdade passa adiante
    expect(ev).toEqual(['compactar:a', 'desistiu:a'])
    expect(c.segurando('a')).toBe(false)
  })

  it('abrir o agente (parado sem ter trabalhado) nao e fim de vez', () => {
    const { c, ev, passar } = montar({ usado: 80 })
    c.definir({ ligado: true, limite: 40 })
    passar('parado')
    expect(ev).toEqual([])
  })
})
