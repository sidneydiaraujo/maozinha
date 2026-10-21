import { describe, expect, it } from 'vitest'
import { frasesDoResultado } from './juntarTime'

const vazio = { juntadas: [], semNovidade: [], deFora: [], parou: null, faltam: [] }

describe('frasesDoResultado', () => {
  it('tudo juntado: uma linha por copia e o lembrete de fechar os quadros', () => {
    expect(frasesDoResultado({ ...vazio, juntadas: [{ apelido: 'c1', branchAlvo: 'main' }] })).toEqual([
      '✓ c1 juntada em main',
      'As cópias continuam abertas: feche os quadros para apagá-las.',
    ])
  })

  it('parou: diz onde, o que ficou de fora e o que nao foi tentado; sem o lembrete', () => {
    const r = {
      ...vazio,
      juntadas: [{ apelido: 'c1', branchAlvo: 'main' }],
      semNovidade: ['c4'],
      deFora: ['c2'],
      parou: { quadroId: 'b', apelido: 'c3', branch: 'lousa/c3', branchAlvo: 'main', erro: 'Conflito: x' },
      faltam: ['c5'],
    }
    expect(frasesDoResultado(r)).toEqual([
      '✓ c1 juntada em main',
      'Sem nada novo: c4',
      'Ficou de fora (tem alteração não salva): c2',
      'Parou em c3: Conflito: x',
      'Não tentadas: c5',
    ])
  })
})
