import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoQuadros } from './servico'

const perfil = (id: string, provedor: Perfil['provedor'] = 'claude'): Perfil => ({
  id, provedor, nome: id, cor: '#000', configDir: `C:\\${id}`, ehPadrao: false, raizes: [],
})
const PERFIS = [perfil('principal'), perfil('pessoal'), perfil('cx:x', 'codex')]

function montar() {
  let estado: EstadoSalvo = {
    ...structuredClone(ESTADO_PADRAO),
    repos: [
      { id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'principal' },
      { id: 'r2', nome: 'api', caminho: 'C:\\api', perfilPadraoId: 'pessoal' },
    ],
  }
  const armazem: Armazem = { carregar: () => structuredClone(estado), salvar: (e) => void (estado = structuredClone(e)) }
  const fechados: string[] = []
  let n = 0
  const servico = new ServicoQuadros({
    armazem,
    perfis: {
      obter: (id) => {
        const p = PERFIS.find((q) => q.id === id)
        if (!p) throw new Error('Conta não encontrada')
        return p
      },
    },
    fecharTerminal: (id) => void fechados.push(id),
    novoId: () => `q${++n}`,
  })
  return { servico, fechados, estado: () => estado }
}

describe('ServicoQuadros', () => {
  it('duas contas na MESMA pasta: cada quadro fica na sua', () => {
    const { servico } = montar()
    const a = servico.criar('r1', 'agente', 'principal')
    const b = servico.criar('r1', 'agente', 'pessoal')
    expect([a.perfilId, b.perfilId]).toEqual(['principal', 'pessoal'])
    expect(servico.listar().every((q) => q.repoId === 'r1')).toBe(true)
  })

  it('a conta usada vira a sugestao da pasta e a ultima conta do app', () => {
    const { servico, estado } = montar()
    servico.criar('r1', 'agente', 'pessoal')
    expect(estado().repos.find((r) => r.id === 'r1')?.perfilPadraoId).toBe('pessoal')
    expect(estado().ultimoPerfilId).toBe('pessoal')
  })

  it('titulos numerados por prefixo na lousa toda: Terminal N e Claude N / Codex N', () => {
    const { servico } = montar()
    expect(servico.criar('r1', 'terminal', 'principal').titulo).toBe('Terminal 1')
    expect(servico.criar('r1', 'agente', 'principal').titulo).toBe('Claude 1')
    expect(servico.criar('r2', 'agente', 'pessoal').titulo).toBe('Claude 2')
    expect(servico.criar('r1', 'agente', 'cx:x').titulo).toBe('Codex 1')
    expect(servico.criar('r2', 'terminal', 'pessoal').titulo).toBe('Terminal 2')
  })

  it('apagar um quadro nao repete titulo no proximo', () => {
    const { servico } = montar()
    const um = servico.criar('r1', 'agente', 'principal')
    servico.criar('r1', 'agente', 'principal')
    servico.remover(um.id)
    expect(servico.criar('r1', 'agente', 'principal').titulo).toBe('Claude 3')
  })

  it('sem posicao: o primeiro em (40, 40), os outros a direita do mais a direita', () => {
    const { servico } = montar()
    const caixas = [0, 1, 2].map(() => servico.criar('r1', 'terminal', 'principal').caixa)
    expect(caixas.map((c) => [c.x, c.y])).toEqual([[40, 40], [704, 40], [1368, 40]])
    expect(caixas.every((c) => c.largura === 640 && c.altura === 420)).toBe(true)
  })

  it('com posicao: o quadro nasce onde foi pedido', () => {
    const { servico } = montar()
    expect(servico.criar('r1', 'agente', 'pessoal', { x: -300, y: 900 }).caixa).toMatchObject({ x: -300, y: 900 })
  })

  it('pasta ou conta inexistente falham', () => {
    const { servico } = montar()
    expect(() => servico.criar('nada', 'terminal', 'principal')).toThrow('Repositório não encontrado')
    expect(() => servico.criar('r1', 'terminal', 'nada')).toThrow('Conta não encontrada')
  })

  it('remover fecha o terminal do quadro e apaga so ele', () => {
    const { servico, fechados, estado } = montar()
    const a = servico.criar('r1', 'terminal', 'principal')
    const b = servico.criar('r1', 'terminal', 'principal')
    servico.remover(a.id)
    expect(fechados).toEqual([a.id])
    expect(estado().quadros.map((q) => q.id)).toEqual([b.id])
    expect(() => servico.remover(a.id)).toThrow('Quadro não encontrado')
  })
})
