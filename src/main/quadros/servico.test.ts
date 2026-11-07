import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, FimDaCopia, Perfil, Repo } from '../../shared/model'
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
  const copias: string[] = []
  const limpezas: string[] = []
  const fim: { atual: FimDaCopia } = { atual: { copia: 'apagada' } }
  let n = 0
  let s = 0
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
    novaSessao: () => `s${++s}`,
    copiarSessao: (de, para, id) => copias.push(`${de} -> ${para}: ${id}`) > 0,
    esperar: async () => {},
    copias: {
      criar: async (origem: Repo, titulo: string, usados: string[]) => {
        const apelido = `${titulo.toLowerCase().replace(' ', '-')}${usados.length ? `-${usados.length + 1}` : ''}`
        return {
          caminho: `${origem.caminho}.copias\\${apelido}`,
          copia: { origemId: origem.id, branch: `lousa/${apelido}`, apelido },
        }
      },
      limpar: async (repo: Repo, caminhoOrigem?: string) => {
        limpezas.push(`${repo.id} (${caminhoOrigem ?? '?'})`)
        return fim.atual
      },
    },
  })
  return { servico, armazem, fechados, copias, limpezas, fim, estado: () => estado }
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

  it('apagar um quadro nao repete titulo no proximo', async () => {
    const { servico } = montar()
    const um = servico.criar('r1', 'agente', 'principal')
    servico.criar('r1', 'agente', 'principal')
    await servico.remover(um.id)
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

  it('remover fecha o terminal do quadro e apaga so ele', async () => {
    const { servico, fechados, estado, limpezas } = montar()
    const a = servico.criar('r1', 'terminal', 'principal')
    const b = servico.criar('r1', 'terminal', 'principal')
    expect(await servico.remover(a.id)).toEqual({ copia: 'nenhuma' })
    expect(fechados).toEqual([a.id])
    expect(estado().quadros.map((q) => q.id)).toEqual([b.id])
    expect(limpezas).toEqual([])
    // de novo (clique duplo no x): nada acontece e nao e erro
    expect(await servico.remover(a.id)).toEqual({ copia: 'nenhuma' })
    expect(fechados).toEqual([a.id])
    expect(estado().quadros.map((q) => q.id)).toEqual([b.id])
  })

  it('fechar um quadro ou trocar a conta tira as linhas do time que deixaram de valer (T28.1)', async () => {
    const { servico, armazem, estado } = montar()
    const a = servico.criar('r1', 'agente', 'principal')
    const b = servico.criar('r1', 'agente', 'principal')
    const c = servico.criar('r2', 'agente', 'principal')
    const linha = (id: string, de: string, para: string) => ({ id, de, para, modo: 'automatico' as const })
    armazem.salvar({ ...armazem.carregar(), ligacoes: [linha('ab', a.id, b.id), linha('bc', b.id, c.id)] })
    await servico.trocarConta(c.id, 'pessoal') // outra conta e outro repo: a linha bc cai
    expect(estado().ligacoes?.map((l) => l.id)).toEqual(['ab'])
    await servico.remover(a.id)
    expect(estado().ligacoes).toEqual([])
  })

  it('agente do Claude nasce com conversa propria; terminal e Codex nao', () => {
    const { servico } = montar()
    expect(servico.criar('r1', 'agente', 'principal').sessaoId).toBe('s1')
    expect(servico.criar('r1', 'terminal', 'principal').sessaoId).toBeUndefined()
    expect(servico.criar('r1', 'agente', 'cx:x').sessaoId).toBeUndefined()
  })

  it('comSessao da conversa a quadro antigo e guarda; nao troca a que ja existe', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'principal')
    expect(servico.comSessao(q.id).sessaoId).toBe('s1')
    const antigo = estado().quadros[0]
    if (antigo) delete antigo.sessaoId
    expect(servico.comSessao(q.id).sessaoId).toBe('s2')
    expect(estado().quadros[0]?.sessaoId).toBe('s2')
  })

  it('trocarConta: fecha o terminal, copia a conversa e muda so a conta', async () => {
    const { servico, fechados, copias, estado } = montar()
    const q = servico.criar('r1', 'agente', 'principal', { x: 5, y: 6 })
    const trocado = await servico.trocarConta(q.id, 'pessoal')
    expect(fechados).toEqual([q.id])
    expect(copias).toEqual(['C:\\principal -> C:\\pessoal: s1'])
    expect(trocado).toMatchObject({ id: q.id, repoId: 'r1', perfilId: 'pessoal', sessaoId: 's1' })
    expect(trocado.caixa).toMatchObject({ x: 5, y: 6 })
    expect(estado().repos.find((r) => r.id === 'r1')?.perfilPadraoId).toBe('pessoal')
  })

  it('trocarConta para a mesma conta nao faz nada; conta inexistente falha antes de fechar', async () => {
    const { servico, fechados } = montar()
    const q = servico.criar('r1', 'agente', 'principal')
    await servico.trocarConta(q.id, 'principal')
    await expect(servico.trocarConta(q.id, 'nada')).rejects.toThrow('Conta não encontrada')
    expect(fechados).toEqual([])
  })

  it('trocarConta de terminal ou de Codex: nao copia conversa', async () => {
    const { servico, copias } = montar()
    const t = servico.criar('r1', 'terminal', 'principal')
    await servico.trocarConta(t.id, 'pessoal')
    const c = servico.criar('r1', 'agente', 'cx:x')
    await servico.trocarConta(c.id, 'pessoal')
    expect(copias).toEqual([])
  })
})

describe('ServicoQuadros com copia separada (D18)', () => {
  it('criarEmCopia: a copia vira pasta da lista e o quadro nasce nela', async () => {
    const { servico, estado } = montar()
    const { quadro, repo } = await servico.criarEmCopia('r1', 'agente', 'pessoal', { x: 1, y: 2 })
    expect(repo).toMatchObject({
      nome: 'app ⑂ claude-1',
      caminho: 'C:\\app.copias\\claude-1',
      perfilPadraoId: 'pessoal',
      copia: { origemId: 'r1', branch: 'lousa/claude-1', apelido: 'claude-1' },
    })
    expect(quadro).toMatchObject({ repoId: repo.id, perfilId: 'pessoal', titulo: 'Claude 1', sessaoId: 's1' })
    expect(estado().repos.map((r) => r.id)).toEqual(['r1', 'r2', repo.id])
  })

  it('copia de uma copia copia a pasta original', async () => {
    const { servico } = montar()
    const primeira = await servico.criarEmCopia('r1', 'agente', 'pessoal')
    const segunda = await servico.criarEmCopia(primeira.repo.id, 'agente', 'pessoal')
    expect(segunda.repo.copia?.origemId).toBe('r1')
    expect(segunda.repo.caminho).toBe('C:\\app.copias\\claude-2-2')
  })

  it('fechar o ultimo quadro da copia limpa e tira a pasta da lista', async () => {
    const { servico, estado, limpezas } = montar()
    const { quadro, repo } = await servico.criarEmCopia('r1', 'agente', 'pessoal')
    expect(await servico.remover(quadro.id)).toEqual({ copia: 'apagada' })
    expect(limpezas).toEqual([`${repo.id} (C:\\app)`])
    expect(estado().repos.some((r) => r.id === repo.id)).toBe(false)
  })

  it('com outro quadro na copia, nao limpa', async () => {
    const { servico, limpezas } = montar()
    const { quadro, repo } = await servico.criarEmCopia('r1', 'agente', 'pessoal')
    servico.criar(repo.id, 'terminal', 'pessoal')
    expect(await servico.remover(quadro.id)).toEqual({ copia: 'nenhuma' })
    expect(limpezas).toEqual([])
  })

  it('copia mantida (alteracao nao salva) continua na lista', async () => {
    const { servico, estado, fim } = montar()
    const { quadro, repo } = await servico.criarEmCopia('r1', 'agente', 'pessoal')
    fim.atual = { copia: 'mantida', caminho: repo.caminho, motivo: 'x' }
    expect((await servico.remover(quadro.id)).copia).toBe('mantida')
    expect(estado().repos.some((r) => r.id === repo.id)).toBe(true)
  })
})

describe('ServicoQuadros.definirPapel (T29.1)', () => {
  it('guarda o papel limpo; vazio tira; quadro que nao existe lanca', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'principal')
    expect(servico.definirPapel(q.id, '  Revisor  ').papel).toBe('Revisor')
    expect(estado().quadros[0]?.papel).toBe('Revisor')
    expect(servico.definirPapel(q.id, '   ')).not.toHaveProperty('papel')
    expect(() => servico.definirPapel('nada', 'x')).toThrow('Quadro não encontrado')
  })
})

describe('ServicoQuadros.dormir (R3.13)', () => {
  it('marca e tira o dormindo, salvo; quadro que ja saiu nao lanca', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'principal')
    servico.dormir(q.id, true)
    expect(estado().quadros[0]?.dormindo).toBe(true)
    servico.dormir(q.id, false)
    expect(estado().quadros[0]).not.toHaveProperty('dormindo')
    expect(() => servico.dormir('nada', true)).not.toThrow()
  })
})

describe('ServicoQuadros.ajustar (T19.1)', () => {
  it('guarda modelo e esforco no agente Claude; mudar um mantem o outro', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'pessoal')
    servico.ajustar(q.id, { modelo: 'sonnet', esforco: 'high' })
    servico.ajustar(q.id, { esforco: 'low' })
    expect(estado().quadros[0]).toMatchObject({ modelo: 'sonnet', esforco: 'low' })
  })

  it('liga e desliga o kanban do agente (A24) sem mexer no modelo', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'pessoal')
    servico.ajustar(q.id, { modelo: 'opus', kanban: true })
    expect(estado().quadros[0]).toMatchObject({ modelo: 'opus', kanban: true })
    servico.ajustar(q.id, { kanban: false })
    expect(estado().quadros[0]).toMatchObject({ modelo: 'opus', kanban: false })
  })

  it('valor fora da lista: recusa e nao grava', () => {
    const { servico, estado } = montar()
    const q = servico.criar('r1', 'agente', 'pessoal')
    expect(() => servico.ajustar(q.id, { modelo: 'gpt-9' as never })).toThrow('Modelo desconhecido')
    expect(() => servico.ajustar(q.id, { esforco: 'turbo' as never })).toThrow('Esforço desconhecido')
    expect(estado().quadros[0]?.modelo).toBeUndefined()
  })

  it('terminal comum ou agente Codex: recusa', () => {
    const { servico } = montar()
    const t = servico.criar('r1', 'terminal', 'pessoal')
    const c = servico.criar('r1', 'agente', 'cx:x')
    expect(() => servico.ajustar(t.id, { modelo: 'opus' })).toThrow('Só um agente')
    expect(() => servico.ajustar(c.id, { modelo: 'opus' })).toThrow('só o Claude')
  })
})
