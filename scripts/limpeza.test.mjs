import { describe, expect, it } from 'vitest'
import { instaladoresVelhos, rodadasVelhas } from './limpeza.mjs'

describe('instaladoresVelhos (R3.14)', () => {
  const pasta = [
    'Lousa.ia Setup 0.3.1.exe',
    'Salazar Setup 0.4.2.exe',
    'Salazar Setup 0.4.2.exe.blockmap',
    'Maozinha Setup 0.4.9.exe',
    'Maozinha Setup 0.4.10.exe',
    'Maozinha Setup 0.4.10.exe.blockmap',
    'Maozinha Setup 0.4.11.exe',
    'Maozinha Setup 0.4.11.exe.blockmap',
    'SHA256.txt',
    'latest.yml',
    'win-unpacked',
  ]

  it('guarda os 2 de versao mais nova (0.4.10 vem depois de 0.4.9) e apaga o resto com o blockmap', () => {
    expect(instaladoresVelhos(pasta).sort()).toEqual(
      ['Lousa.ia Setup 0.3.1.exe', 'Maozinha Setup 0.4.9.exe', 'Salazar Setup 0.4.2.exe', 'Salazar Setup 0.4.2.exe.blockmap'].sort(),
    )
  })

  it('nunca toca no que nao e instalador', () => {
    const velhos = instaladoresVelhos(pasta, 0)
    expect(velhos).not.toContain('SHA256.txt')
    expect(velhos).not.toContain('win-unpacked')
    expect(velhos).not.toContain('latest.yml')
  })
})

describe('rodadasVelhas (R3.14)', () => {
  it('guarda as mais novas pela data do nome, de qualquer cenario', () => {
    const nomes = [
      'fatia8-2026-11-07T18-40-06',
      'notas-2026-11-07T18-41-32',
      'copias-2026-10-20T09-00-00',
      'pedir-colegas-2026-11-01T10-00-00',
      'leia.txt',
    ]
    expect(rodadasVelhas(nomes, 2).sort()).toEqual(['copias-2026-10-20T09-00-00', 'pedir-colegas-2026-11-01T10-00-00'])
  })

  it('poucas rodadas: nada a apagar', () => {
    expect(rodadasVelhas(['a-2026-11-07T18-40-06'])).toEqual([])
  })
})
