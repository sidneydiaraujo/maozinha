import { describe, expect, it } from 'vitest'
import { unirPastas } from './vigiar'

describe('unirPastas', () => {
  it('junta os pedidos sem repetir e sempre na mesma ordem', () => {
    const arvore = [
      { repoId: 'b', relativo: '' },
      { repoId: 'a', relativo: 'src' },
      { repoId: 'a', relativo: '' },
    ]
    const leitor = [{ repoId: 'a', relativo: 'src' }]
    expect(unirPastas([arvore, leitor])).toEqual([
      { repoId: 'a', relativo: '' },
      { repoId: 'a', relativo: 'src' },
      { repoId: 'b', relativo: '' },
    ])
    expect(unirPastas([leitor, arvore])).toEqual(unirPastas([arvore, leitor]))
  })

  it('sem pedidos, nenhuma pasta', () => {
    expect(unirPastas([[], []])).toEqual([])
  })
})
