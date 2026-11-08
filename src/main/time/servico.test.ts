import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil, Quadro } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { dadosDoTime, semLinhasInvalidas, ServicoTime } from './servico'

function armazemNaMemoria(inicial: Partial<EstadoSalvo> = {}): Armazem & { estado: EstadoSalvo } {
  const a = {
    estado: { ...structuredClone(ESTADO_PADRAO), ...inicial },
    carregar: () => structuredClone(a.estado),
    salvar: (e: EstadoSalvo) => {
      a.estado = structuredClone(e)
    },
  }
  return a
}

const perfil = (id: string, provedor: Perfil['provedor'] = 'claude'): Perfil => ({
  id, provedor, nome: id, cor: '#888888', configDir: `C:\\${id}`, ehPadrao: false, raizes: [],
})
const PERFIS: Record<string, Perfil> = { pessoal: perfil('pessoal'), empresa: perfil('empresa') }
const obter = (id: string): Perfil => {
  const p = PERFIS[id]
  if (!p) throw new Error('Conta não encontrada')
  return p
}

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, repoId: string, perfilId = 'pessoal'): Quadro => ({
  id, repoId, perfilId, tipo: 'agente', titulo: id, caixa,
})
const repos = [
  { id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'pessoal' },
  { id: 'site', nome: 'site', caminho: 'C:\\site', perfilPadraoId: 'empresa' },
]

let n = 0
const novoId = (): string => `l${++n}`

function servico(armazem: Armazem): ServicoTime {
  return new ServicoTime({ armazem, perfis: { obter }, novoId })
}

describe('ServicoTime', () => {
  it('liga no automatico e guarda; recusa com o motivo em portugues', () => {
    const armazem = armazemNaMemoria({ repos, quadros: [agente('a', 'app'), agente('b', 'site', 'empresa')] })
    expect(() => servico(armazem).ligar('a', 'b')).toThrow('Contas diferentes só se ligam no mesmo repositório')
    armazem.estado.quadros.push(agente('c', 'app'))
    const linha = servico(armazem).ligar('a', 'c')
    expect(linha).toMatchObject({ de: 'a', para: 'c', modo: 'automatico' })
    expect(armazem.estado.ligacoes).toEqual([linha])
    expect(() => servico(armazem).ligar('c', 'a')).toThrow('já estão ligados')
  })

  it('ajusta modo e pausa; retomar tira o campo; linha que nao existe lanca', () => {
    const armazem = armazemNaMemoria({ repos, quadros: [agente('a', 'app'), agente('b', 'app')] })
    const s = servico(armazem)
    const { id } = s.ligar('a', 'b')
    expect(s.ajustar(id, { modo: 'perguntar', pausada: true })).toMatchObject({ modo: 'perguntar', pausada: true })
    expect(s.ajustar(id, { pausada: false })).not.toHaveProperty('pausada')
    expect(() => s.ajustar('nada', { modo: 'automatico' })).toThrow('Linha não encontrada')
  })

  it('desligar tira so a linha, e de novo nao e erro', () => {
    const armazem = armazemNaMemoria({ repos, quadros: [agente('a', 'app'), agente('b', 'app')] })
    const s = servico(armazem)
    const { id } = s.ligar('a', 'b')
    s.desligar(id)
    s.desligar(id)
    expect(armazem.estado.ligacoes).toEqual([])
    expect(armazem.estado.quadros).toHaveLength(2)
  })
})

describe('semLinhasInvalidas', () => {
  it('tira a linha do quadro fechado e a de conta que sumiu', () => {
    const estado: EstadoSalvo = {
      ...structuredClone(ESTADO_PADRAO),
      repos,
      quadros: [agente('a', 'app'), agente('b', 'app'), agente('x', 'app', 'apagada')],
      ligacoes: [
        { id: '1', de: 'a', para: 'b', modo: 'automatico' },
        { id: '2', de: 'b', para: 'fechado', modo: 'automatico' },
        { id: '3', de: 'a', para: 'x', modo: 'automatico' },
      ],
    }
    expect(semLinhasInvalidas(estado, obter).ligacoes?.map((l) => l.id)).toEqual(['1'])
  })
})

describe('dadosDoTime (R4.20)', () => {
  it('sem linhas salvas vira lista vazia; conta apagada fica sem provedor', () => {
    const quadro = (id: string, perfilId: string): Quadro => ({ id, repoId: 'r', perfilId, tipo: 'agente', titulo: id, caixa: { x: 0, y: 0, largura: 1, altura: 1 } })
    const obter = (id: string): Perfil => {
      if (id === 'sumiu') throw new Error('Conta não encontrada')
      return { id, nome: id, provedor: 'claude' } as unknown as Perfil
    }
    const dados = dadosDoTime({ quadros: [quadro('a', 'pessoal'), quadro('b', 'sumiu')], repos: [] }, obter)
    expect(dados.ligacoes).toEqual([])
    expect(dados.provedores).toEqual({ pessoal: 'claude' })
  })
})
