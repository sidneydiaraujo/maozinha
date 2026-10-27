// Cria uma vez, no inicio do app, os servicos que os canais de IPC usam.
import { app, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { Perfil, StatusConta } from '../shared/model'
import type { DadosTime } from '../shared/time'
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
import { rodarReal, temClaudeDentro } from './terminais/filhos'
import { ApresentadorTime, FilaMensagens } from './time/apresentar'
import { Repasse } from './time/repasse'
import { provedoresDos, ServicoTime } from './time/servico'

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
  /** Time de agentes (T29.1): chame `mudou()` quando linha, colega, papel ou quadro mudar. */
  time: ApresentadorTime
  /** Passar o trabalho adiante (T30.1): `digitou` zera o freio do time. */
  repasse: Repasse
  /** O claude.exe ainda roda no terminal do quadro? Ele nao avisa quando sai (D39). */
  temClaude(quadroId: string): Promise<boolean>
}

/** Pergunta ao Windows se o PowerShell do quadro tem um claude.exe filho (terminais/filhos.ts). */
function temClaudeEm(terminais: ServicoTerminais): (quadroId: string) => Promise<boolean> {
  return async (id) => {
    const pid = terminais.pid(id)
    return pid !== null && temClaudeDentro(pid, rodarReal)
  }
}

/** Fila de mensagens aos agentes e apresentador do time (T29.1). */
function montarTime(d: {
  armazem: Armazem
  perfis: ServicoPerfis
  terminais: ServicoTerminais
  esperar(ms: number): Promise<void>
  temClaude(quadroId: string): Promise<boolean>
}): { mensagens: FilaMensagens; time: ApresentadorTime; repasse: Repasse; esquecer(quadroId: string): void } {
  const { armazem, perfis, terminais } = d
  const dados = (): DadosTime => {
    const e = armazem.carregar()
    const provedores = provedoresDos(e.quadros, (id) => perfis.obter(id))
    return { quadros: e.quadros, repos: e.repos, ligacoes: e.ligacoes ?? [], provedores }
  }
  const linhas = new ServicoTime({ armazem, perfis, novoId: randomUUID })
  // a fila e criada logo abaixo; o repasse so a usa quando um agente termina
  const repasse = new Repasse({
    dados,
    fila: { enfileirar: (id, texto) => mensagens.enfileirar(id, texto) },
    aberto: (id) => terminais.estaAberto(id),
    ajustar: (id, mudanca) => linhas.ajustar(id, mudanca),
    avisar: (evento) => enviarParaJanelas(IPC.timeRepasse, evento),
  })
  const mensagens = new FilaMensagens({
    aberto: (id) => terminais.estaAberto(id),
    aviso: (id) => terminais.aviso(id),
    pronto: (id) => terminais.pronto(id),
    escrever: (id, dados) => terminais.escrever(id, dados),
    esperar: d.esperar,
    temClaude: d.temClaude,
  }, (id, tipo) => repasse.aoDigitar(id, tipo))
  const time = new ApresentadorTime({
    dados,
    fila: mensagens,
    adiar: (fn, ms) => {
      const t = setTimeout(fn, ms)
      return () => clearTimeout(t)
    },
  })
  const esquecer = (id: string): void => {
    mensagens.esquecer(id)
    repasse.esquecer(id)
  }
  return { mensagens, time, repasse, esquecer }
}

/**
 * Troca de modelo/esforco (D48): reabrir fecha o terminal, apaga o painel velho (`esquecerPainel`)
 * e pede a tela para abrir de novo; o comando novo le o modelo salvo no quadro e retoma a conversa.
 */
function montarAjustes(
  terminais: ServicoTerminais,
  temClaude: (quadroId: string) => Promise<boolean>,
  esquecerPainel: (quadroId: string) => void,
): FilaAjustes {
  return new FilaAjustes({
    aberto: (id) => terminais.estaAberto(id),
    aviso: (id) => terminais.aviso(id),
    pronto: (id) => terminais.pronto(id),
    temClaude,
    reabrir: (id) => {
      terminais.fechar(id)
      esquecerPainel(id)
      enviarParaJanelas(IPC.agentesReabrir, { quadroId: id })
    },
  })
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
      // modelo/esforco pedidos com o agente trabalhando: reabre quando ele parar (T19.1, D48)
      void ajustes.aoEstado(terminalId, aviso)
      // apresentacao do time pedida com o agente ocupado: digita quando ele parar (T29.1)
      void mensagens.aoEstado(terminalId, aviso)
      void repasse.aoEstado(terminalId, aviso.estado, aviso.mensagem) // fim da vez passa adiante (T30.1)
    },
  })
  const esperar = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
  const temClaude = temClaudeEm(terminais)
  // `agentes` e criado logo abaixo; reabrir so roda quando o Sidney troca o modelo
  const ajustes = montarAjustes(terminais, temClaude, (id) => agentes.esquecer(id))
  const { mensagens, time, repasse, esquecer } = montarTime({ armazem, perfis, terminais, esperar, temClaude })
  const copias = new ServicoCopias({ git: rodarGitReal, existe: existsSync, esperar })
  const usos = new UsoDasContas()
  // linha de status dos agentes (T17.2, D24): fica so em <userData>\agentes
  const agentes = new PonteAgentes({
    pasta: join(app.getPath('userData'), 'agentes'),
    disco: discoDaPonte,
    agora: Date.now,
    emitir: (quadroId, painel) => {
      enviarParaJanelas(IPC.agentesPainel, { quadroId, painel })
      // a primeira linha de status: o Claude esta pronto para receber (D48)
      if (terminais.marcarPronto(quadroId)) {
        void ajustes.aoPronto(quadroId)
        void mensagens.aoPronto(quadroId)
      }
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
    esquecer(id)
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
  return { perfis, repos, quadros, armazem, terminais, arquivos, vigia, avisos, agentes, ajustes, usos, time, repasse, temClaude }
}
