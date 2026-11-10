// Agentes do contexto (R4.20): linha de status (painel), troca de modelo, compactar, uso das contas,
// notificacao do Windows e onde cada agente salva. Usa a base; o que precisa do time (a fila pode
// sair, o /compact nao e a vez do agente) vai pela tomada `doTime`, ligada no fim da montagem.
import { app } from 'electron'
import { existsSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { IPC } from '../../shared/ipc'
import type { Repo } from '../../shared/model'
import { FilaAjustes } from '../agentes/ajustes'
import { compactar } from '../agentes/compactar'
import { CompactarSozinho } from '../agentes/compactarSozinho'
import { adiarReal, discoDaPonte } from '../agentes/disco'
import { PonteAgentes } from '../agentes/ponte'
import { UsoDasContas } from '../agentes/uso'
import { AvisosDoWindows } from '../avisos/notificar'
import { kanbanNaPastaDoProjeto } from '../kanban/disco'
import { ARQUIVO_KANBAN } from '../kanban/kanban'
import { ehProjeto, pastaDoProjeto } from '../kanban/projeto'
import { log } from '../log'
import type { ServicoQuadros } from '../quadros/servico'
import type { ServicoRepos } from '../repos/servico'
import type { Base } from './base'
import { enviarParaJanelas } from './janelas'
import { montarProjetos, type ProjetosDosAgentes } from './projetos'
import type { Tomada } from './tomada'

/** O que os agentes avisam ao time. */
export interface DoTime {
  /** O agente ficou pronto, ou o /compact desistiu: a fila do time pode sair. */
  aoPronto(quadroId: string): void
  /** Digitou o /compact: o resumo dele nao e a vez do agente (o repasse nao passa adiante). */
  aoCompactar(quadroId: string): void
}

export interface OndeEscreve {
  aoEscrever(quadroId: string, arquivo: string): void
  esquecer(quadroId: string): void
}

export interface Agentes {
  avisos: AvisosDoWindows
  ajustes: FilaAjustes
  agentes: PonteAgentes
  usos: UsoDasContas
  compactarSozinho: CompactarSozinho
  /** Digita /compact no agente parado (T18.1); lanca com a frase se nao puder. */
  compactarAgora(quadroId: string): Promise<void>
  ondeEscreve: OndeEscreve
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

/**
 * Troca de modelo/esforco (D49): reabrir e o momento `reabriu` do ciclo (fecha o terminal e apaga o
 * painel velho) e pede a tela para abrir de novo; o comando novo le o modelo salvo e retoma a conversa.
 */
function montarAjustes(b: Base): FilaAjustes {
  return new FilaAjustes({
    aberto: (id) => b.terminais.estaAberto(id),
    aviso: (id) => b.terminais.aviso(id),
    pronto: (id) => b.terminais.pronto(id),
    temClaude: b.temClaude,
    reabrir: (id) => {
      b.ciclo.aconteceu('reabriu', id)
      enviarParaJanelas(IPC.agentesReabrir, { quadroId: id })
    },
  })
}

/**
 * Onde cada agente salva (A16): o gancho de escrita da ponte traz o arquivo; daqui sai a pasta do
 * projeto para a bolinha da lateral (so quando muda). Pasta aberta que nao e projeto (a home): o
 * kanban nasce na pasta do projeto (D52).
 */
/** A pasta do projeto achado (D65), se o arquivo esta dentro dela: a bolinha vai para ela. */
function dentroDoProjeto(b: Base, projeto: string | undefined, arquivo: string): Repo | null {
  const repo = projeto ? b.repos.listar().find((r) => r.id === projeto) : undefined
  if (!repo) return null
  const rel = relative(repo.caminho, arquivo)
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? repo : null
}

function montarOndeEscreve(b: Base): OndeEscreve {
  const ultimos = new Map<string, string>()
  const aoEscrever = (quadroId: string, arquivo: string): void => {
    let repo: Repo
    let comKanban: boolean
    let doProjeto: boolean
    try {
      const quadro = b.quadros.obter(quadroId)
      const projeto = dentroDoProjeto(b, quadro.projeto, arquivo)
      repo = projeto ?? b.repos.obter(quadro.repoId)
      doProjeto = projeto !== null
      comKanban = quadro.kanban === true // so quem escolheu ter kanban o cria (A22)
    } catch {
      return // o quadro ou a pasta sairam da lousa
    }
    const relativo = pastaDoProjeto(arquivo, repo.caminho, existsSync)
    if (relativo === null) return
    // o agente aberto fora do projeto (a home, o quadro livre: D52, D65) nao sabia do kanban dele
    if (comKanban && (doProjeto || !ehProjeto(repo.caminho, existsSync))) {
      const criadoEm = kanbanNaPastaDoProjeto(join(repo.caminho, relativo))
      const rel = criadoEm === null ? null : relative(repo.caminho, criadoEm).replace(/\\/g, '/')
      if (rel !== null && !rel.startsWith('..')) b.vigia.avisarAgora(repo.id, [rel ? `${rel}/${ARQUIVO_KANBAN}` : ARQUIVO_KANBAN])
    }
    const chave = `${repo.id}|${relativo}`
    if (ultimos.get(quadroId) === chave) return
    ultimos.set(quadroId, chave)
    enviarParaJanelas(IPC.agentesEscrevendo, { quadroId, repoId: repo.id, relativo })
  }
  return { aoEscrever, esquecer: (id) => void ultimos.delete(id) }
}

/** Linha de status dos agentes (T17.2, D24): fica so em <userData>\agentes. */
function montarPonte(
  b: Base,
  d: { ajustes: FilaAjustes; usos: UsoDasContas; ondeEscreve: OndeEscreve; projetos: ProjetosDosAgentes; doTime: Tomada<DoTime> },
): PonteAgentes {
  return new PonteAgentes({
    pasta: join(app.getPath('userData'), 'agentes'),
    disco: discoDaPonte,
    agora: Date.now,
    emitir: (quadroId, painel) => {
      enviarParaJanelas(IPC.agentesPainel, { quadroId, painel })
      // a primeira linha de status: o Claude esta pronto para receber (D49)
      if (b.terminais.marcarPronto(quadroId)) {
        void d.ajustes.aoPronto(quadroId)
        d.doTime.usar().aoPronto(quadroId)
      }
      // os limites de uso sao da conta, nao do quadro (T20.1)
      const perfilId = contaDoQuadro(b.quadros, quadroId)
      const uso = perfilId ? d.usos.aoPainel(perfilId, painel) : null
      if (uso) enviarParaJanelas(IPC.perfisUsoMudou, uso)
    },
    // onde o agente salvou (A16): o projeto dele (D65) e a bolinha da pasta do projeto na lateral
    aoEscrever: (id, arquivo) => {
      d.projetos.aoTocar(id, arquivo, true)
      d.ondeEscreve.aoEscrever(id, arquivo)
    },
    // leu ou procurou (D65): o primeiro projeto do agente
    aoTocar: (id, caminho) => d.projetos.aoTocar(id, caminho, false),
    // o estado pelos ganchos (D63) entra pelo mesmo caminho do OSC 7501
    aoEstado: (id, lido) => b.terminais.anotarAviso(id, lido.aviso, lido.seEstiver),
    adiar: adiarReal,
  })
}

function compactarCom(b: Base): (quadroId: string) => Promise<void> {
  return (quadroId) =>
    compactar(
      {
        quadro: (id) => b.quadros.obter(id),
        aberto: (id) => b.terminais.estaAberto(id),
        aviso: (id) => b.terminais.aviso(id),
        pronto: (id) => b.terminais.pronto(id),
        temClaude: b.temClaude,
        escrever: (id, dados) => b.terminais.escrever(id, dados),
        esperar: b.esperar,
        aguardarSaida: (id, achou, ms) => b.terminais.aguardarSaida(id, achou, ms),
      },
      quadroId,
    )
}

export function montarAgentes(b: Base, doTime: Tomada<DoTime>): Agentes {
  const avisos = new AvisosDoWindows({
    descrever: (terminalId) => descreverQuadro(b.quadros, b.repos, terminalId),
    enviar: enviarParaJanelas,
  })
  const ajustes = montarAjustes(b)
  const usos = new UsoDasContas()
  const ondeEscreve = montarOndeEscreve(b)
  const agentes = montarPonte(b, { ajustes, usos, ondeEscreve, projetos: montarProjetos(b), doTime })
  const compactarAgora = compactarCom(b)
  const compactarSozinho = new CompactarSozinho({
    usado: (id) => agentes.ultimo(id)?.contexto?.usado ?? null,
    ocupado: (id) => ajustes.pendente(id),
    compactar: compactarAgora,
    aoCompactar: (id) => doTime.usar().aoCompactar(id),
    aoDesistir: (id, e) => {
      log('info', `compactar sozinho nao rolou em ${id}: ${String(e)}`)
      doTime.usar().aoPronto(id)
    },
  })
  return { avisos, ajustes, agentes, usos, compactarSozinho, compactarAgora, ondeEscreve }
}
