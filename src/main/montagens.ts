// Montagens do contexto (A17: saiu de contexto.ts pelo teto de linhas): a fila de mensagens e o
// apresentador do time (T29.1), o repasse (T30.1), a troca de modelo (D49), onde cada agente salva
// (A16) e o aviso as janelas.
import { app, BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import type { ColegaPedido, Repo } from '../shared/model'
import { nomeNoTime, type DadosTime } from '../shared/time'
import { FilaAjustes } from './agentes/ajustes'
import type { Armazem } from './estado/armazem'
import { kanbanNaPastaDoProjeto } from './kanban/disco'
import { ARQUIVO_KANBAN } from './kanban/kanban'
import { ehProjeto, pastaDoProjeto } from './kanban/projeto'
import { ServidorMcp } from './mcp/servidor'
import type { ServicoPerfis } from './perfis/servico'
import type { ServicoQuadros } from './quadros/servico'
import type { ServicoRepos } from './repos/servico'
import type { ServicoTerminais } from './terminais/servico'
import { rodarReal, temClaudeDentro } from './terminais/filhos'
import { ApresentadorTime, FilaMensagens } from './time/apresentar'
import { criarColega, type DepsColega } from './time/colega'
import { PedidosDeColegas, textoDaTarefa } from './time/pedidos'
import { Repasse } from './time/repasse'
import { provedoresDos, ServicoTime } from './time/servico'

/** Pergunta ao Windows se o PowerShell do quadro tem um claude.exe filho (terminais/filhos.ts). */
export function temClaudeEm(terminais: ServicoTerminais): (quadroId: string) => Promise<boolean> {
  return async (id) => {
    const pid = terminais.pid(id)
    return pid !== null && temClaudeDentro(pid, rodarReal)
  }
}

/** Fila de mensagens aos agentes e apresentador do time (T29.1). */
export function montarTime(d: {
  armazem: Armazem
  perfis: ServicoPerfis
  terminais: ServicoTerminais
  esperar(ms: number): Promise<void>
  temClaude(quadroId: string): Promise<boolean>
  /** Troca de modelo esperando: a mensagem vai para o agente reaberto (A15). */
  segurar(quadroId: string): boolean
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
    segurar: d.segurar,
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
 * Troca de modelo/esforco (D49): reabrir fecha o terminal, apaga o painel velho (`esquecerPainel`)
 * e pede a tela para abrir de novo; o comando novo le o modelo salvo no quadro e retoma a conversa.
 */
export function montarAjustes(
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
export function enviarParaJanelas(canal: string, payload: unknown): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) janela.webContents.send(canal, payload)
  }
}

/**
 * Onde cada agente salva (A16): o gancho de escrita da ponte traz o arquivo; daqui sai a pasta do
 * projeto para a bolinha da lateral (so quando muda). Pasta aberta que nao e projeto (a home): o
 * kanban nasce na pasta do projeto (D52).
 */
export function montarOndeEscreve(d: {
  quadros: ServicoQuadros
  repos: ServicoRepos
  existe(caminho: string): boolean
  avisarArvore(repoId: string, caminhos: string[]): void
}): { aoEscrever(quadroId: string, arquivo: string): void; esquecer(quadroId: string): void } {
  const ultimos = new Map<string, string>()
  const aoEscrever = (quadroId: string, arquivo: string): void => {
    let repo: Repo
    try {
      repo = d.repos.obter(d.quadros.obter(quadroId).repoId)
    } catch {
      return // o quadro ou a pasta sairam da lousa
    }
    const relativo = pastaDoProjeto(arquivo, repo.caminho, d.existe)
    if (relativo === null) return
    if (!ehProjeto(repo.caminho, d.existe)) {
      const kanban = relativo ? `${relativo}/${ARQUIVO_KANBAN}` : ARQUIVO_KANBAN
      kanbanNaPastaDoProjeto(join(repo.caminho, relativo), () => d.avisarArvore(repo.id, [kanban]))
    }
    const chave = `${repo.id}|${relativo}`
    if (ultimos.get(quadroId) === chave) return
    ultimos.set(quadroId, chave)
    enviarParaJanelas(IPC.agentesEscrevendo, { quadroId, repoId: repo.id, relativo })
  }
  return { aoEscrever, esquecer: (id) => void ultimos.delete(id) }
}

/** Folga entre os colegas pedidos, empilhados a direita de quem pediu. */
const FOLGA_COLEGAS = 40

/**
 * Colegas pedidos pelo agente (A19, D56): o servidor MCP recebe o pedido, a tela pergunta, e so
 * com o aceite o colega nasce (mesma conta, copia propria, ligado), com o papel e a tarefa na fila.
 */
export function montarPedidos(d: {
  armazem: Armazem
  perfis: ServicoPerfis
  quadros: ServicoQuadros
  mensagens: Pick<FilaMensagens, 'enfileirar'>
  time: Pick<ApresentadorTime, 'mudou'>
}): { pedidos: PedidosDeColegas; mcp: ServidorMcp } {
  const { armazem, perfis, quadros } = d
  const deps: DepsColega = {
    armazem,
    quadros,
    time: new ServicoTime({ armazem, perfis, novoId: randomUUID }),
    ehClaude: (perfilId) => perfis.obter(perfilId).provedor === 'claude',
  }
  const nome = (id: string): string => {
    const e = armazem.carregar()
    return nomeNoTime({ quadros: e.quadros, repos: e.repos, ligacoes: e.ligacoes ?? [], provedores: {} }, id)
  }
  const criar = async (quadroId: string, colegas: ColegaPedido[]): Promise<string[]> => {
    const { caixa } = quadros.obter(quadroId)
    const nomes: string[] = []
    for (const [i, c] of colegas.entries()) {
      const posicao = { x: caixa.x + caixa.largura + FOLGA_COLEGAS, y: caixa.y + i * (caixa.altura + FOLGA_COLEGAS) }
      const novo = await criarColega(deps, quadroId, { posicao })
      const quadro = quadros.definirPapel(novo.quadro.id, c.papel)
      enviarParaJanelas(IPC.timeColegaCriado, { ...novo, quadro })
      // a tarefa espera o colega abrir e ficar pronto (a apresentacao do time sai antes)
      void d.mensagens.enfileirar(quadro.id, textoDaTarefa(nome(quadroId), c.tarefa))
      nomes.push(quadro.papel ?? quadro.titulo)
    }
    d.time.mudou()
    return nomes
  }
  const pedidos = new PedidosDeColegas({
    nome,
    avisarTela: (aviso) => enviarParaJanelas(IPC.timePedidoColegas, aviso),
    criar,
    adiar: (fn, ms) => {
      const t = setTimeout(fn, ms)
      return () => clearTimeout(t)
    },
    novoId: randomUUID,
  })
  const mcp = new ServidorMcp({ versao: app.getVersion(), chamar: (id, colegas) => pedidos.pedir(id, colegas) })
  return { pedidos, mcp }
}
