import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../shared/model'
import { distribuirEstado, ORDEM_DO_ESTADO, type AoEstado, type OuvinteDoEstado } from './ordemDoEstado'

const aviso: AvisoAgente = { estado: 'terminou' }

function ouvintes(feito: string[], troca: Partial<Record<OuvinteDoEstado, AoEstado>> = {}) {
  const todos = {} as Record<OuvinteDoEstado, AoEstado>
  for (const nome of ORDEM_DO_ESTADO) todos[nome] = (id) => void feito.push(`${nome}:${id}`)
  return { ...todos, ...troca }
}

describe('ORDEM_DO_ESTADO (R4.19)', () => {
  const pos = (n: OuvinteDoEstado) => ORDEM_DO_ESTADO.indexOf(n)

  it('a tela vem primeiro e a fila do time por ultimo', () => {
    expect(ORDEM_DO_ESTADO[0]).toBe('tela')
    expect(ORDEM_DO_ESTADO.at(-1)).toBe('filaDoTime')
  })

  it('a troca de modelo vem antes de quem pergunta se ha troca pendente', () => {
    expect(pos('trocaDeModelo')).toBeLessThan(pos('compactarSozinho'))
    expect(pos('trocaDeModelo')).toBeLessThan(pos('filaDoTime'))
  })

  it('o repasse ve o fim da vez antes do /compact; a fila espera o /compact', () => {
    expect(pos('repasse')).toBeLessThan(pos('compactarSozinho'))
    expect(pos('compactarSozinho')).toBeLessThan(pos('filaDoTime'))
  })
})

describe('distribuirEstado (R4.19)', () => {
  it('chama todos, na ordem, com o mesmo aviso', () => {
    const feito: string[] = []
    distribuirEstado(ouvintes(feito), () => {})('q1', aviso)
    expect(feito).toEqual(ORDEM_DO_ESTADO.map((n) => `${n}:q1`))
  })

  it('quem lanca vira aviso e os seguintes ainda recebem', () => {
    const feito: string[] = []
    const falhas: string[] = []
    const ruim = (): void => {
      throw new Error('quebrou')
    }
    distribuirEstado(ouvintes(feito, { repasse: ruim }), (n, id) => falhas.push(`${n}:${id}`))('q1', aviso)
    expect(falhas).toEqual(['repasse:q1'])
    expect(feito).toHaveLength(ORDEM_DO_ESTADO.length - 1)
    expect(feito.at(-1)).toBe('filaDoTime:q1')
  })

  it('promessa rejeitada depois tambem vira aviso (antes ficava sem tratamento)', async () => {
    const falhas: string[] = []
    const rejeita = (): Promise<void> => Promise.reject(new Error('depois'))
    distribuirEstado(ouvintes([], { filaDoTime: rejeita }), (n) => falhas.push(n))('q1', aviso)
    await Promise.resolve()
    await Promise.resolve()
    expect(falhas).toEqual(['filaDoTime'])
  })
})
