import { describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../shared/model'
import type { RodarGit, SaidaGit } from './git'
import { linhaDoErro, ServicoCopias } from './servico'

const origem: Repo = { id: 'r1', nome: 'app', caminho: 'C:\\x\\app', perfilPadraoId: 'p' }
const copia: Repo = {
  id: 'r2',
  nome: 'app',
  caminho: 'C:\\x\\app.copias\\claude-1',
  perfilPadraoId: 'p',
  copia: { origemId: 'r1', branch: 'lousa/claude-1', apelido: 'claude-1' },
}

const ok = (saida = ''): SaidaGit => ({ codigo: 0, saida, erro: '' })
const falha = (erro = 'fatal: x'): SaidaGit => ({ codigo: 1, saida: '', erro })

/** Git falso: a primeira regra cujo trecho aparece nos argumentos responde; o resto da ok. */
function gitFalso(regras: Array<[string, SaidaGit | SaidaGit[]]>) {
  const chamadas: string[] = []
  const git: RodarGit = async (_cwd, args) => {
    const linha = args.join(' ')
    chamadas.push(linha)
    const regra = regras.find(([trecho]) => linha.includes(trecho))
    if (!regra) return ok()
    const r = regra[1]
    return Array.isArray(r) ? (r.shift() ?? ok()) : r
  }
  return { git, chamadas }
}

const servico = (git: RodarGit, existe: (c: string) => boolean = () => false) =>
  new ServicoCopias({ git, existe, esperar: vi.fn(async () => undefined) })

describe('ServicoCopias.criar', () => {
  it('recusa pasta que nao e git', async () => {
    const { git } = gitFalso([['--show-toplevel', falha()]])
    await expect(servico(git).criar(origem, 'Claude 1', [])).rejects.toThrow('não é um repositório git')
  })

  it('recusa subpasta do repositorio', async () => {
    const { git } = gitFalso([['--show-toplevel', ok('C:/x\n')]])
    await expect(servico(git).criar(origem, 'Claude 1', [])).rejects.toThrow('pasta raiz')
  })

  it('cria a copia ao lado, com branch propria', async () => {
    const { git, chamadas } = gitFalso([
      ['--show-toplevel', ok('C:/x/app\n')],
      ['--verify', falha('')],
    ])
    const r = await servico(git).criar(origem, 'Claude 1', [])
    expect(r).toEqual({
      caminho: 'C:\\x\\app.copias\\claude-1',
      copia: { origemId: 'r1', branch: 'lousa/claude-1', apelido: 'claude-1' },
    })
    expect(chamadas).toContain('worktree add -b lousa/claude-1 C:\\x\\app.copias\\claude-1 HEAD')
  })

  it('pula pasta que ja existe e branch que ja existe', async () => {
    const { git } = gitFalso([
      ['--show-toplevel', ok('C:/x/app')],
      ['refs/heads/lousa/claude-1-2', ok()],
      ['--verify', falha('')],
    ])
    const r = await servico(git, (c) => c.endsWith('claude-1')).criar(origem, 'Claude 1', [])
    expect(r.copia.apelido).toBe('claude-1-3')
  })

  it('erro do git vira mensagem', async () => {
    const { git } = gitFalso([
      ['--show-toplevel', ok('C:/x/app')],
      ['--verify', falha('')],
      ['worktree add', falha('fatal: invalid reference: HEAD\nmais')],
    ])
    await expect(servico(git).criar(origem, 'Claude 1', [])).rejects.toThrow(
      'O git não criou a cópia: fatal: invalid reference: HEAD',
    )
  })
})

describe('linhaDoErro (R1.4)', () => {
  it('pula o andamento normal do git e mostra o fatal', () => {
    const erro = "Preparing worktree (new branch 'lousa/claude-4')\nfatal: could not create directory 'C:/x'\n"
    expect(linhaDoErro(erro)).toBe("fatal: could not create directory 'C:/x'")
  })

  it('sem fatal nem error: a ultima linha; so espaco: vazio', () => {
    expect(linhaDoErro('Preparing worktree\nalgo deu errado\n\n')).toBe('algo deu errado')
    expect(linhaDoErro('  \n')).toBe('')
  })
})

describe('ServicoCopias.limpar', () => {
  const comum: [string, SaidaGit] = ['--git-common-dir', ok('C:/x/app/.git\n')]

  it('pasta que nao e copia: nada', async () => {
    const { git, chamadas } = gitFalso([])
    expect(await servico(git).limpar(origem)).toEqual({ copia: 'nenhuma' })
    expect(chamadas).toEqual([])
  })

  it('com alteracao: mantem e nao remove nada', async () => {
    const { git, chamadas } = gitFalso([['status', ok('?? b.txt\n')]])
    const r = await servico(git, () => true).limpar(copia)
    expect(r).toEqual({ copia: 'mantida', caminho: copia.caminho, motivo: expect.stringContaining('alterações') })
    expect(chamadas.some((c) => c.startsWith('worktree remove'))).toBe(false)
  })

  it('limpa e trabalho ja juntado: apaga pasta e branch', async () => {
    const { git, chamadas } = gitFalso([comum])
    expect(await servico(git, () => true).limpar(copia)).toEqual({ copia: 'apagada' })
    expect(chamadas).toContain(`worktree remove ${copia.caminho}`)
    expect(chamadas).toContain('branch -d lousa/claude-1')
  })

  it('branch com commits nao juntados fica guardada', async () => {
    const { git } = gitFalso([comum, ['branch -d', falha('error: not fully merged')]])
    expect(await servico(git, () => true).limpar(copia)).toEqual({ copia: 'branchGuardada', branch: 'lousa/claude-1' })
  })

  it('pasta presa: tenta de novo uma vez e, se falhar, mantem', async () => {
    const { git, chamadas } = gitFalso([comum, ['worktree remove', [falha(), falha()]]])
    const r = await servico(git, () => true).limpar(copia)
    expect(r.copia).toBe('mantida')
    expect(chamadas.filter((c) => c.startsWith('worktree remove'))).toHaveLength(2)
  })

  it('pasta presa que solta na segunda tentativa: apaga', async () => {
    const { git } = gitFalso([comum, ['worktree remove', [falha(), ok()]]])
    expect(await servico(git, () => true).limpar(copia)).toEqual({ copia: 'apagada' })
  })

  it('pasta que ja sumiu: prune na origem', async () => {
    const { git, chamadas } = gitFalso([])
    expect(await servico(git, () => false).limpar(copia, 'C:\\x\\app')).toEqual({ copia: 'apagada' })
    expect(chamadas).toEqual(['worktree prune'])
  })
})
