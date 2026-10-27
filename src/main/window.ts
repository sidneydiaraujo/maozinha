import { BrowserWindow, screen } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cabeNaTela, estadoDe, lerEstadoJanela, type EstadoJanela } from './janela/estadoJanela'
import { log } from './log'
import { isTrustedUrl, secureWebPreferences } from './security'

interface Opcoes {
  mostrar: boolean
  /** Arquivo onde a janela guarda tamanho e posicao (T8.7); ausente no smoke. */
  lembrarEm?: string
  /** Rodada de prova (T15.2): terminais no desenho normal, que deixa o texto no HTML. */
  desenho?: 'dom'
}

/** O salvo, se o arquivo existe e a janela ainda cabe numa tela ligada. */
function estadoSalvo(caminho: string | undefined): EstadoJanela | null {
  if (!caminho) return null
  let texto: string
  try {
    texto = readFileSync(caminho, 'utf8')
  } catch {
    return null // primeira abertura
  }
  const salvo = lerEstadoJanela(texto)
  const telas = screen.getAllDisplays().map((d) => d.workArea)
  return salvo && cabeNaTela(salvo, telas) ? salvo : null
}

/** Ao fechar, guarda a caixa "normal" (a de antes de maximizar) e se estava maximizada. */
function lembrarAoFechar(janela: BrowserWindow, caminho: string): void {
  janela.on('close', () => {
    try {
      writeFileSync(caminho, JSON.stringify(estadoDe(janela.getNormalBounds(), janela.isMaximized())))
    } catch (erro) {
      log('warn', 'não guardou o tamanho da janela', erro)
    }
  })
}

export function criarJanelaPrincipal(opcoes: Opcoes): BrowserWindow {
  const salvo = estadoSalvo(opcoes.lembrarEm)
  const janela = new BrowserWindow({
    ...(salvo ? { x: salvo.x, y: salvo.y, width: salvo.largura, height: salvo.altura } : { width: 1400, height: 900 }),
    show: false,
    title: 'Salazar',
    backgroundColor: '#111318',
    autoHideMenuBar: true,
    webPreferences: { ...secureWebPreferences, preload: join(__dirname, '../preload/index.js') },
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  janela.webContents.on('will-navigate', (evento, url) => {
    if (!isTrustedUrl(url, devUrl)) evento.preventDefault()
  })
  if (opcoes.lembrarEm) lembrarAoFechar(janela, opcoes.lembrarEm)
  if (opcoes.mostrar) {
    janela.once('ready-to-show', () => {
      if (salvo?.maximizada) janela.maximize()
      janela.show()
    })
  }

  const query: Record<string, string> = opcoes.desenho ? { desenho: opcoes.desenho } : {}
  if (devUrl) void janela.loadURL(opcoes.desenho ? `${devUrl}?desenho=${opcoes.desenho}` : devUrl)
  else void janela.loadFile(join(__dirname, '../renderer/index.html'), { query })
  return janela
}
