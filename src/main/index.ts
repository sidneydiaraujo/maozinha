import { app, BrowserWindow, session } from 'electron'
import { criarContexto } from './contexto'
import { registrarHandlersApp } from './handlers/app'
import { registrarHandlersPerfis } from './handlers/perfis'
import { log } from './log'
import { iniciarSmoke } from './smoke'
import { criarJanelaPrincipal } from './window'

async function iniciar(): Promise<void> {
  await app.whenReady()
  // A tela nunca precisa de camera, microfone, notificacoes do navegador etc.
  session.defaultSession.setPermissionRequestHandler((_conteudo, _permissao, responder) =>
    responder(false),
  )
  registrarHandlersApp()
  registrarHandlersPerfis(criarContexto().perfis)
  criarJanelaPrincipal({ mostrar: true })
}

function focarJanelaExistente(): void {
  const [janela] = BrowserWindow.getAllWindows()
  if (!janela) return
  if (janela.isMinimized()) janela.restore()
  janela.focus()
}

if (process.argv.includes('--smoke')) {
  registrarHandlersApp()
  registrarHandlersPerfis(criarContexto().perfis)
  iniciarSmoke()
} else if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', focarJanelaExistente)
  app.on('window-all-closed', () => app.quit())
  iniciar().catch((erro: unknown) => {
    log('error', 'falha ao iniciar', erro)
    app.exit(1)
  })
}
