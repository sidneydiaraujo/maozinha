import { describe, expect, it } from 'vitest'
import { montarAmbiente } from './ambiente'

const pessoal = { id: 'pessoal', provedor: 'claude', configDir: 'C:\\Users\\x\\.claude-pessoal', ehPadrao: false } as const
const principal = { id: 'principal', provedor: 'claude', configDir: 'C:\\Users\\x\\.claude', ehPadrao: true } as const
const codexTrabalho = { id: 'cx:trabalho', provedor: 'codex', configDir: 'C:\\Users\\x\\.codex-trabalho', ehPadrao: false } as const
const codexPadrao = { id: 'cx:padrao', provedor: 'codex', configDir: 'C:\\Users\\x\\.codex', ehPadrao: true } as const

const base = {
  USERPROFILE: 'C:\\Users\\x',
  Path: 'C:\\Windows;C:\\Outros',
  SystemRoot: 'C:\\Windows',
  COMSPEC: 'C:\\Windows\\system32\\cmd.exe',
}

describe('montarAmbiente', () => {
  it('conta Claude nao padrao recebe so CLAUDE_CONFIG_DIR', () => {
    const env = montarAmbiente(pessoal, base)
    expect(env.CLAUDE_CONFIG_DIR).toBe(pessoal.configDir)
    expect(env.CODEX_HOME).toBeUndefined()
  })

  it('conta Codex nao padrao recebe so CODEX_HOME', () => {
    const env = montarAmbiente(codexTrabalho, base)
    expect(env.CODEX_HOME).toBe(codexTrabalho.configDir)
    expect(env.CLAUDE_CONFIG_DIR).toBeUndefined()
  })

  it('contas padrao rodam sem variavel, mesmo com a herdada na base', () => {
    const suja = { ...base, CLAUDE_CONFIG_DIR: 'C:\\errado', CODEX_HOME: 'C:\\errado' }
    expect('CLAUDE_CONFIG_DIR' in montarAmbiente(principal, suja)).toBe(false)
    expect('CODEX_HOME' in montarAmbiente(principal, suja)).toBe(false)
    expect('CLAUDE_CONFIG_DIR' in montarAmbiente(codexPadrao, suja)).toBe(false)
    expect('CODEX_HOME' in montarAmbiente(codexPadrao, suja)).toBe(false)
  })

  it('variavel herdada errada nunca vence a da conta', () => {
    const env = montarAmbiente(pessoal, { ...base, CLAUDE_CONFIG_DIR: 'C:\\errado' })
    expect(env.CLAUDE_CONFIG_DIR).toBe(pessoal.configDir)
  })

  it('nunca repassa HOME, tokens, chaves nem variaveis de outros apps', () => {
    const suja = {
      ...base,
      HOME: 'C:\\casa-falsa',
      GITHUB_TOKEN: 'x',
      GH_TOKEN: 'x',
      ANTHROPIC_API_KEY: 'x',
      OPENAI_API_KEY: 'x',
      CODEX_HOME: 'C:\\errado',
      ELECTRON_RUN_AS_NODE: '1',
      OPENCOVE_TERMINAL_AGENT_TOKEN: 'x',
      MEU_SECRET: 'x',
    }
    for (const perfil of [pessoal, principal, codexTrabalho, codexPadrao]) {
      const env = montarAmbiente(perfil, suja)
      for (const proibida of ['HOME', 'GITHUB_TOKEN', 'GH_TOKEN', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'ELECTRON_RUN_AS_NODE', 'OPENCOVE_TERMINAL_AGENT_TOKEN', 'MEU_SECRET']) {
        expect(proibida in env).toBe(false)
      }
    }
  })

  it('mantem o nome original da chave e poe .local\\bin primeiro sem duplicar PATH', () => {
    const env = montarAmbiente(pessoal, base)
    expect(env.Path).toBe('C:\\Users\\x\\.local\\bin;C:\\Windows;C:\\Outros')
    expect('PATH' in env).toBe(false)
    expect(env.SystemRoot).toBe('C:\\Windows')
  })

  it('.local\\bin ja presente (outra caixa) nao e duplicado', () => {
    const env = montarAmbiente(pessoal, { ...base, Path: 'c:\\users\\X\\.LOCAL\\bin;C:\\Windows' })
    expect(env.Path).toBe('c:\\users\\X\\.LOCAL\\bin;C:\\Windows')
  })

  it('sem USERPROFILE na base nao mexe no PATH', () => {
    const env = montarAmbiente(pessoal, { Path: 'C:\\Windows' })
    expect(env.Path).toBe('C:\\Windows')
  })

  it('acrescenta TERM, COLORTERM e LOUSA_PERFIL', () => {
    const env = montarAmbiente(pessoal, { ...base, TERM: 'dumb' })
    expect(env.TERM).toBe('xterm-256color')
    expect(env.COLORTERM).toBe('truecolor')
    expect(env.LOUSA_PERFIL).toBe('pessoal')
  })

  it('ignora valores indefinidos', () => {
    const env = montarAmbiente(pessoal, { ...base, TEMP: undefined })
    expect('TEMP' in env).toBe(false)
  })

  it('git da conta (D42): identidade e GitHub proprio entram; os herdados do PC nunca', () => {
    const suja = { ...base, GIT_AUTHOR_EMAIL: 'empresa@x.com', GH_CONFIG_DIR: 'C:\\errado', GCM_NAMESPACE: 'git' }
    const comGit = { ...pessoal, git: { nome: 'Ana', email: 'ana@x.com', githubProprio: true } }
    const env = montarAmbiente(comGit, suja, 'C:\\dados')
    expect(env.GIT_AUTHOR_EMAIL).toBe('ana@x.com')
    expect(env.GIT_COMMITTER_NAME).toBe('Ana')
    expect(env.GH_CONFIG_DIR).toBe('C:\\dados\\contas\\pessoal\\gh')
    expect(env.GCM_NAMESPACE).toBe('lousa-pessoal')
    const semGit = montarAmbiente(principal, suja, 'C:\\dados')
    for (const v of ['GIT_AUTHOR_EMAIL', 'GH_CONFIG_DIR', 'GCM_NAMESPACE']) expect(v in semGit).toBe(false)
  })
})
