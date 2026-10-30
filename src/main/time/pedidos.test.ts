import { describe, expect, it } from 'vitest'
import type { AvisoPedidoColegas } from '../../shared/model'
import { ESPERA_RESPOSTA_MS, PedidosDeColegas, textoDaTarefa } from './pedidos'

function montar(falhaAoCriar = false) {
  const avisos: AvisoPedidoColegas[] = []
  const criados: string[] = []
  const relogios: Array<{ fn: () => void; ms: number; vivo: boolean }> = []
  let n = 0
  const p = new PedidosDeColegas({
    nome: () => 'Claude 1',
    avisarTela: (a) => void avisos.push(a),
    criar: async (_id, colegas) => {
      if (falhaAoCriar) throw new Error('não é um repositório git')
      criados.push(...colegas.map((c) => c.papel))
      return colegas.map((c) => c.papel)
    },
    adiar: (fn, ms) => {
      const r = { fn, ms, vivo: true }
      relogios.push(r)
      return () => (r.vivo = false)
    },
    novoId: () => `p${++n}`,
  })
  return { p, avisos, criados, relogios }
}

const DOIS = [
  { papel: 'Testador', tarefa: 'testar' },
  { papel: 'Revisor', tarefa: 'revisar' },
]

describe('textoDaTarefa', () => {
  it('diz de quem veio, numa linha so', () => {
    expect(textoDaTarefa('Claude 1', 'testar\r\no login')).toBe('Tarefa pedida por Claude 1 (colega do time no Mãozinha): testar o login')
  })
})

describe('PedidosDeColegas (A19)', () => {
  it('pergunta na tela e so cria com o aceite; a resposta conta ao agente quem nasceu', async () => {
    const { p, avisos, criados } = montar()
    const resposta = p.pedir('q1', DOIS)
    expect(avisos).toEqual([{ tipo: 'novo', pedido: { pedidoId: 'p1', quadroId: 'q1', nome: 'Claude 1', colegas: DOIS } }])
    expect(criados).toEqual([])
    await p.responder('p1', true)
    expect(criados).toEqual(['Testador', 'Revisor'])
    expect((await resposta).texto).toContain('criei 2 colega(s), Testador, Revisor')
    expect(avisos.at(-1)).toEqual({ tipo: 'encerrado', pedidoId: 'p1' })
  })

  it('recusa: nada criado; dois cliques no aceite criam uma vez so', async () => {
    const recusa = montar()
    const r1 = recusa.p.pedir('q1', DOIS)
    await recusa.p.responder('p1', false)
    expect((await r1).texto).toContain('recusou')
    expect(recusa.criados).toEqual([])

    const duplo = montar()
    void duplo.p.pedir('q1', DOIS)
    await Promise.all([duplo.p.responder('p1', true), duplo.p.responder('p1', true)])
    expect(duplo.criados).toEqual(['Testador', 'Revisor'])
  })

  it('sem resposta em 5 minutos: nada criado, e o aviso some da tela', async () => {
    const { p, avisos, criados, relogios } = montar()
    const r = p.pedir('q1', DOIS)
    expect(relogios[0]?.ms).toBe(ESPERA_RESPOSTA_MS)
    relogios[0]?.fn()
    expect((await r).texto).toContain('não respondeu')
    await p.responder('p1', true)
    expect(criados).toEqual([])
    expect(avisos.at(-1)).toEqual({ tipo: 'encerrado', pedidoId: 'p1' })
  })

  it('um pedido aberto por agente; o agente fechou: o pedido acaba', async () => {
    const { p } = montar()
    const primeiro = p.pedir('q1', DOIS)
    expect((await p.pedir('q1', DOIS)).erro).toBe(true)
    p.esquecer('q1')
    expect((await primeiro).texto).toContain('fechado')
  })

  it('a criacao falhou: o agente fica sabendo o motivo', async () => {
    const { p } = montar(true)
    const r = p.pedir('q1', DOIS)
    await p.responder('p1', true)
    expect(await r).toEqual({ texto: 'Não deu para criar os colegas: não é um repositório git', erro: true })
  })
})
