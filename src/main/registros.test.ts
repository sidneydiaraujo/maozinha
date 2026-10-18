import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { iniciarRegistros, nomeDoDia, velhos } from './registros'

describe('nomeDoDia', () => {
  it('data do PC com zeros a esquerda', () => {
    expect(nomeDoDia(new Date(2026, 9, 18, 23, 59))).toBe('lousa-2026-10-18.log')
    expect(nomeDoDia(new Date(2026, 0, 5))).toBe('lousa-2026-01-05.log')
  })
})

describe('velhos', () => {
  it('so registros com mais de 14 dias; outros arquivos nunca', () => {
    const hoje = new Date(2026, 9, 18, 10)
    expect(
      velhos(
        ['lousa-2026-10-18.log', 'lousa-2026-10-04.log', 'lousa-2026-10-03.log', 'lousa-2025-12-31.log', 'outro.log', 'lousa-x.log'],
        hoje,
      ),
    ).toEqual(['lousa-2026-10-03.log', 'lousa-2025-12-31.log'])
  })
})

describe('iniciarRegistros', () => {
  it('cria a pasta, apaga os velhos e grava no arquivo do dia, trocando a meia-noite', () => {
    const pasta = join(mkdtempSync(join(tmpdir(), 'lousa-reg-')), 'logs', 'novo')
    let agora = new Date(2026, 9, 18, 23, 59)
    const gravar = iniciarRegistros(pasta, () => agora)
    writeFileSync(join(pasta, 'lousa-2026-09-01.log'), 'velho\n')
    writeFileSync(join(pasta, 'anotacao.txt'), 'meu\n')
    gravar('linha 1\n')
    agora = new Date(2026, 9, 19, 0, 1)
    gravar('linha 2\n')
    expect(readFileSync(join(pasta, 'lousa-2026-10-18.log'), 'utf8')).toBe('linha 1\n')
    expect(readFileSync(join(pasta, 'lousa-2026-10-19.log'), 'utf8')).toBe('linha 2\n')
    // o velho criado depois de iniciar so sai na proxima abertura; outros arquivos ficam sempre
    iniciarRegistros(pasta, () => agora)
    expect(readdirSync(pasta).sort()).toEqual(['anotacao.txt', 'lousa-2026-10-18.log', 'lousa-2026-10-19.log'])
  })
})
