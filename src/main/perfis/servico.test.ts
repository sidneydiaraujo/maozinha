import { describe, expect, it } from 'vitest'
import type { EstadoSalvo, Perfil, StatusConta } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { ServicoPerfis } from './servico'

const base = { provedor: 'claude' as const, ehPadrao: false, raizes: [] as string[] }
const PERFIS: Perfil[] = [
  { ...base, id: 'principal', nome: 'Principal', cor: '#111111', configDir: 'C:\\a', ehPadrao: true },
  { ...base, id: 'pessoal', nome: 'Pessoal', cor: '#222222', configDir: 'C:\\b' },
]

function montar(): { servico: ServicoPerfis; armazem: Armazem; leituras: string[]; estado: () => EstadoSalvo } {
  let estado: EstadoSalvo = structuredClone(ESTADO_PADRAO)
  const armazem: Armazem = {
    carregar: () => structuredClone(estado),
    salvar: (novo) => {
      estado = structuredClone(novo)
    },
  }
  const leituras: string[] = []
  const servico = new ServicoPerfis({
    armazem,
    // o detectar falso aplica o nome ajustado, como o real
    detectar: (ajustes) => PERFIS.map((p) => ({ ...p, nome: ajustes[p.id]?.nome ?? p.nome })),
    lerConta: async (perfil): Promise<StatusConta> => {
      leituras.push(perfil.id)
      return { logado: true, email: `${perfil.id}@exemplo.com`, plano: 'pro', erro: null }
    },
  })
  return { servico, armazem, leituras, estado: () => estado }
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
})
