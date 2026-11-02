import { describe, expect, it } from 'vitest'
import type { AvisoAgente, Ligacao, Quadro, Repo } from '../../../shared/model'
import { aplicarAviso, marcarVisto, type MapaAtencao } from '../lousa/atencao'
import { filaDeProntos, haQuanto, textoDosProntos } from './prontos'

const quadro = (id: string, repoId = 'app', papel?: string): Quadro => ({
  id,
  repoId,
  perfilId: 'p',
  tipo: 'agente',
  titulo: `Claude ${id}`,
  caixa: { x: 0, y: 0, largura: 640, altura: 420 },
  ...(papel ? { papel } : {}),
})
const repos: Repo[] = [
  { id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'p' },
  { id: 'site', nome: 'site', caminho: 'C:\\site', perfilPadraoId: 'p' },
  {
    id: 'c1',
    nome: 'app ⑂ c1',
    caminho: 'C:\\app.copias\\c1',
    perfilPadraoId: 'p',
    copia: { origemId: 'app', branch: 'lousa/c1', apelido: 'c1' },
  },
]
const linha = (de: string, para: string): Ligacao => ({
  id: `${de}-${para}`,
  de,
  para,
  modo: 'automatico',
})
const avisos = (lista: Array<[string, AvisoAgente['estado'], number]>): MapaAtencao =>
  lista.reduce<MapaAtencao>((m, [id, estado, quando]) => aplicarAviso(m, id, { estado }, quando), new Map())

describe('filaDeProntos (A26)', () => {
  it('quem terminou e nao foi visto, do mais antigo ao mais novo, com o projeto', () => {
    const quadros = [quadro('a'), quadro('b', 'site', 'Revisor'), quadro('c'), quadro('d')]
    const mapa = avisos([
      ['a', 'terminou', 300],
      ['b', 'terminou', 100],
      ['c', 'esperando', 50],
      ['d', 'trabalhando', 10],
    ])
    expect(filaDeProntos(mapa, { quadros, repos, ligacoes: [] })).toEqual([
      {
        quadroId: 'b',
        nome: 'Revisor',
        projeto: 'site',
        colegas: 0,
        quando: 100,
      },
      {
        quadroId: 'a',
        nome: 'Claude a',
        projeto: 'app',
        colegas: 0,
        quando: 300,
      },
    ])
    expect(
      filaDeProntos(marcarVisto(mapa, 'b'), {
        quadros,
        repos,
        ligacoes: [],
      }).map((i) => i.quadroId),
    ).toEqual(['a'])
  })

  it('time: so o lider, e so quando ninguem do time trabalha; a copia mostra a pasta original', () => {
    const quadros = [quadro('lider'), quadro('dev', 'c1'), quadro('qa', 'c1')]
    const ligacoes = [linha('lider', 'dev'), linha('dev', 'qa')]
    const trabalhando = avisos([
      ['lider', 'terminou', 1],
      ['dev', 'terminou', 2],
      ['qa', 'trabalhando', 3],
    ])
    expect(filaDeProntos(trabalhando, { quadros, repos, ligacoes })).toEqual([])
    const fim = aplicarAviso(trabalhando, 'qa', { estado: 'terminou' }, 4)
    expect(filaDeProntos(fim, { quadros, repos, ligacoes })).toEqual([
      {
        quadroId: 'lider',
        nome: 'Claude lider',
        projeto: 'app',
        colegas: 2,
        quando: 1,
      },
    ])
    const soOMembro = avisos([['dev', 'terminou', 5]])
    expect(filaDeProntos(soOMembro, { quadros, repos, ligacoes })).toEqual([])
  })

  it('linha para um quadro que saiu da lousa nao conta; quadro sem aviso nao entra', () => {
    const mapa = avisos([['a', 'terminou', 1]])
    const itens = filaDeProntos(mapa, {
      quadros: [quadro('a'), quadro('b')],
      repos,
      ligacoes: [linha('sumiu', 'a')],
    })
    expect(itens.map((i) => i.quadroId)).toEqual(['a'])
  })
})

describe('haQuanto e textoDosProntos', () => {
  it('tempo curto e plural', () => {
    expect(haQuanto(0, 30_000)).toBe('agora')
    expect(haQuanto(0, 5 * 60_000)).toBe('há 5 min')
    expect(haQuanto(0, 125 * 60_000)).toBe('há 2 h')
    expect(haQuanto(10, 0)).toBe('agora')
    expect(textoDosProntos(1)).toBe('1 pronto')
    expect(textoDosProntos(3)).toBe('3 prontos')
  })
})
