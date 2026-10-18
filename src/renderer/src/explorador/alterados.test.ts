import { describe, expect, it } from 'vitest'
import {
  ESCREVENDO_MS,
  VALIDADE_MS,
  anotar,
  haQuanto,
  limpar,
  marcaDaPasta,
  marcaDoArquivo,
  recentes,
} from './alterados'

const T = 1_000_000

describe('alterados', () => {
  it('arquivo: escrevendo nos primeiros 4 s, alterado ate 30 min, depois nada', () => {
    const a = anotar(new Map(), 'r1', ['docs/x.md'], T)
    expect(marcaDoArquivo(a, 'r1', 'docs/x.md', T + 1000)).toBe('escrevendo')
    expect(marcaDoArquivo(a, 'r1', 'docs/x.md', T + ESCREVENDO_MS)).toBe('alterado')
    expect(marcaDoArquivo(a, 'r1', 'docs/x.md', T + VALIDADE_MS)).toBeNull()
    expect(marcaDoArquivo(a, 'r2', 'docs/x.md', T)).toBeNull()
  })

  it('a marca sobe para as pastas, com o mais recente de dentro', () => {
    let a = anotar(new Map(), 'r1', ['docs/aceite/roteiro.md'], T)
    a = anotar(a, 'r1', ['docs/ESTADO.md'], T + ESCREVENDO_MS + 10)
    const agora = T + ESCREVENDO_MS + 20
    expect(marcaDaPasta(a, 'r1', 'docs', agora)).toBe('escrevendo')
    expect(marcaDaPasta(a, 'r1', 'docs/aceite', agora)).toBe('alterado')
    expect(marcaDaPasta(a, 'r1', '', agora)).toBe('escrevendo')
    expect(marcaDaPasta(a, 'r1', 'src', agora)).toBeNull()
    // "doc" nao e prefixo de pasta de "docs/..."
    expect(marcaDaPasta(a, 'r1', 'doc', agora)).toBeNull()
  })

  it('recentes: mais novos primeiro, sem os vencidos, ate o limite', () => {
    let a = anotar(new Map(), 'r1', ['velho.md'], T - VALIDADE_MS)
    a = anotar(a, 'r1', ['a.md', 'b.md'], T)
    a = anotar(a, 'r2', ['c.md'], T + 5)
    expect(recentes(a, T + 10).map((r) => `${r.repoId}:${r.relativo}`)).toEqual(['r2:c.md', 'r1:a.md', 'r1:b.md'])
    expect(recentes(a, T + 10, 1)).toHaveLength(1)
    expect(limpar(a, T + 10).size).toBe(3)
  })

  it('haQuanto em portugues', () => {
    expect(haQuanto(T, T + 3000)).toBe('agora')
    expect(haQuanto(T, T + 42_000)).toBe('há 42 s')
    expect(haQuanto(T, T + 5 * 60_000)).toBe('há 5 min')
  })
})
