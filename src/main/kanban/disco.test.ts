import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Quadro, Repo } from '../../shared/model'
import { prepararKanban } from './disco'
import type { DiscoKanban } from './kanban'

const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
const original: Repo = { id: 'r1', nome: 'app', caminho: 'C:\\p\\app', perfilPadraoId: 'principal' }
const copia: Repo = {
  id: 'r2',
  nome: 'claude-2',
  caminho: 'C:\\p\\app.copias\\claude-2',
  perfilPadraoId: 'principal',
  copia: { origemId: 'r1', branch: 'lousa/claude-2', apelido: 'claude-2' },
}
const obter = (id: string): Repo => {
  const r = [original, copia].find((x) => x.id === id)
  if (!r) throw new Error('Repositório não encontrado')
  return r
}
const quadro = (q: Partial<Quadro>): Quadro => ({
  id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'app 2', caixa, ...q,
})
const memoria = (): DiscoKanban & { gravados: string[] } => {
  const arquivos: Record<string, string> = {}
  const gravados: string[] = []
  return {
    gravados,
    existe: (c) => c in arquivos,
    ehPasta: () => false,
    ler: (c) => arquivos[c] ?? '',
    escrever: (c, t) => {
      arquivos[c] = t
      gravados.push(c)
    },
    criarPasta: () => undefined,
  }
}

describe('prepararKanban', () => {
  it('cria o kanban da pasta e a regra leva o papel do quadro', () => {
    const disco = memoria()
    const criados: string[] = []
    const regra = prepararKanban(quadro({ papel: 'Testador' }), obter, (id) => criados.push(id), disco)
    expect(criados).toEqual(['r1'])
    expect(disco.gravados).toEqual([join('C:\\p\\app', 'KANBAN.md')])
    expect(regra).toContain('Seu nome nos cards: Testador.')
  })

  it('copia separada: o kanban e o da original; sem papel, o nome e o apelido da copia', () => {
    const disco = memoria()
    const criados: string[] = []
    const regra = prepararKanban(quadro({ repoId: 'r2' }), obter, (id) => criados.push(id), disco)
    // a arvore que rele e a da pasta original, onde o kanban nasceu
    expect(criados).toEqual(['r1'])
    expect(disco.gravados).toEqual([join('C:\\p\\app', 'KANBAN.md')])
    expect(regra).toContain('Seu nome nos cards: claude-2.')
  })

  it('disco falhou: null, e o terminal abre sem a regra', () => {
    const disco = { ...memoria(), escrever: () => { throw new Error('EPERM') } }
    expect(prepararKanban(quadro({}), obter, undefined, disco)).toBeNull()
  })
})
