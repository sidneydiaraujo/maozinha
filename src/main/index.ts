import { app, BrowserWindow, session } from 'electron'
import { criarContexto, type Contexto } from './contexto'
import { registrarHandlersApp } from './handlers/app'
import { registrarHandlersLousa } from './handlers/lousa'
import { registrarHandlersPerfis } from './handlers/perfis'
import { registrarHandlersQuadros } from './handlers/quadros'
import { registrarHandlersRepos } from './handlers/repos'
import { registrarHandlersTerminais } from './handlers/terminais'
import { log } from './log'
import { iniciarSmoke } from './smoke'
import { criarJanelaPrincipal } from './window'

/** Registra todos os canais de IPC e garante que os terminais morrem junto com o app. */
function registrarCanais(): void {
  const contexto: Contexto = criarContexto()
  registrarHandlersApp()
  registrarHandlersPerfis(contexto.perfis)
  registrarHandlersRepos(contexto.repos)
  registrarHandlersQuadros(contexto.quadros)
  registrarHandlersLousa(contexto)
  registrarHandlersTerminais(contexto.terminais, contexto.perfis, contexto.quadros, contexto.repos)
  app.on('before-quit', () => contexto.terminais.fecharTodos())
}

async function iniciar(): Promise<void> {
  await app.whenReady()
  // A tela nunca precisa de camera, microfone, notificacoes do navegador etc.
  session.defaultSession.setPermissionRequestHandler((_conteudo, _permissao, responder) =>
    responder(false),
  )
  registrarCanais()
  criarJanelaPrincipal({ mostrar: true })
}

function focarJanelaExistente(): void {
  const [janela] = BrowserWindow.getAllWindows()
  if (!janela) return
  if (janela.isMinimized()) janela.restore()
  janela.focus()
}

if (process.argv.includes('--smoke')) {
  registrarCanais()
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
