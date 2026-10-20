// Cria uma vez, no inicio do app, os servicos que os canais de IPC usam.
import { app, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { Perfil, StatusConta } from '../shared/model'
import { FilaAjustes } from './agentes/ajustes'
import { adiarReal, discoDaPonte } from './agentes/disco'
import { PonteAgentes } from './agentes/ponte'
import { UsoDasContas } from './agentes/uso'
import { discoReal, observarReal } from './arquivos/disco'
import { rodarGitReal } from './copias/git'
import { ServicoCopias } from './copias/servico'
import { AvisosDoWindows } from './avisos/notificar'
import { ServicoArquivos } from './arquivos/servico'
import { VigiaArquivos } from './arquivos/vigia'
import { criarArmazem, type Armazem } from './estado/armazem'
import { log } from './log'
import { montarAmbiente } from './perfis/ambiente'
import { executarReal, lerStatusConta, localizarClaude } from './perfis/conta'
import { depsReais, detectarPerfis } from './perfis/detectar'
import { ServicoPerfis } from './perfis/servico'
import { ServicoQuadros } from './quadros/servico'
import { copiarSessao } from './quadros/sessoes'
import { ServicoRepos } from './repos/servico'
import { ServicoTerminais } from './terminais/servico'
import { spawnReal } from './terminais/spawnReal'

export interface Contexto {
  perfis: ServicoPerfis
  repos: ServicoRepos
  quadros: ServicoQuadros
  armazem: Armazem
  terminais: ServicoTerminais
  arquivos: ServicoArquivos
  vigia: VigiaArquivos
  avisos: AvisosDoWindows
  agentes: PonteAgentes
  ajustes: FilaAjustes
  usos: UsoDasContas
}

/** Entrega um evento a todas as janelas abertas. */
function enviarParaJanelas(canal: string, payload: unknown): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) janela.webContents.send(canal, payload)
  }
}

function caminhoDoPath(): string {
  const chave = Object.keys(process.env).find((k) => k.toUpperCase() === 'PATH')
  return (chave && process.env[chave]) || ''
}

async function lerContaReal(perfil: Perfil, home: string): Promise<StatusConta> {
  if (perfil.provedor === 'codex') {
    // T1.4b (status do Codex) esta adiada: ver docs/ESTADO.md
    return { logado: false, email: null, plano: null, erro: 'Leitura de contas Codex ainda não disponível' }
  }
  const exe = localizarClaude(home, caminhoDoPath(), existsSync)
  return lerStatusConta(exe, montarAmbiente(perfil, process.env), executarReal)
}

/** "pasta · Claude 1" para a notificacao; null se o terminal nao e de um quadro (login). */
function descreverQuadro(quadros: ServicoQuadros, repos: ServicoRepos, terminalId: string): string | null {
  try {
    const quadro = quadros.obter(terminalId)
    return `${repos.obter(quadro.repoId).nome} · ${quadro.titulo}`
  } catch {
    return null
  }
}

/** A conta do quadro; null se ele ja foi fechado. */
function contaDoQuadro(quadros: ServicoQuadros, quadroId: string): string | null {
  try {
    return quadros.obter(quadroId).perfilId
  } catch {
    return null
  }
}

function ehPasta(caminho: string): boolean {
  try {
    return statSync(caminho).isDirectory()
  } catch {
    return false
  }
}

export function criarContexto(): Contexto {
  const home = app.getPath('home')
  const armazem = criarArmazem(join(app.getPath('userData'), 'estado.json'))
  const perfis = new ServicoPerfis({
    armazem,
    detectar: (ajustes) => detectarPerfis(depsReais(home), ajustes),
    lerConta: (perfil) => lerContaReal(perfil, home),
    home,
    criarPasta: (caminho) => mkdirSync(caminho, { recursive: true }),
  })
  // `quadros` e `repos` sao criados logo abaixo; descrever so roda quando um agente avisa algo
  const avisos = new AvisosDoWindows({
    descrever: (terminalId) => descreverQuadro(quadros, repos, terminalId),
    enviar: enviarParaJanelas,
  })
  const terminais = new ServicoTerminais(spawnReal, {
    aoDados: (terminalId, dados) => enviarParaJanelas(IPC.terminaisDados, { terminalId, dados }),
    aoSair: (terminalId, codigo) => {
      log('info', `terminal saiu: ${terminalId} (código ${codigo})`)
      enviarParaJanelas(IPC.terminaisSaiu, { terminalId, codigo })
    },
    aoEstado: (terminalId, aviso) => {
      enviarParaJanelas(IPC.terminaisEstado, { terminalId, aviso })
      avisos.aoEstado(terminalId, aviso)
      // modelo/esforco pedidos com o agente trabalhando: digita quando ele parar (T19.1)
      void ajustes.aoEstado(terminalId, aviso)
    },
  })
  const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  const ajustes = new FilaAjustes({
    aberto: (id) => terminais.estaAberto(id),
    aviso: (id) => terminais.aviso(id),
    escrever: (id, dados) => terminais.escrever(id, dados),
    esperar,
  })
  const copias = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar })
  const usos = new UsoDasContas()
  // linha de status dos agentes (T17.2, D24): fica so em <userData>\agentes
  const agentes = new PonteAgentes({
    pasta: join(app.getPath('userData'), 'agentes'),
    disco: discoDaPonte,
    agora: Date.now,
    emitir: (quadroId, painel) => {
      enviarParaJanelas(IPC.agentesPainel, { quadroId, painel })
      // os limites de uso sao da conta, nao do quadro (T20.1)
      const perfilId = contaDoQuadro(quadros, quadroId)
      const uso = perfilId ? usos.aoPainel(perfilId, painel) : null
      if (uso) enviarParaJanelas(IPC.perfisUsoMudou, uso)
    },
    adiar: adiarReal,
  })
  // fechar o terminal de um quadro (removido, repo fechado, trocou de conta) leva o painel junto
  const fecharQuadro = (id: string): void => {
    terminais.fechar(id)
    agentes.esquecer(id)
    ajustes.esquecer(id)
  }
  const repos = new ServicoRepos({
    armazem,
    perfis,
    ehPasta,
    fecharTerminal: fecharQuadro,
    novoId: randomUUID,
    copias,
  })
  const quadros = new ServicoQuadros({
    armazem,
    perfis,
    fecharTerminal: fecharQuadro,
    novoId: randomUUID,
    novaSessao: randomUUID,
    copiarSessao,
    esperar,
    copias,
  })
  const arquivos = new ServicoArquivos({ repos, ...discoReal })
  const vigia = new VigiaArquivos(observarReal, (repoId, caminhos) =>
    enviarParaJanelas(IPC.arquivosMudou, { repoId, caminhos }),
  )
  return { perfis, repos, quadros, armazem, terminais, arquivos, vigia, avisos, agentes, ajustes, usos }
}
