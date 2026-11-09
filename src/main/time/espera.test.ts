import { describe, expect, it } from 'vitest'
import { ESPERA_COLEGAS_MS, EsperaDeColegas } from './espera'

function montar() {
  const relogios: Array<{ fn: () => void; ms: number; vivo: boolean }> = []
  const e = new EsperaDeColegas({
    nome: (id) => ({ c1: 'Pesquisador', c2: 'Redator' })[id] ?? id,
    adiar: (fn, ms) => {
      const r = { fn, ms, vivo: true }
      relogios.push(r)
      return () => (r.vivo = false)
    },
  })
  return { e, relogios }
}

/** A tarefa digitada, o colega trabalha e para com a mensagem. */
function fazTarefa(e: EsperaDeColegas, id: string, mensagem?: string): void {
  e.aoDigitar(id, 'repasse')
  e.aoEstado(id, { estado: 'trabalhando' })
  e.aoEstado(id, { estado: 'terminou', mensagem })
}

describe('EsperaDeColegas (A21)', () => {
  it('volta quando todos terminam, com a ultima mensagem de cada um', async () => {
    const { e, relogios } = montar()
    e.registrar('a1', ['c1', 'c2'])
    const r = e.esperar('a1')
    fazTarefa(e, 'c1', 'salvei pesquisa.md')
    fazTarefa(e, 'c2')
    const { texto } = await r
    expect(texto).toContain('Todos os colegas acabaram')
    expect(texto).toContain('- Pesquisador: terminou. Última mensagem: salvei pesquisa.md')
    expect(texto).toContain('- Redator: terminou')
    expect(relogios[0]?.vivo).toBe(false)
  })

  it('a resposta a apresentacao do time nao conta: so o fim da tarefa', async () => {
    const { e } = montar()
    e.registrar('a1', ['c1'])
    e.aoDigitar('c1', 'apresentacao')
    e.aoEstado('c1', { estado: 'trabalhando' })
    e.aoEstado('c1', { estado: 'terminou' })
    let pronto = false
    const r = e.esperar('a1').then((x) => ((pronto = true), x))
    await Promise.resolve()
    expect(pronto).toBe(false)
    fazTarefa(e, 'c1', 'feito')
    expect((await r).texto).toContain('Pesquisador: terminou')
  })

  it('no fim do prazo, diz quem ainda trabalha e pede para chamar de novo', async () => {
    const { e, relogios } = montar()
    e.registrar('a1', ['c1', 'c2'])
    const r = e.esperar('a1')
    expect(relogios[0]?.ms).toBe(ESPERA_COLEGAS_MS)
    fazTarefa(e, 'c1')
    e.aoDigitar('c2', 'repasse')
    e.aoEstado('c2', { estado: 'esperando', motivo: 'permissao' })
    relogios[0]?.fn()
    const { texto } = await r
    expect(texto).toContain('chame esperar_colegas de novo')
    expect(texto).toContain('- Redator: esperando o usuário responder no quadro dele')
    // a segunda chamada ainda espera o Redator
    const r2 = e.esperar('a1')
    e.aoEstado('c2', { estado: 'trabalhando' })
    e.aoEstado('c2', { estado: 'parado' })
    expect((await r2).texto).toContain('Todos os colegas acabaram')
  })

  it('colega fechado conta como acabado; depois de responder, o grupo sai', async () => {
    const { e } = montar()
    e.registrar('a1', ['c1'])
    const r = e.esperar('a1')
    e.esquecer('c1')
    expect((await r).texto).toContain('o quadro foi fechado antes de terminar')
    expect((await e.esperar('a1')).texto).toContain('Nenhum colega')
  })

  it('ocupado do registro ate terminar; terminou ou desconhecido fica livre para outro pedido', () => {
    const { e } = montar()
    expect(e.ocupado('c1')).toBe(false)
    e.registrar('a1', ['c1'])
    expect(e.ocupado('c1')).toBe(true)
    e.aoDigitar('c1', 'repasse')
    e.aoEstado('c1', { estado: 'trabalhando' })
    expect(e.ocupado('c1')).toBe(true)
    e.aoEstado('c1', { estado: 'terminou' })
    expect(e.ocupado('c1')).toBe(false)
  })

  it('quem pediu fechou: o grupo dele acaba', async () => {
    const { e } = montar()
    e.registrar('a1', ['c1'])
    e.esquecer('a1')
    expect((await e.esperar('a1')).texto).toContain('Nenhum colega')
  })
})
