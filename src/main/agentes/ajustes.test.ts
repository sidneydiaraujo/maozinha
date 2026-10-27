import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../shared/model'
import { FilaAjustes } from './ajustes'

function montar(aviso: AvisoAgente | null, opcoes: { aberto?: boolean; pronto?: boolean; claude?: boolean } = {}) {
  const reabertos: string[] = []
  const estado = { aviso, aberto: opcoes.aberto ?? true, pronto: opcoes.pronto ?? false, claude: opcoes.claude ?? true }
  const fila = new FilaAjustes({
    aberto: () => estado.aberto,
    aviso: () => estado.aviso,
    pronto: () => estado.pronto,
    temClaude: async () => estado.claude,
    reabrir: (id) => void reabertos.push(id),
  })
  return { fila, reabertos, estado }
}

describe('FilaAjustes (D49: reabre o agente, nunca digita /model)', () => {
  it('agente parado: reabre agora', async () => {
    const { fila, reabertos } = montar({ estado: 'parado' })
    expect(await fila.pedir('q1', { modelo: 'sonnet', esforco: 'high' })).toBe('agora')
    expect(reabertos).toEqual(['q1'])
  })

  it('recem-aberto, sem estado mas com a linha de status: reabre agora (o bug do aceite 0.4.0)', async () => {
    const { fila, reabertos } = montar(null, { pronto: true })
    expect(await fila.pedir('q1', { modelo: 'haiku' })).toBe('agora')
    expect(reabertos).toEqual(['q1'])
  })

  it('sem estado e sem linha de status (pergunta de confianca): espera ficar pronto', async () => {
    const { fila, reabertos, estado } = montar(null)
    expect(await fila.pedir('q1', { modelo: 'opus' })).toBe('quandoParar')
    expect(reabertos).toEqual([])
    estado.pronto = true
    await fila.aoPronto('q1')
    expect(reabertos).toEqual(['q1'])
    expect(fila.pendente('q1')).toBe(false)
  })

  it('trabalhando: espera; esperando voce nao reabre; ao parar reabre uma vez', async () => {
    const { fila, reabertos, estado } = montar({ estado: 'trabalhando' }, { pronto: true })
    expect(await fila.pedir('q1', { modelo: 'sonnet' })).toBe('quandoParar')
    expect(await fila.pedir('q1', { esforco: 'max' })).toBe('quandoParar')
    await fila.aoEstado('q1', { estado: 'esperando' })
    expect(reabertos).toEqual([])
    estado.aviso = { estado: 'terminou' }
    await fila.aoEstado('q1', { estado: 'terminou' })
    await fila.aoEstado('q1', { estado: 'parado' })
    expect(reabertos).toEqual(['q1'])
  })

  it('o Claude ja saiu (ficou o PowerShell): reabre, e o agente volta com o modelo novo', async () => {
    const { fila, reabertos } = montar({ estado: 'parado' }, { claude: false })
    expect(await fila.pedir('q1', { modelo: 'sonnet' })).toBe('agora')
    expect(reabertos).toEqual(['q1'])
  })

  it('terminal fechado: so na abertura, e nada fica esperando', async () => {
    const { fila, reabertos, estado } = montar({ estado: 'trabalhando' })
    await fila.pedir('q1', { modelo: 'sonnet' })
    estado.aberto = false
    expect(await fila.pedir('q1', { modelo: 'opus' })).toBe('naAbertura')
    expect(fila.pendente('q1')).toBe(false)
    expect(reabertos).toEqual([])
  })

  it('esquecer: o terminal fechou, nada reabre depois', async () => {
    const { fila, reabertos } = montar({ estado: 'trabalhando' })
    await fila.pedir('q1', { modelo: 'sonnet' })
    fila.esquecer('q1')
    await fila.aoEstado('q1', { estado: 'parado' })
    expect(reabertos).toEqual([])
  })
})
