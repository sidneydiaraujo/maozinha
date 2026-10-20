import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../shared/model'
import { comandosDoAjuste, FilaAjustes } from './ajustes'

function montar(aviso: AvisoAgente | null, aberto = true) {
  const escrito: string[] = []
  const estado = { aviso, aberto }
  const fila = new FilaAjustes({
    aberto: () => estado.aberto,
    aviso: () => estado.aviso,
    escrever: (_id, dados) => escrito.push(dados),
    esperar: async () => {},
  })
  return { fila, escrito, estado }
}

describe('comandosDoAjuste', () => {
  it('modelo antes do esforco; so o que veio', () => {
    expect(comandosDoAjuste({ modelo: 'sonnet', esforco: 'high' })).toEqual(['/model sonnet', '/effort high'])
    expect(comandosDoAjuste({ esforco: 'max' })).toEqual(['/effort max'])
    expect(comandosDoAjuste({})).toEqual([])
  })

  it('valor fora da lista nao vira texto', () => {
    expect(comandosDoAjuste({ modelo: 'sonnet; rm' as never, esforco: 'turbo' as never })).toEqual([])
  })
})

describe('FilaAjustes', () => {
  it('agente parado: digita agora, cada comando com o seu Enter', async () => {
    const { fila, escrito } = montar({ estado: 'parado' })
    expect(await fila.pedir('q1', { modelo: 'sonnet', esforco: 'high' })).toBe('agora')
    expect(escrito).toEqual(['/model sonnet', '\r', '/effort high', '\r'])
  })

  it('trabalhando: espera; quando parar, digita o mais novo de cada campo', async () => {
    const { fila, escrito } = montar({ estado: 'trabalhando' })
    expect(await fila.pedir('q1', { modelo: 'opus' })).toBe('quandoParar')
    expect(await fila.pedir('q1', { modelo: 'haiku', esforco: 'low' })).toBe('quandoParar')
    await fila.aoEstado('q1', { estado: 'esperando' })
    expect(escrito).toEqual([])
    await fila.aoEstado('q1', { estado: 'terminou' })
    expect(escrito).toEqual(['/model haiku', '\r', '/effort low', '\r'])
    // ja foi: o proximo "parado" nao repete
    await fila.aoEstado('q1', { estado: 'parado' })
    expect(escrito).toHaveLength(4)
  })

  it('sem estado ainda conta como ocupado (nao digita no escuro)', async () => {
    const { fila, escrito } = montar(null)
    expect(await fila.pedir('q1', { esforco: 'max' })).toBe('quandoParar')
    expect(escrito).toEqual([])
  })

  it('terminal fechado: vale na abertura e nao fica na fila', async () => {
    const { fila, escrito } = montar({ estado: 'parado' }, false)
    expect(await fila.pedir('q1', { modelo: 'opus' })).toBe('naAbertura')
    await fila.aoEstado('q1', { estado: 'parado' })
    expect(escrito).toEqual([])
  })

  it('esquecer: o terminal fechou com pedido na fila', async () => {
    const { fila, escrito } = montar({ estado: 'trabalhando' })
    await fila.pedir('q1', { modelo: 'opus' })
    fila.esquecer('q1')
    await fila.aoEstado('q1', { estado: 'parado' })
    expect(escrito).toEqual([])
  })
})
