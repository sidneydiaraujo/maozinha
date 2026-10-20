import { app, BrowserWindow, session } from 'electron'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AvisosDoWindows } from './avisos/notificar'
import { pastaDoSmoke } from './cenario'
import { criarContexto, type Contexto } from './contexto'
import { rodarGitReal } from './copias/git'
import { registrarHandlersApp } from './handlers/app'
import { registrarHandlersArquivos } from './handlers/arquivos'
import { registrarHandlersCopias } from './handlers/copias'
import { registrarHandlersLousa } from './handlers/lousa'
import { registrarHandlersPerfis } from './handlers/perfis'
import { registrarHandlersQuadros } from './handlers/quadros'
import { registrarHandlersRepos } from './handlers/repos'
import { registrarHandlersTerminais } from './handlers/terminais'
import { gravarEm, log } from './log'
import { iniciarRegistros } from './registros'
import { iniciarSmoke } from './smoke'
import { criarJanelaPrincipal } from './window'

/** <userData>\logs: com --user-data-dir (testes) os registros vao junto para a pasta de teste. */
const pastaDosRegistros = (): string => join(app.getPath('userData'), 'logs')

/** Arquivo de registros (T8.6): abertura, fechamento, erros do main e da tela. Fora do smoke. */
function ligarRegistros(): void {
  try {
    gravarEm(iniciarRegistros(pastaDosRegistros()))
  } catch (erro) {
    log('warn', 'sem arquivo de registros (segue so no console)', erro)
  }
  log('info', `Lousa.ia ${app.getVersion()} abriu (Electron ${process.versions.electron})`)
  process.on('uncaughtExceptionMonitor', (erro) => log('error', 'erro não tratado no main', erro))
  process.on('unhandledRejection', (motivo) => log('error', 'promessa rejeitada no main', motivo))
  app.on('render-process-gone', (_evento, _tela, d) => log('error', `a tela caiu: ${d.reason} (código ${d.exitCode})`))
  app.on('child-process-gone', (_evento, d) => log('error', `processo ${d.type} caiu: ${d.reason}`))
  app.on('will-quit', () => log('info', 'Lousa.ia fechou'))
}

/** Registra todos os canais de IPC e garante que os terminais morrem junto com o app. */
function registrarCanais(): void {
  const contexto: Contexto = criarContexto()
  registrarHandlersApp(pastaDosRegistros())
  registrarHandlersPerfis(contexto.perfis)
  registrarHandlersRepos(contexto.repos)
  registrarHandlersQuadros(contexto.quadros)
  registrarHandlersCopias(contexto.repos, rodarGitReal)
  registrarHandlersLousa(contexto)
  registrarHandlersTerminais(contexto.terminais, contexto.perfis, contexto.quadros, contexto.repos)
  registrarHandlersArquivos(contexto.arquivos, contexto.vigia, contexto.repos)
  app.on('before-quit', () => {
    contexto.terminais.fecharTodos()
    contexto.vigia.fecharTodos()
  })
}

async function iniciar(): Promise<void> {
  // Mesmo id do instalador (electron-builder.yml): sem ele o Windows nao mostra a notificacao
  app.setAppUserModelId('ia.lousa.app')
  app.on('browser-window-focus', (_evento, janela) => AvisosDoWindows.pararDePiscar(janela))
  await app.whenReady()
  // A tela nunca precisa de camera, microfone, notificacoes do navegador etc.
  session.defaultSession.setPermissionRequestHandler((_conteudo, _permissao, responder) =>
    responder(false),
  )
  registrarCanais()
  criarJanelaPrincipal({ mostrar: true, lembrarEm: join(app.getPath('userData'), 'janela.json') })
}

function focarJanelaExistente(): void {
  const [janela] = BrowserWindow.getAllWindows()
  if (!janela) return
  if (janela.isMinimized()) janela.restore()
  janela.focus()
}

if (process.argv.includes('--smoke')) {
  // antes de registrarCanais: o contexto le o estado de dentro da pasta de dados
  const pasta = pastaDoSmoke(process.argv, tmpdir())
  if (pasta) app.setPath('userData', pasta)
  registrarCanais()
  iniciarSmoke()
} else if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  ligarRegistros()
  app.on('second-instance', focarJanelaExistente)
  app.on('window-all-closed', () => app.quit())
  iniciar().catch((erro: unknown) => {
    log('error', 'falha ao iniciar', erro)
    app.exit(1)
  })
}
