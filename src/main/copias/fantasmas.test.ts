import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Quadro, Repo } from '../../shared/model'
import { acharFantasmas, apagarBranchesJuntadas, branchesSoltas, listarBranchesJuntadas, varrerFantasmas } from './fantasmas'
import type { RodarGit } from './git'

const origem: Repo = { id: 'o', nome: 'lousa-ia', caminho: 'C:/p/lousa-ia', perfilPadraoId: 'pessoal' }
const copia = (n: number, caminho = `C:/p/lousa-ia.copias/claude-${n}`): Repo => ({
  id: `c${n}`,
  nome: 'lousa-ia',
  caminho,
  perfilPadraoId: 'pessoal',
  copia: { origemId: 'o', branch: `lousa/claude-${n}`, apelido: `claude-${n}` },
})
const quadro = (repoId: string): Quadro => ({ id: `q-${repoId}`, repoId }) as Quadro
const situacoes: Record<string, 'ok' | 'sumiu' | 'vazia'> = {
  'C:/p/lousa-ia.copias/claude-2': 'sumiu',
  'C:/p/lousa-ia.copias/claude-4': 'vazia',
  'C:/p/lousa-ia.copias/claude-5': 'sumiu',
}
const situacao = (c: string): 'ok' | 'sumiu' | 'vazia' => situacoes[c] ?? 'ok'

describe('acharFantasmas (R3.16)', () => {
  it('copia sem quadro cuja pasta sumiu ou esta vazia; com quadro ou pasta boa, fica', () => {
    const estado = { repos: [origem, copia(2), copia(3), copia(4), copia(5)], quadros: [quadro('c5')] }
    expect(acharFantasmas(estado, situacao).map((r) => r.id)).toEqual(['c2', 'c4'])
  })

  it('pasta original (sem copia) nunca e fantasma, mesmo sumida', () => {
    expect(acharFantasmas({ repos: [origem], quadros: [] }, () => 'sumiu')).toEqual([])
  })
})

describe('varrerFantasmas (R3.16)', () => {
  it('tira da lista na hora, apaga a pasta vazia e o git esquece o registro na original', async () => {
    let salvo: EstadoSalvo = { versao: 2, perfis: {}, repos: [origem, copia(2), copia(4), copia(3)], quadros: [], viewport: { x: 0, y: 0, zoom: 1 }, ultimoPerfilId: null }
    const comandos: string[] = []
    const vazias: string[] = []
    const fim = varrerFantasmas({
      armazem: { carregar: () => structuredClone(salvo), salvar: (e) => (salvo = e) },
      git: async (cwd, args) => {
        comandos.push(`${cwd} ${args.join(' ')}`)
        return { codigo: 0, saida: '', erro: '' }
      },
      situacao,
      apagarPastaVazia: (c) => {
        if (situacao(c) !== 'vazia') throw new Error('ENOENT')
        vazias.push(c)
      },
      log: () => undefined,
    })
    expect(salvo.repos.map((r) => r.id)).toEqual(['o', 'c3'])
    await fim
    expect(vazias).toEqual(['C:/p/lousa-ia.copias/claude-4'])
    expect(comandos).toEqual(['C:/p/lousa-ia worktree prune'])
  })
})

describe('branchesSoltas (R3.16)', () => {
  it('so lousa/* juntadas, sem as de um worktree vivo nem as de uma copia da lista', () => {
    const juntadas = 'lousa/claude-2\nlousa/claude-4\nlousa/claude-7\nlousa/claude-9\nmain\n'
    const worktrees = 'worktree C:/p/lousa-ia\nHEAD abc\nbranch refs/heads/main\n\nworktree C:/p/x/claude-7\nbranch refs/heads/lousa/claude-7\n'
    expect(branchesSoltas(juntadas, worktrees, ['lousa/claude-9'])).toEqual(['lousa/claude-2', 'lousa/claude-4'])
  })
})

describe('listar e apagar branches juntadas (R3.16)', () => {
  const gitFalso = (apagadas: string[]): RodarGit => async (cwd, args) => {
    if (cwd !== origem.caminho) return { codigo: 128, saida: '', erro: 'fatal: not a git repository' }
    if (args[0] === 'branch' && args[1] === '--merged') return { codigo: 0, saida: 'lousa/claude-2\nlousa/claude-4\n', erro: '' }
    if (args[0] === 'worktree') return { codigo: 0, saida: 'worktree C:/p/lousa-ia\nbranch refs/heads/main\n', erro: '' }
    if (args[0] === 'branch' && args[1] === '-d') {
      apagadas.push(args[2] ?? '')
      return { codigo: args[2] === 'lousa/claude-4' ? 1 : 0, saida: '', erro: '' }
    }
    return { codigo: 1, saida: '', erro: '' }
  }
  const semGit: Repo = { id: 's', nome: 'notas', caminho: 'C:/notas', perfilPadraoId: 'pessoal' }

  it('lista por pasta original; pasta sem git fica de fora', async () => {
    expect(await listarBranchesJuntadas(gitFalso([]), [origem, semGit])).toEqual([
      { repoId: 'o', nome: 'lousa-ia', branches: ['lousa/claude-2', 'lousa/claude-4'] },
    ])
  })

  it('apaga com -d e conta so as que o git aceitou', async () => {
    const apagadas: string[] = []
    expect(await apagarBranchesJuntadas(gitFalso(apagadas), origem, [origem])).toBe(1)
    expect(apagadas).toEqual(['lousa/claude-2', 'lousa/claude-4'])
  })
})
