import { describe, expect, it } from 'vitest'
import type { Ligacao, Quadro, Repo, ResumoCopia } from '../../shared/model'
import type { DadosTime } from '../../shared/time'
import { juntarTime } from './juntar'

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, repoId: string): Quadro => ({ id, repoId, perfilId: 'pessoal', tipo: 'agente', titulo: id, caixa })
const copia = (id: string): Repo => ({
  id,
  nome: id,
  caminho: `C:\\app.copias\\${id}`,
  perfilPadraoId: 'pessoal',
  copia: { origemId: 'app', branch: `lousa/${id}`, apelido: id },
})
const repos: Repo[] = [{ id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'pessoal' }, copia('c1'), copia('c2'), copia('c3')]
const linha = (de: string, para: string): Ligacao => ({ id: `${de}-${para}`, de, para, modo: 'automatico' })

/** Time a(c1) -> b(c2) -> c(c3); o que cada copia tem vem de `estado`. */
function montar(estado: Record<string, { commits?: number; pendente?: boolean; erro?: string }>) {
  const dados: DadosTime = {
    quadros: [agente('c', 'c3'), agente('a', 'c1'), agente('b', 'c2')],
    repos,
    ligacoes: [linha('a', 'b'), linha('b', 'c')],
    provedores: { pessoal: 'claude' },
  }
  const juntados: string[] = []
  const deps = {
    git: async () => ({ codigo: 0, saida: '', erro: '' }),
    dados: () => dados,
    obterRepo: (id: string) => repos.find((r) => r.id === id) as Repo,
    resumir: async (_git: unknown, repo: Repo): Promise<ResumoCopia> => ({
      branch: repo.copia?.branch ?? '',
      branchAlvo: 'main',
      commits: estado[repo.id]?.commits ?? 1,
      arquivos: [],
      totalArquivos: 0,
      pendente: estado[repo.id]?.pendente ?? false,
    }),
    juntar: async (_git: unknown, repo: Repo) => {
      const erro = estado[repo.id]?.erro
      if (erro) throw new Error(erro)
      juntados.push(repo.id)
      return { branchAlvo: 'main' }
    },
  }
  return { deps, juntados }
}

describe('juntarTime', () => {
  it('junta as copias na ordem de entrega, uma por vez', async () => {
    const { deps, juntados } = montar({})
    const r = await juntarTime(deps, 'c')
    expect(juntados).toEqual(['c1', 'c2', 'c3'])
    expect(r.juntadas.map((j) => j.apelido)).toEqual(['c1', 'c2', 'c3'])
    expect(r.parou).toBeNull()
  })

  it('alteracao sem commit fica de fora e a proxima segue; sem commit novo nao junta', async () => {
    const { deps, juntados } = montar({ c1: { pendente: true }, c2: { commits: 0 } })
    const r = await juntarTime(deps, 'a')
    expect(juntados).toEqual(['c3'])
    expect(r.deFora).toEqual(['c1'])
    expect(r.semNovidade).toEqual(['c2'])
  })

  it('para no primeiro conflito: diz qual copia e o que faltou', async () => {
    const conflito = 'Conflito: os dois lados mudaram src/a.ts. Nada foi juntado; peça a um agente para resolver.'
    const { deps, juntados } = montar({ c2: { erro: conflito } })
    const r = await juntarTime(deps, 'a')
    expect(juntados).toEqual(['c1'])
    expect(r.parou).toEqual({ quadroId: 'b', apelido: 'c2', branch: 'lousa/c2', branchAlvo: 'main', erro: conflito })
    expect(r.faltam).toEqual(['c3'])
  })

  it('time sem nenhuma copia: explica', async () => {
    const { deps } = montar({})
    const soOriginal = { ...deps, dados: () => ({ ...deps.dados(), quadros: [agente('a', 'app'), agente('b', 'app')], ligacoes: [linha('a', 'b')] }) }
    await expect(juntarTime(soOriginal, 'a')).rejects.toThrow('Ninguém deste time trabalha numa cópia separada')
  })
})
