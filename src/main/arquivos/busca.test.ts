import { describe, expect, it } from 'vitest'
import type { ItemArquivo, Repo } from '../../shared/model'
import { acharUnicoPeloFim, buscarArquivos } from './busca'

const repo = (id: string): Repo => ({ id, nome: id, caminho: `C:/${id}`, perfilPadraoId: 'p' })

/** Arvore falsa: 'pasta/' = pasta. */
function arvore(mapa: Record<string, string[]>) {
  const listadas: string[] = []
  const listar = (repoId: string, relativo: string): ItemArquivo[] => {
    listadas.push(`${repoId}:${relativo}`)
    const filhos = mapa[`${repoId}:${relativo}`]
    if (!filhos) throw new Error('nao existe')
    return filhos.map((n) => ({ nome: n.replace(/\/$/, ''), pasta: n.endsWith('/') }))
  }
  return { listar, listadas }
}

describe('buscarArquivos', () => {
  const { listar, listadas } = arvore({
    'a:': ['docs/', 'node_modules/', 'leia.md', 'package.json'],
    'a:docs': ['ESTADO.md', 'plano/'],
    'a:docs/plano': ['fatia-12.md'],
    'a:node_modules': ['leia.md'],
    'b:': ['leia-tambem.md'],
  })

  it('acha pelo nome, em subpastas e em todas as pastas da lista', () => {
    expect(buscarArquivos([repo('a'), repo('b')], 'leia', listar)).toEqual([
      { repoId: 'a', relativo: 'leia.md' },
      { repoId: 'b', relativo: 'leia-tambem.md' },
    ])
    expect(buscarArquivos([repo('a')], 'fatia', listar)).toEqual([{ repoId: 'a', relativo: 'docs/plano/fatia-12.md' }])
  })

  it('nao entra em node_modules e nao devolve pasta', () => {
    expect(listadas).not.toContain('a:node_modules')
    // "docs" acha os arquivos de dentro pelo caminho, nunca a pasta em si
    expect(buscarArquivos([repo('a')], 'docs', listar).map((a) => a.relativo)).toEqual([
      'docs/ESTADO.md',
      'docs/plano/fatia-12.md',
    ])
  })

  it('menos de 2 letras nao busca', () => {
    expect(buscarArquivos([repo('a')], 'l', listar)).toEqual([])
  })

  it('para no teto de visitas e no de resultados', () => {
    const grande = arvore({ 'a:': Array.from({ length: 100 }, (_, i) => `x${i}.md`) })
    expect(buscarArquivos([repo('a')], '.md', grande.listar, { visitas: 10, resultados: 50 })).toHaveLength(10)
    expect(buscarArquivos([repo('a')], '.md', grande.listar, { visitas: 1000, resultados: 5 })).toHaveLength(5)
  })

  it('pasta que falha ao listar e pulada', () => {
    expect(buscarArquivos([repo('nada')], 'leia', listar)).toEqual([])
  })
})

describe('acharUnicoPeloFim (R1.6)', () => {
  const { listar } = arvore({
    'a:': ['docs/', 'src/', 'node_modules/', 'leia.md'],
    'a:docs': ['ESTADO.md', 'plano/'],
    'a:docs/plano': ['fatia-12.md', 'leia.md'],
    'a:src': ['main/'],
    'a:src/main': ['x.ts'],
    'a:node_modules': ['ESTADO.md'],
  })

  it('nome solto ou pedaco do caminho: acha o unico, sem olhar node_modules, sem ligar para maiusculas', () => {
    expect(acharUnicoPeloFim('a', 'estado.md', listar)).toBe('docs/ESTADO.md')
    expect(acharUnicoPeloFim('a', 'main/x.ts', listar)).toBe('src/main/x.ts')
    expect(acharUnicoPeloFim('a', '.\\plano\\fatia-12.md', listar)).toBe('docs/plano/fatia-12.md')
  })

  it('dois candidatos, nenhum, ou saindo da pasta: null', () => {
    expect(acharUnicoPeloFim('a', 'leia.md', listar)).toBeNull()
    expect(acharUnicoPeloFim('a', 'sumiu.md', listar)).toBeNull()
    expect(acharUnicoPeloFim('a', '../fora.md', listar)).toBeNull()
  })

  it('para no teto de visitas', () => {
    expect(acharUnicoPeloFim('a', 'x.ts', listar, 3)).toBeNull()
  })
})
