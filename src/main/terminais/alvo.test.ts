import { describe, expect, it } from 'vitest'
import type { Perfil, Quadro, Repo } from '../../shared/model'
import { resolverAlvo, type DepsAlvo } from './alvo'

const perfil = (id: string, provedor: Perfil['provedor']): Perfil => ({
  id,
  provedor,
  nome: id,
  cor: '#000',
  configDir: `C:\\${id}`,
  ehPadrao: false,
  raizes: [],
})
const perfis = [perfil('principal', 'claude'), perfil('pessoal', 'claude'), perfil('cx:x', 'codex')]
const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
const SESSAO = '6d6af6e2-54e2-4c60-905c-497cd36f8073'
const NOVA = '00000000-54e2-4c60-905c-497cd36f8073'
const repos: Repo[] = [{ id: 'r1', nome: 'app', caminho: 'C:\\empresa\\app', perfilPadraoId: 'principal' }]
const quadros: Quadro[] = [
  { id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'Claude 1', caixa },
  { id: 'q2', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 2', caixa },
  { id: 'q3', repoId: 'r1', perfilId: 'cx:x', tipo: 'agente', titulo: 'Codex 1', caixa },
  { id: 'q4', repoId: 'r1', perfilId: 'pessoal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
  { id: 'q5', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'app', caixa, sessaoId: SESSAO },
  { id: 'q6', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'app 2', caixa, sessaoId: SESSAO },
  { id: 'q7', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'app 3', caixa, sessaoId: NOVA },
  // T19.1: modelo e esforco escolhidos no quadro
  { id: 'q8', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'app 4', caixa, sessaoId: SESSAO, modelo: 'sonnet', esforco: 'high' },
  { id: 'q9', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'app 5', caixa, esforco: 'max' },
  { id: 'q10', repoId: 'r1', perfilId: 'cx:x', tipo: 'agente', titulo: 'Codex 2', caixa, modelo: 'opus' },
]

const achar = <T extends { id: string }>(lista: T[], id: string, erro: string): T => {
  const item = lista.find((x) => x.id === id)
  if (!item) throw new Error(erro)
  return item
}
const deps: DepsAlvo = {
  home: 'C:\\Users\\x',
  obterPerfil: (id) => achar(perfis, id, 'Conta não encontrada'),
  obterQuadro: (id) => achar(quadros, id, 'Quadro não encontrado'),
  obterRepo: (id) => achar(repos, id, 'Repositório não encontrado'),
  existeSessao: (configDir, id) => configDir === 'C:\\pessoal' && id === SESSAO,
}

describe('resolverAlvo: login', () => {
  it('monta id e pasta; o login roda como -Command, sem nada digitado (T6.4)', () => {
    const r = resolverAlvo({ tipo: 'login', perfilId: 'principal' }, deps)
    expect(r).toMatchObject({ terminalId: 'login:principal', cwd: 'C:\\Users\\x' })
    expect(r.comandoInicial).toBeUndefined()
    expect(r.shell).toEqual({
      arquivo: 'powershell.exe',
      args: ['-NoLogo', '-NoProfile', '-Command', 'claude auth login; exit $LASTEXITCODE'],
    })
  })

  it('conta Codex usa o comando do Codex', () => {
    expect(resolverAlvo({ tipo: 'login', perfilId: 'cx:x' }, deps).shell?.args.at(-1)).toBe(
      'codex login; exit $LASTEXITCODE',
    )
  })

  it('conta inexistente propaga o erro', () => {
    expect(() => resolverAlvo({ tipo: 'login', perfilId: 'nada' }, deps)).toThrow('Conta não encontrada')
  })
})

describe('resolverAlvo: quadro', () => {
  it('pasta vem do repo e conta vem do quadro', () => {
    const r = resolverAlvo({ tipo: 'quadro', quadroId: 'q1' }, deps)
    expect(r).toMatchObject({ terminalId: 'q1', cwd: 'C:\\empresa\\app', comandoInicial: 'claude\r' })
    expect(r.perfil.id).toBe('principal')
  })

  it('dois quadros do mesmo repo com contas diferentes: perfis diferentes, mesma pasta', () => {
    const a = resolverAlvo({ tipo: 'quadro', quadroId: 'q1' }, deps)
    const b = resolverAlvo({ tipo: 'quadro', quadroId: 'q2' }, deps)
    expect([a.perfil.id, b.perfil.id]).toEqual(['principal', 'pessoal'])
    expect(a.cwd).toBe(b.cwd)
  })

  it('agente Codex digita codex; terminal nao digita nada', () => {
    expect(resolverAlvo({ tipo: 'quadro', quadroId: 'q3' }, deps).comandoInicial).toBe('codex\r')
    expect(resolverAlvo({ tipo: 'quadro', quadroId: 'q4' }, deps).comandoInicial).toBeUndefined()
  })

  it('quadro inexistente falha', () => {
    expect(() => resolverAlvo({ tipo: 'quadro', quadroId: 'nada' }, deps)).toThrow('Quadro não encontrado')
  })
})

describe('resolverAlvo: conversa do quadro (T6.1)', () => {
  const comando = (quadroId: string): string | undefined =>
    resolverAlvo({ tipo: 'quadro', quadroId }, deps).comandoInicial

  it('conversa ja gravada na pasta da conta: retoma', () => {
    expect(comando('q5')).toBe(`claude --resume ${SESSAO}\r`)
  })

  it('mesma conversa, mas a conta do quadro nao tem o arquivo: abre com o id escolhido', () => {
    expect(comando('q6')).toBe(`claude --session-id ${SESSAO}\r`)
    expect(comando('q7')).toBe(`claude --session-id ${NOVA}\r`)
  })

  it('quadro antigo sem conversa: claude puro', () => {
    expect(comando('q1')).toBe('claude\r')
  })
})

describe('resolverAlvo: linha de status do agente (T17.2)', () => {
  const pedidos: string[] = []
  const comPainel: DepsAlvo = {
    ...deps,
    settingsDoAgente: (quadroId) => {
      pedidos.push(quadroId)
      return quadroId === 'q1' ? null : `C:\\Users\\O'Neil\\lousa\\agentes\\${quadroId}.settings.json`
    },
  }
  const comando = (quadroId: string): string | undefined =>
    resolverAlvo({ tipo: 'quadro', quadroId }, comPainel).comandoInicial

  it('o agente Claude abre com --settings em texto literal do PowerShell, junto com --resume', () => {
    expect(comando('q5')).toBe(
      `claude --settings 'C:\\Users\\O''Neil\\lousa\\agentes\\q5.settings.json' --resume ${SESSAO}\r`,
    )
    expect(comando('q7')).toBe(
      `claude --settings 'C:\\Users\\O''Neil\\lousa\\agentes\\q7.settings.json' --session-id ${NOVA}\r`,
    )
  })

  it('sem settings (caminho que nao serve): abre como antes', () => {
    expect(comando('q1')).toBe('claude\r')
  })

  it('Codex e terminal comum nao pedem settings', () => {
    pedidos.length = 0
    expect(comando('q3')).toBe('codex\r')
    expect(comando('q4')).toBeUndefined()
    expect(pedidos).toEqual([])
  })

  it('modelo e esforco do quadro vao junto com --settings e --resume (T19.1)', () => {
    expect(comando('q8')).toBe(
      `claude --settings 'C:\\Users\\O''Neil\\lousa\\agentes\\q8.settings.json' --model sonnet --effort high --resume ${SESSAO}\r`,
    )
  })
})

describe('resolverAlvo: modelo e esforco (T19.1)', () => {
  const comando = (quadroId: string): string | undefined =>
    resolverAlvo({ tipo: 'quadro', quadroId }, deps).comandoInicial

  it('so o esforco: --effort, sem --model', () => {
    expect(comando('q9')).toBe('claude --effort max\r')
  })

  it('sem escolha: como antes', () => {
    expect(comando('q5')).toBe(`claude --resume ${SESSAO}\r`)
  })

  it('Codex ignora o modelo do quadro', () => {
    expect(comando('q10')).toBe('codex\r')
  })
})

describe('resolverAlvo: regra do kanban (D52)', () => {
  const pedidos: string[] = []
  const comKanban: DepsAlvo = {
    ...deps,
    kanbanDoQuadro: (quadro) => {
      pedidos.push(quadro.id)
      return quadro.id === 'q9' ? null : `Use o C:\\p\\O'Neil\\KANBAN.md.\r\nSeu nome: ${quadro.titulo}.`
    },
  }
  const comando = (quadroId: string): string | undefined =>
    resolverAlvo({ tipo: 'quadro', quadroId }, comKanban).comandoInicial

  it('o Claude abre com a regra em texto literal, numa linha so, antes do --resume', () => {
    expect(comando('q5')).toBe(
      `claude --append-system-prompt 'Use o C:\\p\\O''Neil\\KANBAN.md.  Seu nome: app.' --resume ${SESSAO}\r`,
    )
  })

  it('o Enter so existe no fim do comando, mesmo com \\r\\n na regra', () => {
    expect(comando('q8')?.split('\r')).toHaveLength(2)
  })

  it('o Codex garante o kanban mas nao recebe a regra; terminal comum nem garante', () => {
    pedidos.length = 0
    expect(comando('q3')).toBe('codex\r')
    expect(comando('q4')).toBeUndefined()
    expect(pedidos).toEqual(['q3'])
  })

  it('sem kanban (falhou o disco): abre como antes', () => {
    expect(comando('q9')).toBe('claude --effort max\r')
  })
})
