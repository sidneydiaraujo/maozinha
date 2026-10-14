import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoRepos } from './servico'

const perfil = (id: string, raizes: string[] = []): Perfil => ({
  id, provedor: 'claude', nome: id, cor: '#000', configDir: `C:\\${id}`, ehPadrao: false, raizes,
})
const PERFIS = [perfil('principal'), perfil('pessoal', ['C:\\Users\\x\\pessoal'])]

function montar(pastas: string[] = ['C:\\Users\\x\\pessoal\\app', 'C:\\empresa\\api']) {
  let estado: EstadoSalvo = structuredClone(ESTADO_PADRAO)
  const armazem: Armazem = { carregar: () => structuredClone(estado), salvar: (e) => void (estado = structuredClone(e)) }
  let n = 0
  const servico = new ServicoRepos({
    armazem,
    perfis: {
      obter: (id) => {
        const p = PERFIS.find((q) => q.id === id)
        if (!p) throw new Error('Conta não encontrada')
        return p
      },
      detectados: () => PERFIS,
    },
    ehPasta: (c) => pastas.includes(c),
    novoId: () => `r${++n}`,
  })
  return { servico, armazem, estado: () => estado }
}

describe('ServicoRepos', () => {
  it('adicionar grava e devolve o repo com nome da pasta e conta padrao', () => {
    const { servico, estado } = montar()
    const repo = servico.adicionar('C:\\Users\\x\\pessoal\\app', 'pessoal')
    expect(repo).toMatchObject({ id: 'r1', nome: 'app', perfilPadraoId: 'pessoal' })
    expect(estado().repos).toEqual([repo])
    expect(estado().ultimoPerfilId).toBe('pessoal')
  })

  it('pasta inexistente e conta inexistente sao recusadas', () => {
    const { servico } = montar()
    expect(() => servico.adicionar('C:\\nada', 'pessoal')).toThrow('Pasta não encontrada')
    expect(() => servico.adicionar('C:\\empresa\\api', 'nada')).toThrow('Conta não encontrada')
  })

  it('repo duplicado e recusado mesmo com outra caixa de letras', () => {
    const { servico } = montar(['C:\\empresa\\api', 'c:/EMPRESA/api/'])
    servico.adicionar('C:\\empresa\\api', 'principal')
    expect(() => servico.adicionar('c:/EMPRESA/api/', 'pessoal')).toThrow(/já está na lousa/)
  })

  it('as molduras nao se sobrepoem', () => {
    const { servico } = montar()
    const a = servico.adicionar('C:\\Users\\x\\pessoal\\app', 'pessoal')
    const b = servico.adicionar('C:\\empresa\\api', 'principal')
    expect(b.caixa.x).toBeGreaterThanOrEqual(a.caixa.x + a.caixa.largura)
  })

  it('sugerir usa a raiz da conta e depois a ultima conta usada', () => {
    const { servico } = montar()
    expect(servico.sugerir('C:\\Users\\x\\pessoal\\outro')).toBe('pessoal')
    servico.adicionar('C:\\empresa\\api', 'principal')
    expect(servico.sugerir('D:\\qualquer')).toBe('principal')
  })

  it('mudarPerfilPadrao persiste; repo ou conta inexistente falha', () => {
    const { servico, estado } = montar()
    const repo = servico.adicionar('C:\\empresa\\api', 'principal')
    expect(servico.mudarPerfilPadrao(repo.id, 'pessoal').perfilPadraoId).toBe('pessoal')
    expect(estado().repos[0]?.perfilPadraoId).toBe('pessoal')
    expect(() => servico.mudarPerfilPadrao('x', 'pessoal')).toThrow('Repositório não encontrado')
    expect(() => servico.mudarPerfilPadrao(repo.id, 'nada')).toThrow('Conta não encontrada')
  })

  it('remover leva os quadros do repo e so os dele', () => {
    const { servico, armazem, estado } = montar()
    const a = servico.adicionar('C:\\Users\\x\\pessoal\\app', 'pessoal')
    const b = servico.adicionar('C:\\empresa\\api', 'principal')
    const e = estado()
    const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
    e.quadros = [
      { id: 'q1', repoId: a.id, perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 1', caixa },
      { id: 'q2', repoId: b.id, perfilId: 'principal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
    ]
    armazem.salvar(e)
    servico.remover(a.id)
    expect(estado().repos.map((r) => r.id)).toEqual([b.id])
    expect(estado().quadros.map((q) => q.id)).toEqual(['q2'])
    expect(() => servico.remover(a.id)).toThrow('Repositório não encontrado')
  })
})
