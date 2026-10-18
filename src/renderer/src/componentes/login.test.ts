import { describe, expect, it } from 'vitest'
import { extrairLink, limparTerminal, ultimasLinhas, viuNavegador } from './login'

const ESC = '\u001b'
const LINK =
  'https://claude.com/cai/oauth/authorize?code=true&client_id=9d1c250a&response_type=code&redirect_uri=https%3A%2F%2Fplatform.claude.com%2Foauth%2Fcode%2Fcallback&state=AjxvnDZB'

// Como chegou no print do Sidney (17/10/2026): eco do comando, cores e o link quebrado pelo terminal.
const SAIDA =
  `${ESC}[?25l${ESC}[93mPS C:\\Users\\sidne> ${ESC}[0mclaude auth login; exit $LASTEXITCODE\r\n` +
  `Opening browser to sign in…\r\n` +
  `If the browser didn't open, visit: ${ESC}[4m${LINK.slice(0, 90)}\r\n${LINK.slice(90)}${ESC}[24m\r\n` +
  `Paste code here if prompted > `

describe('limparTerminal', () => {
  it('tira cores, cursor e \\r', () => {
    expect(limparTerminal(`${ESC}[93mPS${ESC}[0m ok\r\n`)).toBe('PS ok\n')
    expect(limparTerminal(`${ESC}]0;titulo${ESC}\\texto`)).toBe('texto')
  })
})

describe('extrairLink', () => {
  it('junta o link que o terminal quebrou em linhas', () => {
    expect(extrairLink(SAIDA)).toBe(LINK)
  })

  it('prefere o hiperlink embutido (OSC 8), que vem inteiro', () => {
    const osc8 = `visit: ${ESC}]8;;${LINK}${ESC}\\clique aqui${ESC}]8;;${ESC}\\`
    expect(extrairLink(osc8)).toBe(LINK)
  })

  it('antes do link aparecer: null', () => {
    expect(extrairLink('PS C:\\> claude auth login\r\n')).toBeNull()
  })
})

describe('viuNavegador e ultimasLinhas', () => {
  it('reconhece o "Opening browser" e ignora o eco do comando', () => {
    expect(viuNavegador('PS C:\\> claude auth login\r\n')).toBe(false)
    expect(viuNavegador('Opening browser to sign in…')).toBe(true)
  })

  it('ultimas linhas com texto, sem cores', () => {
    expect(ultimasLinhas(`a\r\n\r\n${ESC}[31mErro: falhou${ESC}[0m\r\n`, 2)).toBe('a\nErro: falhou')
  })
})
