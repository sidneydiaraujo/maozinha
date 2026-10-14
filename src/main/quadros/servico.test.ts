import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoQuadros } from './servico'

const perfil = (id: string, provedor: Perfil['provedor'] = 'claude'): Perfil => ({
  id, provedor, nome: id, cor: '#000', configDir: `C:\\${id}`, ehPadrao: false, raizes: [],
})
const PERFIS = [perfil('principal'), perfil('pessoal'), perfil('cx:x', 'codex')]
const caixa = { x: 0, y: 0, largura: 1, altura: 1 }

function montar() {
  let estado: EstadoSalvo = {
    ...structuredClone(ESTADO_PADRAO),
    repos: [
      { id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'principal', caixa },
      { id: 'r2', nome: 'api', caminho: 'C:\\api', perfilPadraoId: 'pessoal', caixa },
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
  it('sem conta informada usa a conta padrao do repo', () => {
    const { servico } = montar()
    expect(servico.criar('r1', 'agente').perfilId).toBe('principal')
    expect(servico.criar('r2', 'terminal').perfilId).toBe('pessoal')
  })

  it('duas contas no MESMO repo: cada quadro fica na sua', () => {
    const { servico } = montar()
    const a = servico.criar('r1', 'agente')
    const b = servico.criar('r1', 'agente', 'pessoal')
    expect([a.perfilId, b.perfilId]).toEqual(['principal', 'pessoal'])
    expect(servico.listar().every((q) => q.repoId === 'r1')).toBe(true)
  })

  it('titulos numerados por prefixo: Terminal N e Claude N / Codex N', () => {
    const { servico } = montar()
    expect(servico.criar('r1', 'terminal').titulo).toBe('Terminal 1')
    expect(servico.criar('r1', 'agente').titulo).toBe('Claude 1')
    expect(servico.criar('r1', 'agente', 'pessoal').titulo).toBe('Claude 2')
    expect(servico.criar('r1', 'agente', 'cx:x').titulo).toBe('Codex 1')
    expect(servico.criar('r1', 'terminal').titulo).toBe('Terminal 2')
  })

  it('apagar um quadro nao repete titulo no proximo', () => {
    const { servico } = montar()
    const um = servico.criar('r1', 'agente')
    servico.criar('r1', 'agente')
    servico.remover(um.id)
    expect(servico.criar('r1', 'agente').titulo).toBe('Claude 3')
  })

  it('grade de 2 colunas dentro da moldura, abaixo do cabecalho', () => {
    const { servico } = montar()
    const caixas = [0, 1, 2].map(() => servico.criar('r1', 'terminal').caixa)
    expect(caixas.map((c) => [c.x, c.y])).toEqual([[20, 68], [480, 68], [20, 368]])
    expect(caixas.every((c) => c.largura === 440 && c.altura === 280)).toBe(true)
  })

  it('repo ou conta inexistente falham', () => {
    const { servico } = montar()
    expect(() => servico.criar('nada', 'terminal')).toThrow('Repositório não encontrado')
    expect(() => servico.criar('r1', 'terminal', 'nada')).toThrow('Conta não encontrada')
  })

  it('remover fecha o terminal do quadro e apaga so ele', () => {
    const { servico, fechados, estado } = montar()
    const a = servico.criar('r1', 'terminal')
    const b = servico.criar('r1', 'terminal')
    servico.remover(a.id)
    expect(fechados).toEqual([a.id])
    expect(estado().quadros.map((q) => q.id)).toEqual([b.id])
    expect(() => servico.remover(a.id)).toThrow('Quadro não encontrado')
  })
})
