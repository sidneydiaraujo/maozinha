import { describe, expect, it } from 'vitest'
import type { ItemArquivo, Repo } from '../../../shared/model'
import { bolinhasDeEscrita, chavePasta, linhasVisiveis, pastaDe, type Filhos } from './arvore'

const repo: Repo = { id: 'r1', nome: 'lousa-ia', caminho: 'C:/lousa-ia', perfilPadraoId: 'principal' }
const item = (nome: string, pasta = false): ItemArquivo => ({ nome, pasta })

describe('linhasVisiveis', () => {
  it('raiz fechada mostra so a raiz', () => {
    expect(linhasVisiveis([repo], new Map(), new Set()).map((l) => l.nome)).toEqual(['lousa-ia'])
  })

  it('pastas abertas entram em cascata, com nivel e caminho relativo', () => {
    const filhos: Filhos = new Map([
      [chavePasta('r1', ''), [item('docs', true), item('README.md')]],
      [chavePasta('r1', 'docs'), [item('aceite', true), item('ESTADO.md')]],
    ])
    const abertas = new Set([chavePasta('r1', ''), chavePasta('r1', 'docs')])
    const linhas = linhasVisiveis([repo], filhos, abertas)
    expect(linhas.map((l) => [l.relativo, l.nivel, l.aberta])).toEqual([
      ['', 0, true],
      ['docs', 1, true],
      ['docs/aceite', 2, false],
      ['docs/ESTADO.md', 2, false],
      ['README.md', 1, false],
    ])
  })

  it('pasta aberta ainda sem leitura, vazia ou com erro mostra um aviso', () => {
    const abertas = new Set([chavePasta('r1', '')])
    expect(linhasVisiveis([repo], new Map(), abertas)[1]?.estado).toBe('carregando')
    expect(linhasVisiveis([repo], new Map([[chavePasta('r1', ''), []]]), abertas)[1]?.estado).toBe('vazia')
    const comErro: Filhos = new Map([[chavePasta('r1', ''), { erro: 'Pasta não encontrada' }]])
    expect(linhasVisiveis([repo], comErro, abertas)[1]?.estado).toBe('Pasta não encontrada')
  })
})

describe('pastaDe', () => {
  it('pasta do arquivo, vazio na raiz', () => {
    expect(pastaDe('docs/aceite/roteiro.md')).toBe('docs/aceite')
    expect(pastaDe('README.md')).toBe('')
  })
})

describe('bolinhasDeEscrita (A16)', () => {
  const filhos: Filhos = new Map([
    [chavePasta('r1', ''), [item('pessoal', true), item('notas', true)]],
    [chavePasta('r1', 'pessoal'), [item('app', true), item('api', true)]],
  ])

  it('pasta do projeto a vista: a bolinha fica nela; dois agentes no mesmo projeto, as duas', () => {
    const abertas = new Set([chavePasta('r1', ''), chavePasta('r1', 'pessoal')])
    const linhas = linhasVisiveis([repo], filhos, abertas)
    const b = bolinhasDeEscrita(linhas, [
      { quadroId: 'a', repoId: 'r1', relativo: 'pessoal/app' },
      { quadroId: 'b', repoId: 'r1', relativo: 'pessoal/app' },
      { quadroId: 'c', repoId: 'r1', relativo: 'pessoal/api' },
    ])
    expect([...b]).toEqual([
      [chavePasta('r1', 'pessoal/app'), ['a', 'b']],
      [chavePasta('r1', 'pessoal/api'), ['c']],
    ])
  })

  it('pasta do projeto escondida: na pasta fechada mais funda que a contem; raiz fechada: na raiz', () => {
    const onde = [{ quadroId: 'a', repoId: 'r1', relativo: 'pessoal/app' }]
    const abertaSoARaiz = linhasVisiveis([repo], filhos, new Set([chavePasta('r1', '')]))
    expect([...bolinhasDeEscrita(abertaSoARaiz, onde).keys()]).toEqual([chavePasta('r1', 'pessoal')])
    const fechada = linhasVisiveis([repo], filhos, new Set())
    expect([...bolinhasDeEscrita(fechada, onde).keys()]).toEqual([chavePasta('r1', '')])
  })

  it('nao confunde pasta com prefixo parecido (app x app2) nem repo de outro id', () => {
    const linhas = linhasVisiveis([repo], new Map([[chavePasta('r1', ''), [item('app', true), item('app2', true)]]]), new Set([chavePasta('r1', '')]))
    const b = bolinhasDeEscrita(linhas, [
      { quadroId: 'a', repoId: 'r1', relativo: 'app2/src' },
      { quadroId: 'z', repoId: 'outro', relativo: '' },
    ])
    expect([...b]).toEqual([[chavePasta('r1', 'app2'), ['a']]])
  })
})
