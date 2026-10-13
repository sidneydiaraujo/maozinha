import { describe, expect, it } from 'vitest'
import { isTrustedUrl, secureWebPreferences } from './security'

describe('secureWebPreferences', () => {
  it('mantem a tela isolada do Node', () => {
    expect(secureWebPreferences.contextIsolation).toBe(true)
    expect(secureWebPreferences.sandbox).toBe(true)
    expect(secureWebPreferences.nodeIntegration).toBe(false)
    expect(secureWebPreferences.webviewTag).toBe(false)
  })
})

describe('isTrustedUrl', () => {
  const dev = 'http://localhost:5173'

  it('aceita o servidor de dev e os arquivos do build', () => {
    expect(isTrustedUrl('http://localhost:5173/', dev)).toBe(true)
    expect(isTrustedUrl('file:///C:/app/out/renderer/index.html', undefined)).toBe(true)
  })

  it('recusa qualquer site externo', () => {
    expect(isTrustedUrl('https://example.com', dev)).toBe(false)
    expect(isTrustedUrl('http://localhost:9999/', dev)).toBe(false)
    expect(isTrustedUrl('https://example.com', undefined)).toBe(false)
  })
})
