import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil, Repo } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoQuadros } from '../quadros/servico'
import { criarColega, separarEmCopia, type DepsColega } from './colega'
import { ServicoTime } from './servico'

const perfil = (id: string, provedor: Perfil['provedor'] = 'claude'): Perfil => ({
  id, provedor, nome: id, cor: '#888888', configDir: `C:\\${id}`, ehPadrao: false, raizes: [],
})
const PERFIS = [perfil('pessoal'), perfil('gpt', 'codex')]
const obter = (id: string): Perfil => {
  const p = PERFIS.find((q) => q.id === id)
  if (!p) throw new Error('Conta não encontrada')
  return p
}

/** Servicos de verdade sobre um estado na memoria; a copia (git) e falsa e pode recusar. */
function montar(recusaCopia?: string) {
  let estado: EstadoSalvo = {
    ...structuredClone(ESTADO_PADRAO),
    repos: [{ id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'pessoal' }],
  }
  const armazem: Armazem = { carregar: () => structuredClone(estado), salvar: (e) => void (estado = structuredClone(e)) }
  let n = 0
  const novoId = (): string => `id${++n}`
  const quadros = new ServicoQuadros({
    armazem,
    perfis: { obter },
    fecharTerminal: () => {},
    novoId,
    novaSessao: () => `s${n}`,
    copiarSessao: () => true,
    esperar: async () => {},
    copias: {
      criar: async (origem: Repo, _titulo: string, usados: string[]) => {
        if (recusaCopia) throw new Error(recusaCopia)
        const apelido = `c${usados.length + 1}`
        return { caminho: `${origem.caminho}.copias\\${apelido}`, copia: { origemId: origem.id, branch: `lousa/${apelido}`, apelido } }
      },
      limpar: async () => ({ copia: 'apagada' as const }),
    },
  })
  const time = new ServicoTime({ armazem, perfis: { obter }, novoId })
  const deps: DepsColega = { armazem, quadros, time, ehClaude: (id) => obter(id).provedor === 'claude' }
  return { deps, quadros, estado: () => estado }
}

describe('criarColega (T28.3)', () => {
  it('nasce a direita, na mesma conta, numa copia da pasta original, com modelo e esforco, ja ligado', async () => {
    const { deps, quadros, estado } = montar()
    const origem = quadros.criar('app', 'agente', 'pessoal', { x: 100, y: 50 })
    quadros.ajustar(origem.id, { modelo: 'opus', esforco: 'high' })
    const { quadro, repo, ligacao } = await criarColega(deps, origem.id)
    expect(repo?.copia).toMatchObject({ origemId: 'app', branch: 'lousa/c1' })
    expect(quadro).toMatchObject({ repoId: repo?.id, perfilId: 'pessoal', tipo: 'agente', modelo: 'opus', esforco: 'high' })
    expect(quadro.caixa.x).toBe(100 + origem.caixa.largura + 40)
    expect(ligacao).toMatchObject({ de: origem.id, para: quadro.id, modo: 'automatico' })
    expect(estado().ligacoes).toEqual([ligacao])
  })

  it('colega de quem ja esta numa copia sai da pasta original, nao da copia', async () => {
    const { deps, quadros } = montar()
    const primeiro = quadros.criar('app', 'agente', 'pessoal')
    const segundo = await criarColega(deps, primeiro.id)
    const terceiro = await criarColega(deps, segundo.quadro.id, { posicao: { x: 5, y: 900 } })
    expect(terceiro.repo?.copia?.origemId).toBe('app')
    expect(terceiro.quadro.caixa).toMatchObject({ x: 5, y: 900 })
  })

  it('pasta sem git: o colega fica na mesma pasta', async () => {
    const { deps, quadros } = montar('Esta pasta não é um repositório git')
    const origem = quadros.criar('app', 'agente', 'pessoal')
    const { quadro, repo } = await criarColega(deps, origem.id)
    expect(repo).toBeNull()
    expect(quadro.repoId).toBe('app')
  })

  it('outro erro do git sobe; terminal e Codex nao tem colega', async () => {
    const { deps, quadros } = montar('O git não criou a cópia: disco cheio')
    const origem = quadros.criar('app', 'agente', 'pessoal')
    await expect(criarColega(deps, origem.id)).rejects.toThrow('disco cheio')
    const terminal = quadros.criar('app', 'terminal', 'pessoal')
    await expect(criarColega(deps, terminal.id)).rejects.toThrow('Só agentes Claude')
    const codex = quadros.criar('app', 'agente', 'gpt')
    await expect(criarColega(deps, codex.id)).rejects.toThrow('Só agentes Claude')
  })
})

describe('separarEmCopia (T28.3)', () => {
  it('linha na mesma pasta vira linha para um colega numa copia; o quadro antigo fica', async () => {
    const { deps, quadros, estado } = montar()
    const a = quadros.criar('app', 'agente', 'pessoal')
    const b = quadros.criar('app', 'agente', 'pessoal')
    const antiga = deps.time.ligar(a.id, b.id)
    const { quadro, ligacao } = await separarEmCopia(deps, antiga.id)
    expect(estado().ligacoes).toEqual([ligacao])
    expect(ligacao).toMatchObject({ de: a.id, para: quadro.id })
    expect(estado().quadros.map((q) => q.id)).toContain(b.id)
  })

  it('pasta sem git: recusa e a linha antiga fica', async () => {
    const { deps, quadros, estado } = montar('Esta pasta não é um repositório git')
    const a = quadros.criar('app', 'agente', 'pessoal')
    const b = quadros.criar('app', 'agente', 'pessoal')
    const antiga = deps.time.ligar(a.id, b.id)
    await expect(separarEmCopia(deps, antiga.id)).rejects.toThrow('não é um repositório git')
    expect(estado().ligacoes).toEqual([antiga])
  })
})
