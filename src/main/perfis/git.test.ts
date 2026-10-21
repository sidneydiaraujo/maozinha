import { describe, expect, it } from 'vitest'
import { normalizarGit, pastaGithub, variaveisDoGit } from './git'

const DADOS = 'C:\\Users\\x\\AppData\\Roaming\\lousa-ia'

describe('normalizarGit', () => {
  it('apara os textos e troca vazio por null', () => {
    expect(normalizarGit({ nome: '  Ana  ', email: ' ', githubProprio: false })).toEqual({
      nome: 'Ana',
      email: null,
      githubProprio: false,
    })
  })

  it('tudo vazio e sem GitHub proprio = sem git da conta', () => {
    expect(normalizarGit({ nome: '', email: null, githubProprio: false })).toBeNull()
    expect(normalizarGit(null)).toBeNull()
  })

  it('so o GitHub proprio ligado ja conta', () => {
    expect(normalizarGit({ nome: null, email: null, githubProprio: true })).toEqual({
      nome: null,
      email: null,
      githubProprio: true,
    })
  })

  it('recusa e-mail sem @ e nome com quebra de linha', () => {
    expect(() => normalizarGit({ nome: null, email: 'ana.exemplo.com', githubProprio: false })).toThrow('E-mail inválido')
    expect(() => normalizarGit({ nome: 'Ana\nX', email: null, githubProprio: false })).toThrow('Nome com caractere inválido')
  })
})

describe('variaveisDoGit', () => {
  it('sem git da conta nao acrescenta nada', () => {
    expect(variaveisDoGit('pessoal', undefined, DADOS)).toEqual({})
  })

  it('nome e e-mail valem para autor e para quem commita', () => {
    expect(variaveisDoGit('pessoal', { nome: 'Ana', email: 'ana@x.com', githubProprio: false }, DADOS)).toEqual({
      GIT_AUTHOR_NAME: 'Ana',
      GIT_COMMITTER_NAME: 'Ana',
      GIT_AUTHOR_EMAIL: 'ana@x.com',
      GIT_COMMITTER_EMAIL: 'ana@x.com',
    })
  })

  it('GitHub proprio: pasta do gh nos dados da Lousa e gaveta propria de credenciais', () => {
    const env = variaveisDoGit('cx:trabalho', { nome: null, email: null, githubProprio: true }, DADOS)
    expect(env).toEqual({
      GH_CONFIG_DIR: `${DADOS}\\contas\\cx-trabalho\\gh`,
      GCM_NAMESPACE: 'lousa-cx-trabalho',
    })
  })

  it('a pasta do gh nunca cai numa pasta de conta (~/.claude*, ~/.codex*)', () => {
    const pasta = pastaGithub(DADOS, 'pessoal')
    expect(pasta.startsWith(DADOS)).toBe(true)
    expect(pasta).not.toMatch(/\\\.(claude|codex)/i)
  })

  it('sem pasta de dados (leitura do login) nao liga o GitHub proprio', () => {
    expect(variaveisDoGit('pessoal', { nome: null, email: null, githubProprio: true }, null)).toEqual({})
  })
})
