import { describe, expect, it, vi } from 'vitest'
import { criarResolverComMemoria, VALIDADE_MS } from './resolverLink'

describe('criarResolverComMemoria (R1.6)', () => {
  it('pergunta uma vez por caminho enquanto vale; depois pergunta de novo', async () => {
    let agora = 0
    const main = vi.fn(async (_r: string, rel: string) => (rel === 'ESTADO.md' ? 'docs/ESTADO.md' : null))
    const resolver = criarResolverComMemoria(main, () => agora)
    expect(await resolver('r1', 'ESTADO.md')).toBe('docs/ESTADO.md')
    expect(await resolver('r1', 'ESTADO.md')).toBe('docs/ESTADO.md')
    expect(await resolver('r1', 'sumiu.md')).toBeNull()
    expect(main).toHaveBeenCalledTimes(2)
    agora = VALIDADE_MS + 1
    await resolver('r1', 'ESTADO.md')
    expect(main).toHaveBeenCalledTimes(3)
  })

  it('pasta diferente e outra pergunta; erro do main vira "nao e link"', async () => {
    const resolver = criarResolverComMemoria(async (repoId) => {
      if (repoId === 'r2') throw new Error('Repositório não encontrado')
      return 'a.md'
    })
    expect(await resolver('r1', 'a.md')).toBe('a.md')
    expect(await resolver('r2', 'a.md')).toBeNull()
  })
})
