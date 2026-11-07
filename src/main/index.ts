import { app, BrowserWindow, session } from 'electron'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { montarHibernacao, RITMO_NORMAL } from './agentes/montarHibernacao'
import { AvisosDoWindows } from './avisos/notificar'
import { pastaDoSmoke, sonoRapidoNaRodada, usaPastaReal } from './cenario'
import { criarContexto, type Contexto } from './contexto'
import { apagarPastaVazia, situacaoDaPasta, varrerFantasmas } from './copias/fantasmas'
import { rodarGitReal } from './copias/git'
import { registrarHandlersAgentes } from './handlers/agentes'
import { registrarHandlersApp } from './handlers/app'
import { registrarHandlersArquivos } from './handlers/arquivos'
import { registrarHandlersCopias } from './handlers/copias'
import { registrarHandlersLousa } from './handlers/lousa'
import { registrarHandlersMensagens } from './handlers/mensagens'
import { registrarHandlersNotas } from './handlers/notas'
import { registrarHandlersVistas } from './handlers/vistas'
import { registrarHandlersPerfis } from './handlers/perfis'
import { registrarHandlersQuadros } from './handlers/quadros'
import { registrarHandlersRepos } from './handlers/repos'
import { registrarHandlersTerminais } from './handlers/terminais'
import { registrarHandlersTime } from './handlers/time'
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
  log('info', `Mãozinha ${app.getVersion()} abriu (Electron ${process.versions.electron})`)
  process.on('uncaughtExceptionMonitor', (erro) => log('error', 'erro não tratado no main', erro))
  process.on('unhandledRejection', (motivo) => log('error', 'promessa rejeitada no main', motivo))
  app.on('render-process-gone', (_evento, _tela, d) => log('error', `a tela caiu: ${d.reason} (código ${d.exitCode})`))
  app.on('child-process-gone', (_evento, d) => log('error', `processo ${d.type} caiu: ${d.reason}`))
  app.on('will-quit', () => log('info', 'Mãozinha fechou'))
}

/** Registra todos os canais de IPC e garante que os terminais morrem junto com o app. */
function registrarCanais(): void {
  const contexto: Contexto = criarContexto()
  // R3.16: copias cuja pasta sumiu saem da lista antes da janela ler o estado
  varrerFantasmas({
    armazem: contexto.armazem,
    git: rodarGitReal,
    situacao: situacaoDaPasta,
    apagarPastaVazia,
    log: (m) => log('info', m),
  }).catch((erro: unknown) => log('warn', 'a limpeza das cópias sem pasta parou', erro))
  registrarHandlersApp(pastaDosRegistros())
  registrarHandlersPerfis(contexto.perfis)
  registrarHandlersRepos(contexto.repos)
  registrarHandlersQuadros(contexto.quadros, contexto.time)
  registrarHandlersCopias(contexto.repos, rodarGitReal)
  registrarHandlersMensagens(join(app.getPath('userData'), 'mensagens.json'))
  registrarHandlersNotas(contexto.armazem)
  registrarHandlersVistas(contexto.armazem)
  registrarHandlersTime(contexto)
  registrarHandlersLousa(contexto)
  // R3.13: agente parado ha 2 h hiberna (na prova `sono-rapido`, em 3 s)
  const sono = sonoRapidoNaRodada(process.argv, app.isPackaged)
  const ritmo = sono.rapido ? { quietoMs: 3000, varreduraMs: 1000, exigirClaude: !sono.semClaude } : RITMO_NORMAL
  const { hibernacao, parar: pararHibernacao } = montarHibernacao(contexto, ritmo)
  registrarHandlersTerminais(contexto, (id) => hibernacao.mexeu(id))
  registrarHandlersArquivos(contexto.arquivos, contexto.vigia, contexto.repos)
  registrarHandlersAgentes(contexto)
  iniciarPonte(contexto)
  // ferramenta de criar colegas (A19): sem o servidor, os agentes so abrem sem ela
  contexto.mcp.iniciar().catch((erro: unknown) => log('warn', 'o servidor dos agentes não abriu', erro))
  app.on('before-quit', () => {
    pararHibernacao()
    contexto.mcp.parar()
    contexto.terminais.fecharTodos()
    contexto.vigia.fecharTodos()
    contexto.agentes.parar()
  })
}

/** Linha de status dos agentes (T17.2): se a pasta falhar, os agentes so ficam sem painel. */
function iniciarPonte(contexto: Contexto): void {
  try {
    contexto.agentes.iniciar(contexto.quadros.listar().map((q) => q.id))
  } catch (erro) {
    log('warn', 'a pasta dos agentes não abriu; os agentes ficam sem painel', erro)
  }
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

// O nome no Windows virou Salazar (D45) e depois Mãozinha (D50), mas os dados (estado, contas, logins do gh) continuam em
// %APPDATA%/lousa-ia, fixado para nao depender do nome do pacote (nunca no smoke nem nas provas)
if (usaPastaReal(process.argv)) app.setPath('userData', join(app.getPath('appData'), 'lousa-ia'))

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
