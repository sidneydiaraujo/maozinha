import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../shared/model'
import { Hibernacao, podeDormir, QUIETO_PARA_DORMIR_MS } from './hibernar'

const H = QUIETO_PARA_DORMIR_MS

describe('podeDormir (R3.13)', () => {
  const base = { estado: 'terminou' as const, ligado: false, ocupado: false, quietoMs: H }

  it('terminou ou parado ha 2 h, solto e sem nada pendente: dorme', () => {
    expect(podeDormir(base)).toBe(true)
    expect(podeDormir({ ...base, estado: 'parado' })).toBe(true)
  })

  it('trabalhando, esperando voce, com erro ou sem estado: nunca', () => {
    for (const estado of ['trabalhando', 'esperando', 'erro', null] as const) expect(podeDormir({ ...base, estado })).toBe(false)
  })

  it('no time, ocupado ou quieto ha menos de 2 h: nao', () => {
    expect(podeDormir({ ...base, ligado: true })).toBe(false)
    expect(podeDormir({ ...base, ocupado: true })).toBe(false)
    expect(podeDormir({ ...base, quietoMs: H - 1 })).toBe(false)
  })
})

describe('Hibernacao (R3.13)', () => {
  function montar(avisos: Record<string, AvisoAgente | null>, opcoes: { ligado?: string[]; semClaude?: string[] } = {}) {
    let agora = 0
    const dormiram: string[] = []
    const h = new Hibernacao({
      agentesAbertos: () => Object.keys(avisos).map((id) => ({ id, ligado: opcoes.ligado?.includes(id) ?? false })),
      aviso: (id) => avisos[id] ?? null,
      ocupado: () => false,
      temClaude: async (id) => !opcoes.semClaude?.includes(id),
      agora: () => agora,
      adormecer: (id) => {
        dormiram.push(id)
        delete avisos[id] // o terminal fechou: sai dos abertos
      },
    })
    return { h, dormiram, passar: (ms: number) => (agora += ms) }
  }

  it('comeca a contar na primeira passada e dorme 2 h depois, uma vez so', async () => {
    const { h, dormiram, passar } = montar({ a: { estado: 'terminou' } })
    expect(await h.varrer()).toEqual([])
    passar(H)
    expect(await h.varrer()).toEqual(['a'])
    passar(H)
    expect(await h.varrer()).toEqual([])
    expect(dormiram).toEqual(['a'])
  })

  it('estado novo do agente (outro objeto de aviso) recomeca a contar', async () => {
    const avisos: Record<string, AvisoAgente | null> = { a: { estado: 'terminou' } }
    const { h, passar } = montar(avisos)
    await h.varrer()
    passar(H - 10)
    avisos.a = { estado: 'terminou' } // trabalhou e terminou de novo
    await h.varrer()
    passar(20)
    expect(await h.varrer()).toEqual([])
  })

  it('digitar recomeca a contar', async () => {
    const { h, passar } = montar({ a: { estado: 'parado' } })
    await h.varrer()
    passar(H - 10)
    h.mexeu('a')
    passar(20)
    expect(await h.varrer()).toEqual([])
  })

  it('no time ou sem o claude.exe rodando: fica acordado', async () => {
    const { h, passar } = montar({ a: { estado: 'terminou' }, b: { estado: 'terminou' } }, { ligado: ['a'], semClaude: ['b'] })
    await h.varrer()
    passar(H)
    expect(await h.varrer()).toEqual([])
  })
})
