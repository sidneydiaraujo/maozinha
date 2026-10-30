// Montagens do contexto (A17: saiu de contexto.ts pelo teto de linhas): a fila de mensagens e o
// apresentador do time (T29.1), o repasse (T30.1), a troca de modelo (D49) e o aviso as janelas.
import { BrowserWindow } from 'electron'
import { randomUUID } from 'node:crypto'
import { IPC } from '../shared/ipc'
import type { DadosTime } from '../shared/time'
import { FilaAjustes } from './agentes/ajustes'
import type { Armazem } from './estado/armazem'
import type { ServicoPerfis } from './perfis/servico'
import type { ServicoTerminais } from './terminais/servico'
import { rodarReal, temClaudeDentro } from './terminais/filhos'
import { ApresentadorTime, FilaMensagens } from './time/apresentar'
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
