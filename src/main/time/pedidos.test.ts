import { describe, expect, it } from 'vitest'
import type { AvisoPedidoColegas } from '../../shared/model'
import { CriacaoParcial, ESPERA_RESPOSTA_MS, PedidosDeColegas, TEXTO_PEDIDO_NA_TELA, textoDaTarefa } from './pedidos'

function montar(falhaAoCriar: boolean | 'parcial' = false) {
  const avisos: AvisoPedidoColegas[] = []
  const criados: string[] = []
  const relogios: Array<{ fn: () => void; ms: number; vivo: boolean }> = []
  let n = 0
  const p = new PedidosDeColegas({
    nome: () => 'Claude 1',
    avisarTela: (a) => void avisos.push(a),
    criar: async (_id, colegas, paralelo) => {
      if (falhaAoCriar === 'parcial') throw new CriacaoParcial(['Testador'], 'O git não criou a cópia: fatal: x')
      if (falhaAoCriar) throw new Error('não é um repositório git')
      criados.push(...colegas.map((c) => (paralelo ? `${c.papel}*` : c.papel)))
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
    expect(avisos).toEqual([{ tipo: 'novo', pedido: { pedidoId: 'p1', quadroId: 'q1', nome: 'Claude 1', colegas: DOIS, paralelo: false } }])
    expect(criados).toEqual([])
    await p.responder('p1', true)
    expect(criados).toEqual(['Testador', 'Revisor'])
    expect((await resposta).texto).toContain('criei 2 colega(s), Testador, Revisor')
    expect((await resposta).texto).toContain('mcp__maozinha__esperar_colegas')
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
    expect(p.temAberto('q1')).toBe(true)
    expect(p.temAberto('q2')).toBe(false)
    // A27: o segundo pedido ouve que o primeiro segue na tela, e nao para pedir de novo
    expect(await p.pedir('q1', DOIS)).toEqual({ texto: TEXTO_PEDIDO_NA_TELA, erro: true })
    expect(TEXTO_PEDIDO_NA_TELA).toContain('Não peça de novo')
    p.esquecer('q1')
    expect(p.temAberto('q1')).toBe(false)
    expect((await primeiro).texto).toContain('fechado')
  })

  it('a criacao falhou: o agente fica sabendo o motivo', async () => {
    const { p } = montar(true)
    const r = p.pedir('q1', DOIS)
    await p.responder('p1', true)
    expect(await r).toEqual({ texto: 'Não deu para criar os colegas: não é um repositório git', erro: true })
  })

  it('R1.3: falhou depois de um nascer: o agente sabe quem nasceu e por que o resto nao', async () => {
    const { p } = montar('parcial')
    const r = p.pedir('q1', DOIS)
    await p.responder('p1', true)
    const { texto, erro } = await r
    expect(erro).toBe(true)
    expect(texto).toContain('Testador')
    expect(texto).toContain('Os outros colegas pedidos não nasceram: O git não criou a cópia: fatal: x')
    expect(texto).not.toContain('Não deu para criar os colegas')
  })

  it('paralelo: a tela sabe, o aceite cria e manda esperar; a recusa e o prazo mandam seguir no mesmo terminal', async () => {
    const aceite = montar()
    const r = aceite.p.pedir('q1', DOIS, true)
    expect(aceite.avisos[0]).toMatchObject({ tipo: 'novo', pedido: { paralelo: true } })
    await aceite.p.responder('p1', true)
    expect(aceite.criados).toEqual(['Testador*', 'Revisor*'])
    const texto = (await r).texto
    expect(texto).toContain('na mesma pasta que você')
    expect(texto).toContain('Não rode estas tarefas em subagentes')

    const recusa = montar()
    const r2 = recusa.p.pedir('q1', DOIS, true)
    await recusa.p.responder('p1', false)
    expect((await r2).texto).toContain('preferiu seguir no mesmo terminal: rode estas tarefas com os seus subagentes')

    const prazo = montar()
    const r3 = prazo.p.pedir('q1', DOIS, true)
    prazo.relogios[0]?.fn()
    expect((await r3).texto).toContain('siga no mesmo terminal')
    expect(prazo.criados).toEqual([])
  })
})