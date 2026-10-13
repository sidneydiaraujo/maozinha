import { app } from 'electron'
import { log } from './log'
import { provarPty } from './terminais/smokePty'
import { criarJanelaPrincipal } from './window'

const PRAZO_TELA_MS = 20_000

/**
 * `npm run smoke`: prova o app de ponta a ponta sem mostrar janela.
 * 1. node-pty dentro do Electron; 2. janela escondida carrega a tela,
 * a tela chama o main pelo preload e mostra a versao do Electron.
 */
export async function rodarSmoke(): Promise<number> {
  const ptyOk = await provarPty()
  log(ptyOk ? 'info' : 'error', `smoke: terminal (node-pty) ${ptyOk ? 'ok' : 'FALHOU'}`)

  const telaOk = await provarTela()
  log(telaOk ? 'info' : 'error', `smoke: tela + preload + IPC ${telaOk ? 'ok' : 'FALHOU'}`)
  return ptyOk && telaOk ? 0 : 1
}

async function provarTela(): Promise<boolean> {
  const janela = criarJanelaPrincipal({ mostrar: false })
  const esperado = `Electron ${process.versions.electron}`
  const limite = Date.now() + PRAZO_TELA_MS
  while (Date.now() < limite) {
    await new Promise((r) => setTimeout(r, 300))
    if (janela.webContents.isLoading()) continue
    const texto: unknown = await janela.webContents.executeJavaScript('document.body.innerText')
    if (typeof texto === 'string' && texto.includes(esperado)) {
      janela.destroy()
      return true
    }
  }
  janela.destroy()
  return false
}

export function iniciarSmoke(): void {
  void app
    .whenReady()
    .then(rodarSmoke)
    .then((codigo) => app.exit(codigo))
    .catch((erro: unknown) => {
      log('error', 'smoke: erro inesperado', erro)
      app.exit(1)
    })
}
