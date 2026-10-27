import { describe, expect, it } from 'vitest'
import type { AvisoAgente, Quadro } from '../../shared/model'
import { compactar, type DepsCompactar } from './compactar'

function deps(
  tipo: Quadro['tipo'],
  aviso: AvisoAgente | null,
  { aberto = true, pronto = false, claude = true } = {},
): DepsCompactar & { escrito: string[] } {
  const escrito: string[] = []
  return {
    escrito,
    quadro: (id): Quadro => ({ id, repoId: 'r', perfilId: 'p', tipo, titulo: 'x', caixa: { x: 0, y: 0, largura: 400, altura: 300 } }),
    aberto: () => aberto,
    aviso: () => aviso,
    pronto: () => pronto,
    temClaude: async () => claude,
    escrever: (_id, dados) => escrito.push(dados),
    esperar: async () => {},
  }
}

describe('compactar', () => {
  it('agente parado: /compact e depois o Enter, separados', async () => {
    const d = deps('agente', { estado: 'parado' })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(['/compact', '\r'])
  })

  it('agente que terminou tambem pode', async () => {
    const d = deps('agente', { estado: 'terminou' })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(['/compact', '\r'])
  })

  it('recem-aberto, sem estado mas com a linha de status: pode (D49)', async () => {
    const d = deps('agente', null, { pronto: true })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(['/compact', '\r'])
  })

  it('parado mas o Claude ja saiu: recusa, nada cai no PowerShell (D39)', async () => {
    const d = deps('agente', { estado: 'parado' }, { claude: false })
    await expect(compactar(d, 'q1')).rejects.toThrow('não está rodando')
    expect(d.escrito).toEqual([])
  })

  it('trabalhando, esperando ou sem estado e sem linha de status: recusa e nao escreve nada', async () => {
    for (const aviso of [{ estado: 'trabalhando' }, { estado: 'esperando' }, null] as const) {
      const d = deps('agente', aviso)
      await expect(compactar(d, 'q1')).rejects.toThrow('Espere o agente parar')
      expect(d.escrito).toEqual([])
    }
  })

  it('terminal comum ou terminal fechado: recusa', async () => {
    await expect(compactar(deps('terminal', { estado: 'parado' }), 'q1')).rejects.toThrow('Só um agente')
    await expect(compactar(deps('agente', { estado: 'parado' }, { aberto: false }), 'q1')).rejects.toThrow('não está aberto')
  })
})
