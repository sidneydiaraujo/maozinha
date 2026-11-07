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
  const dev = { dev: 'http://localhost:5173', arquivo: 'file:///C:/app/out/renderer/index.html' }
  const build = { arquivo: 'file:///C:/Program%20Files/Maozinha/resources/app.asar/out/renderer/index.html' }

  it('aceita o servidor de dev e o index.html do build', () => {
    expect(isTrustedUrl('http://localhost:5173/', dev)).toBe(true)
    expect(isTrustedUrl('http://localhost:5173/?desenho=dom#x', dev)).toBe(true)
    expect(isTrustedUrl('file:///C:/Program%20Files/Maozinha/resources/app.asar/out/renderer/index.html', build)).toBe(true)
    // o Chromium pode trocar maiusculas da letra do disco e a query da prova
    expect(isTrustedUrl('file:///c:/program files/maozinha/resources/app.asar/out/renderer/index.html?desenho=dom', build)).toBe(true)
  })

  it('recusa qualquer site externo e origem parecida com a do dev', () => {
    expect(isTrustedUrl('https://example.com', dev)).toBe(false)
    expect(isTrustedUrl('http://localhost:9999/', dev)).toBe(false)
    expect(isTrustedUrl('http://localhost:5173.mal.com/', dev)).toBe(false)
    expect(isTrustedUrl('https://example.com', build)).toBe(false)
    expect(isTrustedUrl('', build)).toBe(false)
  })

  it('recusa outro arquivo local e pasta de rede (R2.7)', () => {
    expect(isTrustedUrl('file:///C:/Users/x/Downloads/pagina.html', build)).toBe(false)
    expect(isTrustedUrl('file://servidor/compartilhada/out/renderer/index.html', build)).toBe(false)
    expect(isTrustedUrl('file:///C:/Program%20Files/Maozinha/resources/app.asar/out/renderer/outra.html', build)).toBe(false)
    // no dev, file:// nao vale
    expect(isTrustedUrl('file:///C:/app/out/renderer/index.html', dev)).toBe(false)
  })
})
