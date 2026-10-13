import { BrowserWindow } from 'electron'
import { join } from 'node:path'
import { isTrustedUrl, secureWebPreferences } from './security'

export function criarJanelaPrincipal(opcoes: { mostrar: boolean }): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    title: 'Lousa.ia',
    backgroundColor: '#111318',
    autoHideMenuBar: true,
    webPreferences: { ...secureWebPreferences, preload: join(__dirname, '../preload/index.js') },
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  janela.webContents.on('will-navigate', (evento, url) => {
    if (!isTrustedUrl(url, devUrl)) evento.preventDefault()
  })
  if (opcoes.mostrar) janela.once('ready-to-show', () => janela.show())

  if (devUrl) void janela.loadURL(devUrl)
  else void janela.loadFile(join(__dirname, '../renderer/index.html'))
  return janela
}
