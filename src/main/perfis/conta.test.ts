import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { executarReal, interpretarStatus, lerStatusConta, localizarClaude, type Executar } from './conta'

// Formato real do Claude Code 2.1.296 (e-mail trocado por exemplo).
const JSON_REAL = JSON.stringify({
  loggedIn: true,
  authMethod: 'claude.ai',
  apiProvider: 'firstParty',
  analyticsDisabled: false,
  projectsDirectory: 'C:\\Users\\pessoa\\.claude-pessoal\\projects',
  configDirectory: 'C:\\Users\\pessoa\\.claude-pessoal',
  email: 'pessoa@exemplo.com',
  orgId: '00000000-0000-0000-0000-000000000000',
  orgName: "pessoa@exemplo.com's Organization",
  subscriptionType: 'pro',
}, null, 2)

describe('interpretarStatus', () => {
  it('le e-mail e plano do formato real', () => {
    expect(interpretarStatus(JSON_REAL)).toEqual({ logado: true, email: 'pessoa@exemplo.com', plano: 'pro', erro: null })
  })

  it('nao logado nao e erro', () => {
    expect(interpretarStatus('{"loggedIn": false}')).toEqual({ logado: false, email: null, plano: null, erro: null })
  })

  it('ignora texto antes e depois do JSON', () => {
    const r = interpretarStatus(`aviso qualquer\n${JSON_REAL}\nfim`)
    expect(r.email).toBe('pessoa@exemplo.com')
  })

  it('lixo vira erro de resposta inesperada', () => {
    for (const lixo of ['', 'nada de json', '{quebrado', '{"outra":1}', '[]']) {
      expect(interpretarStatus(lixo).erro).toBe('Resposta inesperada do claude auth status')
    }
  })
})

describe('lerStatusConta', () => {
  it('sem executavel avisa que o Claude Code nao foi encontrado', async () => {
    const r = await lerStatusConta(null, {}, async () => ({ codigo: 0, stdout: '', stderr: '' }))
    expect(r.erro).toBe('Claude Code não encontrado')
    expect(r.logado).toBe(false)
  })

  it('chama auth status --json com o ambiente da conta', async () => {
    const chamadas: Array<[string, string[], Record<string, string>]> = []
    const executar: Executar = async (arquivo, args, env) => {
      chamadas.push([arquivo, args, env])
      return { codigo: 0, stdout: JSON_REAL, stderr: 'aviso no stderr' }
    }
    const r = await lerStatusConta('C:\\bin\\claude.exe', { CLAUDE_CONFIG_DIR: 'C:\\conta' }, executar)
    expect(chamadas).toEqual([['C:\\bin\\claude.exe', ['auth', 'status', '--json'], { CLAUDE_CONFIG_DIR: 'C:\\conta' }]])
    expect(r.email).toBe('pessoa@exemplo.com')
  })

  it('executar que lanca vira falha legivel', async () => {
    const r = await lerStatusConta('x', {}, async () => {
      throw new Error('tempo esgotado')
    })
    expect(r.erro).toBe('Falha ao consultar a conta: tempo esgotado')
  })
})

describe('localizarClaude', () => {
  const home = join('C:', 'Users', 'x')
  const nativo = join(home, '.local', 'bin', 'claude.exe')

  it('prefere ~/.local/bin', () => {
    expect(localizarClaude(home, 'C:\\Outro', (c) => c === nativo)).toBe(nativo)
  })

  it('senao procura no PATH, exe antes de cmd', () => {
    const cmd = join('C:\\npm', 'claude.cmd')
    expect(localizarClaude(home, 'C:\\vazio;C:\\npm', (c) => c === cmd)).toBe(cmd)
    const exe = join('C:\\apps', 'claude.exe')
    expect(localizarClaude(home, 'C:\\npm;C:\\apps', (c) => c === exe || c === join('C:\\npm', 'claude.cmd'))).toBe(exe)
  })

  it('nada encontrado devolve null', () => {
    expect(localizarClaude(home, 'C:\\a;C:\\b', () => false)).toBeNull()
  })
})

describe('executarReal', () => {
  it('devolve a saida mesmo com codigo diferente de zero', async () => {
    const r = await executarReal(process.execPath, ['-e', "console.log('ola');process.exit(3)"], { ...process.env } as Record<string, string>)
    expect(r.codigo).toBe(3)
    expect(r.stdout.trim()).toBe('ola')
  })

  it('rejeita quando o programa nao existe', async () => {
    await expect(executarReal('C:\\nao\\existe.exe', [], {})).rejects.toThrow()
  })
})
