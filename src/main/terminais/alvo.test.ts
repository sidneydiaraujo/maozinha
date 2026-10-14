import { describe, expect, it } from 'vitest'
import type { Perfil, Quadro, Repo } from '../../shared/model'
import { resolverAlvo, type DepsAlvo } from './alvo'

const perfil = (id: string, provedor: Perfil['provedor']): Perfil => ({
  id, provedor, nome: id, cor: '#000', configDir: `C:\\${id}`, ehPadrao: false, raizes: [],
})
const perfis = [perfil('principal', 'claude'), perfil('pessoal', 'claude'), perfil('cx:x', 'codex')]
const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
const repos: Repo[] = [{ id: 'r1', nome: 'app', caminho: 'C:\\empresa\\app', perfilPadraoId: 'principal' }]
const quadros: Quadro[] = [
  { id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'Claude 1', caixa },
  { id: 'q2', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 2', caixa },
  { id: 'q3', repoId: 'r1', perfilId: 'cx:x', tipo: 'agente', titulo: 'Codex 1', caixa },
  { id: 'q4', repoId: 'r1', perfilId: 'pessoal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
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
}

describe('resolverAlvo: login', () => {
  it('monta id, pasta e comando do Claude', () => {
    const r = resolverAlvo({ tipo: 'login', perfilId: 'principal' }, deps)
    expect(r).toMatchObject({
      terminalId: 'login:principal',
      cwd: 'C:\\Users\\x',
      comandoInicial: 'claude auth login; if ($?) { exit }\r',
    })
  })

  it('conta Codex usa o comando do Codex', () => {
    expect(resolverAlvo({ tipo: 'login', perfilId: 'cx:x' }, deps).comandoInicial).toBe('codex login; if ($?) { exit }\r')
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
