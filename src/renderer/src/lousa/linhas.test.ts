import { describe, expect, it } from 'vitest'
import type { EstadoTela, Ligacao, PerfilComConta, Quadro } from '../../../shared/model'
import { semQuadro } from './copia'
import { colegaLivre, comColega, comContaTrocada, comLigacao, montarArestas } from './linhas'

const conta = { logado: true, email: null, plano: null, erro: null }
const perfil = (id: string): PerfilComConta => ({
  id, provedor: 'claude', nome: id, cor: '#888888', configDir: `C:\\${id}`, ehPadrao: false, raizes: [], conta,
})
const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, repoId: string, perfilId = 'pessoal'): Quadro => ({
  id, repoId, perfilId, tipo: 'agente', titulo: id, caixa,
})
const linha = (de: string, para: string): Ligacao => ({ id: `${de}-${para}`, de, para, modo: 'automatico' })

function estado(quadros: Quadro[], ligacoes: Ligacao[]): EstadoTela {
  return {
    perfis: [perfil('pessoal'), perfil('empresa')],
    repos: [
      { id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'pessoal' },
      { id: 'site', nome: 'site', caminho: 'C:\\site', perfilPadraoId: 'pessoal' },
    ],
    quadros,
    viewport: { x: 0, y: 0, zoom: 1 },
    ligacoes,
  }
}

describe('montarArestas', () => {
  it('cada linha vira aresta da bolinha de saida para a de entrada', () => {
    const [aresta] = montarArestas(estado([agente('a', 'app'), agente('b', 'site')], [linha('a', 'b')]))
    expect(aresta).toMatchObject({ id: 'a-b', type: 'time', source: 'a', target: 'b', sourceHandle: 'saida', targetHandle: 'entrada' })
    expect(aresta?.data).toMatchObject({ cor: 1, mesmaPasta: false })
  })

  it('o mesmo time tem uma cor; outro time, a seguinte; mesma pasta e marcada', () => {
    const quadros = ['a', 'b', 'c', 'x', 'y'].map((id) => agente(id, id === 'y' ? 'site' : 'app'))
    const arestas = montarArestas(estado(quadros, [linha('a', 'b'), linha('c', 'b'), linha('x', 'y')]))
    expect(arestas.map((a) => [a.id, a.data?.cor, a.data?.mesmaPasta])).toEqual([
      ['a-b', 1, true],
      ['c-b', 1, true],
      ['x-y', 2, false],
    ])
  })
})

describe('linhas quando o quadro muda', () => {
  it('fechar o quadro tira as linhas dele', () => {
    const e = estado([agente('a', 'app'), agente('b', 'app'), agente('c', 'app')], [linha('a', 'b'), linha('b', 'c')])
    expect(semQuadro(e, 'c', { copia: 'nenhuma' }).ligacoes).toEqual([linha('a', 'b')])
  })

  it('trocar para outra conta em outro repo tira a linha; no mesmo repo fica', () => {
    const e = estado([agente('a', 'app'), agente('b', 'app'), agente('c', 'site')], [linha('a', 'b'), linha('b', 'c')])
    const depois = comContaTrocada(e, agente('c', 'site', 'empresa'))
    expect(depois.ligacoes).toEqual([linha('a', 'b')])
    expect(comContaTrocada(e, agente('b', 'app', 'empresa')).ligacoes).toEqual([linha('a', 'b')])
  })

  it('comLigacao acrescenta, troca e tira', () => {
    const e = estado([agente('a', 'app'), agente('b', 'app')], [])
    const um = comLigacao(e, 'a-b', linha('a', 'b'))
    expect(um.ligacoes).toEqual([linha('a', 'b')])
    const pausada = comLigacao(um, 'a-b', { ...linha('a', 'b'), pausada: true })
    expect(pausada.ligacoes?.[0]?.pausada).toBe(true)
    expect(comLigacao(pausada, 'a-b', null).ligacoes).toEqual([])
  })
})

describe('comColega (T28.3)', () => {
  it('quadro, copia nova e linha entram juntos; pasta repetida nao duplica', () => {
    const e = estado([agente('a', 'app')], [])
    const copia = { id: 'c1', nome: 'app ⑂ c1', caminho: 'C:\\app.copias\\c1', perfilPadraoId: 'pessoal' }
    const depois = comColega(e, { quadro: agente('b', 'c1'), repo: copia, ligacao: linha('a', 'b') })
    expect(depois.quadros.map((q) => q.id)).toEqual(['a', 'b'])
    expect(depois.repos.map((r) => r.id)).toEqual(['app', 'site', 'c1'])
    expect(depois.ligacoes).toEqual([linha('a', 'b')])
    const mesmaPasta = comColega(e, { quadro: agente('b', 'app'), repo: null, ligacao: linha('a', 'b') })
    expect(mesmaPasta.repos).toHaveLength(2)
  })

  it('colega reaproveitado (09/11): o quadro troca de papel e a linha fica marcada, sem duplicar', () => {
    const e = estado([agente('a', 'app'), agente('b', 'app')], [linha('a', 'b')])
    const pedida = { ...linha('a', 'b'), pedida: true }
    const depois = comColega(e, { quadro: { ...agente('b', 'app'), papel: 'Revisor' }, repo: null, ligacao: pedida })
    expect(depois.quadros.map((q) => [q.id, q.papel])).toEqual([['a', undefined], ['b', 'Revisor']])
    expect(depois.ligacoes).toEqual([pedida])
  })
})

describe('colegaLivre (09/11)', () => {
  const [pedida] = montarArestas(estado([agente('a', 'app'), agente('b', 'app')], [{ ...linha('a', 'b'), pedida: true }]))
  const [dormindo] = montarArestas(estado([agente('a', 'app'), { ...agente('b', 'app'), dormindo: true }], [{ ...linha('a', 'b'), pedida: true }]))
  const [feitaPeloUsuario] = montarArestas(estado([agente('a', 'app'), agente('b', 'app')], [linha('a', 'b')]))

  it('colega pedido que terminou ou dorme: excluir', () => {
    expect(colegaLivre(pedida?.data, 'terminou')).toBe(true)
    expect(colegaLivre(dormindo?.data, undefined)).toBe(true)
  })

  it('trabalhando, esperando ou parado (recem-aberto, antes da tarefa): nao', () => {
    for (const estadoDoColega of ['trabalhando', 'esperando', 'parado', undefined] as const) {
      expect(colegaLivre(pedida?.data, estadoDoColega)).toBe(false)
    }
  })

  it('linha feita pelo usuario nunca oferece excluir', () => {
    expect(colegaLivre(feitaPeloUsuario?.data, 'terminou')).toBe(false)
  })
})
