import { describe, expect, it } from 'vitest'
import type { Perfil } from '../../shared/model'
import { resolverAlvo } from './alvo'

const perfis: Perfil[] = [
  { id: 'principal', provedor: 'claude', nome: 'P', cor: '#000', configDir: 'C:\\a', ehPadrao: true, raizes: [] },
  { id: 'cx:x', provedor: 'codex', nome: 'X', cor: '#000', configDir: 'C:\\b', ehPadrao: false, raizes: [] },
]
const deps = {
  home: 'C:\\Users\\x',
  obterPerfil: (id: string): Perfil => {
    const p = perfis.find((q) => q.id === id)
    if (!p) throw new Error('Conta não encontrada')
    return p
  },
}

describe('resolverAlvo', () => {
  it('login monta id, pasta e comando do Claude', () => {
    const r = resolverAlvo({ tipo: 'login', perfilId: 'principal' }, deps)
    expect(r).toMatchObject({
      terminalId: 'login:principal',
      cwd: 'C:\\Users\\x',
      comandoInicial: 'claude auth login; if ($?) { exit }\r',
    })
    expect(r.perfil.id).toBe('principal')
  })

  it('login de conta Codex usa o comando do Codex', () => {
    expect(resolverAlvo({ tipo: 'login', perfilId: 'cx:x' }, deps).comandoInicial).toBe('codex login; if ($?) { exit }\r')
  })

  it('conta inexistente propaga o erro', () => {
    expect(() => resolverAlvo({ tipo: 'login', perfilId: 'nada' }, deps)).toThrow('Conta não encontrada')
  })

  it('quadro ainda nao existe: avisa que chega na fatia 3', () => {
    expect(() => resolverAlvo({ tipo: 'quadro', quadroId: 'q1' }, deps)).toThrow('Quadros chegam na fatia 3')
  })
})
