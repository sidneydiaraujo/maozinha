import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Quadro, Repo } from '../../shared/model'
import { kanbanNaPastaDoProjeto, prepararKanban, temKanban } from './disco'
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
/** O app e um projeto (tem package.json); `semProjeto` = a home, que junta varios. */
const memoria = (semProjeto = false): DiscoKanban & { gravados: string[] } => {
  const arquivos: Record<string, string> = semProjeto ? {} : { [join(original.caminho, 'package.json')]: '{}' }
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
    const regra = prepararKanban(quadro({ papel: 'Testador', kanban: true }), obter, (id) => criados.push(id), disco)
    expect(criados).toEqual(['r1'])
    expect(disco.gravados).toEqual([join('C:\\p\\app', 'KANBAN.md')])
    expect(regra).toContain('Seu nome nos cards: Testador.')
  })

  it('copia separada: o kanban e o da original; sem papel, o nome e o apelido da copia', () => {
    const disco = memoria()
    const criados: string[] = []
    const regra = prepararKanban(quadro({ repoId: 'r2', kanban: true }), obter, (id) => criados.push(id), disco)
    // a arvore que rele e a da pasta original, onde o kanban nasceu
    expect(criados).toEqual(['r1'])
    expect(disco.gravados).toEqual([join('C:\\p\\app', 'KANBAN.md')])
    expect(regra).toContain('Seu nome nos cards: claude-2.')
  })

  it('pasta que nao e projeto (a home, A16): nao cria na raiz; a regra manda usar o kanban do projeto', () => {
    const disco = memoria(true)
    const criados: string[] = []
    const regra = prepararKanban(quadro({ papel: 'Analista', kanban: true }), obter, (id) => criados.push(id), disco)
    expect(criados).toEqual([])
    expect(disco.gravados).toEqual([])
    expect(regra).toContain('KANBAN.md do projeto em que você trabalha')
    expect(regra).toContain('Seu nome nos cards: Analista.')
  })

  it('disco falhou: null, e o terminal abre sem a regra', () => {
    const disco = { ...memoria(), escrever: () => { throw new Error('EPERM') } }
    expect(prepararKanban(quadro({ kanban: true }), obter, undefined, disco)).toBeNull()
  })
})

describe('prepararKanban: a escolha do quadro e um kanban so por projeto (A22)', () => {
  it('caixa desmarcada: nada criado e nenhuma regra, mesmo com kanban no projeto', () => {
    const disco = memoria()
    disco.escrever(join('C:\\p\\app', 'KANBAN.md'), '# Kanban')
    expect(prepararKanban(quadro({ kanban: false }), obter, undefined, disco)).toBeNull()
  })

  it('quadro de antes (sem escolha): usa o kanban que ja existe, mas nunca cria', () => {
    const vazio = memoria()
    expect(prepararKanban(quadro({}), obter, undefined, vazio)).toBeNull()
    expect(vazio.gravados).toEqual([])
    const com = memoria()
    com.escrever(join('C:\\p\\app', 'KANBAN.md'), '# Kanban')
    expect(prepararKanban(quadro({}), obter, undefined, com)).toContain(join('C:\\p\\app', 'KANBAN.md'))
  })

  it('pasta dentro de um repositorio: usa o KANBAN.md da raiz e nao cria outro na subpasta', () => {
    const sub: Repo = { id: 'r3', nome: 'web', caminho: 'C:\\p\\app\\pacotes\\web', perfilPadraoId: 'principal' }
    const obter3 = (id: string): Repo => (id === 'r3' ? sub : obter(id))
    const disco = memoria()
    disco.escrever(join('C:\\p\\app', '.git'), '')
    disco.escrever(join(sub.caminho, 'package.json'), '{}')
    disco.escrever(join('C:\\p\\app', 'KANBAN.md'), '# Kanban')
    const antes = disco.gravados.length
    const regra = prepararKanban(quadro({ repoId: 'r3', kanban: true }), obter3, undefined, disco)
    expect(regra).toContain(join('C:\\p\\app', 'KANBAN.md'))
    expect(disco.gravados.length).toBe(antes)
    expect(temKanban(sub, obter3, disco)).toBe(true)
  })

  it('subpasta de um repositorio sem kanban: nasce na raiz do repositorio', () => {
    const sub: Repo = { id: 'r3', nome: 'web', caminho: 'C:\\p\\app\\web', perfilPadraoId: 'principal' }
    const obter3 = (id: string): Repo => (id === 'r3' ? sub : obter(id))
    const disco = memoria(true)
    disco.escrever(join('C:\\p\\app', '.git'), '')
    expect(temKanban(sub, obter3, disco)).toBe(false)
    prepararKanban(quadro({ repoId: 'r3', kanban: true }), obter3, undefined, disco)
    expect(disco.gravados.at(-1)).toBe(join('C:\\p\\app', 'KANBAN.md'))
  })
})

describe('kanbanNaPastaDoProjeto (A16)', () => {
  it('cria o kanban na pasta do projeto uma vez so; disco falhou nao lanca', () => {
    const disco = memoria(true)
    const pasta = 'C:\\Users\\x\\tdv'
    expect(kanbanNaPastaDoProjeto(pasta, disco)).toBe(pasta)
    expect(kanbanNaPastaDoProjeto(pasta, disco)).toBeNull()
    expect(disco.gravados).toEqual([join(pasta, 'KANBAN.md')])
    const quebrado = { ...memoria(true), escrever: () => { throw new Error('EPERM') } }
    expect(() => kanbanNaPastaDoProjeto(pasta, quebrado)).not.toThrow()
  })

  it('monorepo: o pacote usa o kanban da raiz do repositorio (A22)', () => {
    const disco = memoria(true)
    disco.escrever(join('C:\\Users\\x\\mono', '.git'), '')
    disco.escrever(join('C:\\Users\\x\\mono', 'KANBAN.md'), '# Kanban')
    expect(kanbanNaPastaDoProjeto('C:\\Users\\x\\mono\\pacotes\\web', disco)).toBeNull()
  })
})
