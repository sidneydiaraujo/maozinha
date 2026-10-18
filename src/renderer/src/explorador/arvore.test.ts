import { describe, expect, it } from 'vitest'
import type { ItemArquivo, Repo } from '../../../shared/model'
import { chavePasta, linhasVisiveis, pastaDe, type Filhos } from './arvore'

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
