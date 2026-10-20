import { describe, expect, it } from 'vitest'
import { limiteVigente, usoVigente } from './uso'

describe('limiteVigente', () => {
  it('antes de zerar fica como esta', () => {
    expect(limiteVigente({ usado: 42, zeraEm: 2000 }, 1000)).toEqual({ usado: 42, zeraEm: 2000 })
  })
  it('a hora de zerar passou: 0%', () => {
    expect(limiteVigente({ usado: 42, zeraEm: 1000 }, 1000)).toEqual({ usado: 0, zeraEm: null })
  })
  it('sem hora de zerar e sem limite', () => {
    expect(limiteVigente({ usado: 10, zeraEm: null }, 5)).toEqual({ usado: 10, zeraEm: null })
    expect(limiteVigente(null, 5)).toBeNull()
  })
})

describe('usoVigente', () => {
  it('zera so o limite que ja passou', () => {
    const uso = { perfilId: 'p', cincoHoras: { usado: 80, zeraEm: 100 }, semana: { usado: 30, zeraEm: 900 }, quando: 1 }
    expect(usoVigente(uso, 500)).toEqual({ ...uso, cincoHoras: { usado: 0, zeraEm: null } })
  })
})
