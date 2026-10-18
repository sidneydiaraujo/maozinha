import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil, StatusConta } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoPerfis } from './servico'

const base = { provedor: 'claude' as const, ehPadrao: false, raizes: [] as string[] }
const PERFIS: Perfil[] = [
  { ...base, id: 'principal', nome: 'Principal', cor: '#111111', configDir: 'C:\\a', ehPadrao: true },
  { ...base, id: 'pessoal', nome: 'Pessoal', cor: '#222222', configDir: 'C:\\b' },
]

const HOME = join('C:', 'Users', 'teste')

/** Como o detectar real: conta marcada `criada` aparece mesmo com a pasta vazia. */
function criadas(ajustes: EstadoSalvo['perfis']): Perfil[] {
  return Object.entries(ajustes)
    .filter(([, a]) => a.criada)
    .map(([id, a]) => ({ ...base, id, provedor: a.provedor ?? 'claude', nome: id, cor: '#333333', configDir: id }))
}

function montar() {
  let estado: EstadoSalvo = structuredClone(ESTADO_PADRAO)
  const armazem: Armazem = {
    carregar: () => structuredClone(estado),
    salvar: (novo) => {
      estado = structuredClone(novo)
    },
  }
  const leituras: string[] = []
  const pastas: string[] = []
  const servico = new ServicoPerfis({
    armazem,
    // o detectar falso aplica o nome ajustado, como o real
    detectar: (ajustes) => [...PERFIS, ...criadas(ajustes)].map((p) => ({ ...p, nome: ajustes[p.id]?.nome ?? p.nome })),
    lerConta: async (perfil): Promise<StatusConta> => {
      leituras.push(perfil.id)
      return { logado: true, email: `${perfil.id}@exemplo.com`, plano: 'pro', erro: null }
    },
    home: HOME,
    criarPasta: (caminho) => pastas.push(caminho),
  })
  return { servico, armazem, leituras, pastas, estado: () => estado }
}

describe('ServicoPerfis', () => {
  it('listar junta cada perfil com a sua conta', async () => {
    const { servico } = montar()
    const lista = await servico.listar()
    expect(lista.map((p) => [p.id, p.conta.email])).toEqual([
      ['principal', 'principal@exemplo.com'],
      ['pessoal', 'pessoal@exemplo.com'],
    ])
  })

  it('segunda listagem usa o cache e nao le a conta de novo', async () => {
    const { servico, leituras } = montar()
    await servico.listar()
    await servico.listar()
    expect(leituras).toEqual(['principal', 'pessoal'])
  })

  it('renomear persiste no armazem e nao rele a conta', async () => {
    const { servico, leituras, estado } = montar()
    await servico.listar()
    const renomeada = await servico.renomear('principal', '  Empresa ')
    expect(renomeada.nome).toBe('Empresa')
    expect(estado().perfis['principal']?.nome).toBe('Empresa')
    expect(leituras).toEqual(['principal', 'pessoal'])
    expect((await servico.listar())[0]?.nome).toBe('Empresa')
  })

  it('renomear mantem os outros ajustes da conta', async () => {
    const { servico, armazem, estado } = montar()
    armazem.salvar({ ...estado(), perfis: { principal: { cor: '#abcdef' } } })
    await servico.renomear('principal', 'Empresa')
    expect(estado().perfis['principal']).toEqual({ cor: '#abcdef', nome: 'Empresa' })
  })

  it('atualizarConta le de novo e guarda o resultado', async () => {
    const { servico, leituras } = montar()
    await servico.listar()
    const status = await servico.atualizarConta('pessoal')
    expect(status.email).toBe('pessoal@exemplo.com')
    expect(leituras).toEqual(['principal', 'pessoal', 'pessoal'])
  })

  it('id inexistente lanca Conta não encontrada', async () => {
    const { servico } = montar()
    expect(() => servico.obter('nada')).toThrow('Conta não encontrada')
    await expect(servico.renomear('nada', 'X')).rejects.toThrow('Conta não encontrada')
    await expect(servico.atualizarConta('nada')).rejects.toThrow('Conta não encontrada')
  })

  it('criar (T1.8) faz a pasta vazia, marca criada e devolve a conta', async () => {
    const { servico, pastas, estado } = montar()
    const nova = await servico.criar('claude', ' Trabalho Dev ')
    expect(pastas).toEqual([join(HOME, '.claude-trabalho-dev')])
    expect(estado().perfis['trabalho-dev']).toEqual({ nome: 'Trabalho Dev', provedor: 'claude', criada: true })
    expect(nova).toMatchObject({ id: 'trabalho-dev', nome: 'Trabalho Dev' })
  })

  it('criar Codex usa .codex-<slug> e o id cx:<slug>', async () => {
    const { servico, pastas } = montar()
    const nova = await servico.criar('codex', 'Trabalho')
    expect(pastas).toEqual([join(HOME, '.codex-trabalho')])
    expect(nova.id).toBe('cx:trabalho')
  })

  it('criar recusa nome vazio, reservado e repetido, sem criar pasta', async () => {
    const { servico, pastas } = montar()
    await expect(servico.criar('claude', '!!!')).rejects.toThrow('Nome inválido')
    await expect(servico.criar('claude', 'Principal')).rejects.toThrow('Nome reservado')
    await expect(servico.criar('codex', 'Padrão')).rejects.toThrow('Nome reservado')
    await expect(servico.criar('claude', 'PESSOAL')).rejects.toThrow('Já existe uma conta com esse nome')
    expect(pastas).toEqual([])
  })
})
