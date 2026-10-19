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
  const fechados: string[] = []
  const limpezas: string[] = []
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
    fecharTerminal: (id) => void fechados.push(id),
    novoId: () => `r${++n}`,
    copias: {
      limpar: async (repo, caminhoOrigem) => {
        limpezas.push(`${repo.id} (${caminhoOrigem ?? '?'})`)
        return { copia: 'apagada' }
      },
    },
  })
  return { servico, armazem, fechados, limpezas, estado: () => estado }
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

  it('pasta ja cadastrada devolve a existente, mesmo com outra caixa de letras', () => {
    const { servico, estado } = montar(['C:\\empresa\\api', 'c:/EMPRESA/api/'])
    const a = servico.adicionar('C:\\empresa\\api', 'principal')
    expect(servico.adicionar('c:/EMPRESA/api/', 'pessoal')).toEqual(a)
    expect(estado().repos).toHaveLength(1)
  })

  it('sugerir usa a raiz da conta e depois a ultima conta usada', () => {
    const { servico } = montar()
    expect(servico.sugerir('C:\\Users\\x\\pessoal\\outro')).toBe('pessoal')
    servico.adicionar('C:\\empresa\\api', 'principal')
    expect(servico.sugerir('D:\\qualquer')).toBe('principal')
  })

  it('remover leva os quadros do repo e so os dele', async () => {
    const { servico, armazem, fechados, limpezas, estado } = montar()
    const a = servico.adicionar('C:\\Users\\x\\pessoal\\app', 'pessoal')
    const b = servico.adicionar('C:\\empresa\\api', 'principal')
    const e = estado()
    const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
    e.quadros = [
      { id: 'q1', repoId: a.id, perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 1', caixa },
      { id: 'q2', repoId: b.id, perfilId: 'principal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
    ]
    armazem.salvar(e)
    expect(await servico.remover(a.id)).toEqual({ copia: 'nenhuma' })
    expect(estado().repos.map((r) => r.id)).toEqual([b.id])
    expect(estado().quadros.map((q) => q.id)).toEqual(['q2'])
    expect(fechados).toEqual(['q1'])
    expect(limpezas).toEqual([])
    await expect(servico.remover(a.id)).rejects.toThrow('Repositório não encontrado')
  })

  it('tirar uma copia separada da lista tenta limpa-la', async () => {
    const { servico, armazem, limpezas, estado } = montar()
    const origem = servico.adicionar('C:\\empresa\\api', 'principal')
    const e = estado()
    const copia = { origemId: origem.id, branch: 'lousa/claude-1', apelido: 'claude-1' }
    e.repos.push({ id: 'c1', nome: 'api ⑂ claude-1', caminho: 'C:\\empresa\\api.copias\\claude-1', perfilPadraoId: 'principal', copia })
    armazem.salvar(e)
    expect(await servico.remover('c1')).toEqual({ copia: 'apagada' })
    expect(limpezas).toEqual(['c1 (C:\\empresa\\api)'])
    expect(estado().repos.map((r) => r.id)).toEqual([origem.id])
  })
})
