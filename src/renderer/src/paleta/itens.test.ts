import { describe, expect, it } from 'vitest'
import type { Quadro, Repo } from '../../../shared/model'
import { itemDeArquivo, itensLocais } from './itens'

const caixa = { x: 0, y: 0, largura: 1, altura: 1 }
const repos: Repo[] = [
  { id: 'r1', nome: 'lousa-ia', caminho: 'C:\\p\\lousa-ia', perfilPadraoId: 'pessoal' },
  { id: 'r2', nome: 'gestao', caminho: 'C:\\e\\gestao', perfilPadraoId: 'principal' },
]
const quadros: Quadro[] = [
  { id: 'q1', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 1', caixa },
  { id: 'q2', repoId: 'r2', perfilId: 'principal', tipo: 'terminal', titulo: 'Terminal 1', caixa },
]
const perfis = [
  { id: 'pessoal', nome: 'Pessoal' },
  { id: 'principal', nome: 'Empresa' },
]

describe('itensLocais', () => {
  it('sem texto: quadros primeiro, depois pastas (a mais recente antes)', () => {
    expect(itensLocais(repos, quadros, perfis, '').map((i) => i.titulo)).toEqual([
      'lousa-ia · Claude 1',
      'gestao · Terminal 1',
      'Novo quadro em gestao',
      'Novo quadro em lousa-ia',
    ])
  })

  it('filtra pelo texto, inclusive pelo nome da conta', () => {
    expect(itensLocais(repos, quadros, perfis, 'gest').map((i) => i.chave)).toEqual(['q:q2', 'p:r2'])
    expect(itensLocais(repos, quadros, perfis, 'empresa').map((i) => i.chave)).toEqual(['q:q2'])
  })
})

describe('itemDeArquivo', () => {
  it('nome em destaque e a pasta no detalhe', () => {
    expect(itemDeArquivo({ repoId: 'r1', relativo: 'docs/plano/fatia-12.md' }, repos)).toMatchObject({
      tipo: 'arquivo',
      titulo: 'fatia-12.md',
      detalhe: 'lousa-ia / docs / plano',
    })
  })
})
