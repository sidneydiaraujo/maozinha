// Passar o trabalho adiante (T30.1, D39): quando um agente do time termina a vez dele, cada linha
// que sai dele leva o recado ao colega. Automatico vai para a fila; "perguntar" espera o seu ok;
// pausada nao faz nada. Freio: 3 repasses automaticos seguidos sem voce digitar no time.
import type { EstadoAgente, EventoRepasse, Ligacao } from '../../shared/model'
import { LIMITE_REPASSES, nomeNoTime, textoDoRepasse, timeDe, type DadosTime } from '../../shared/time'
import type { TipoMensagem } from './apresentar'

/**
 * O agente terminou a vez dele? O Claude manda `done` (terminou) ou volta direto a `idle` (parado):
 * vale terminou vindo de qualquer outro estado, e parado so vindo de trabalhando (na abertura ele
 * comeca parado sem ter feito nada). Puro.
 */
export function fimDaVez(antes: EstadoAgente | undefined, agora: EstadoAgente): boolean {
  if (agora === 'terminou') return antes !== 'terminou'
  return agora === 'parado' && antes === 'trabalhando'
}

/** Teclas de verdade (letra, Enter), nao a resposta automatica do terminal (comeca com ESC). Puro. */
export function ehDigitacao(dados: string): boolean {
  if (dados.startsWith('\x1b')) return false
  return [...dados].some((c) => c === '\r' || (c.charCodeAt(0) >= 32 && c.charCodeAt(0) !== 127))
}

export interface DepsRepasse {
  /** O time como esta salvo agora. */
  dados(): DadosTime
  fila: { enfileirar(quadroId: string, texto: string): Promise<void> }
  /** O terminal do quadro esta aberto (nao fechado nem encerrado)? */
  aberto(quadroId: string): boolean
  /** Grava a linha pausada ou retomada e devolve como ficou (ServicoTime.ajustar). */
  ajustar(ligacaoId: string, mudanca: { pausada: boolean }): Ligacao
  avisar(evento: EventoRepasse): void
}

export class Repasse {
  private readonly ultimoEstado = new Map<string, EstadoAgente>()
  /** O que cada agente disse ao terminar, para o botao "Passar" usar depois. */
  private readonly ultimaMensagem = new Map<string, string | undefined>()
  /** Agentes respondendo a uma apresentacao: essa vez nao passa adiante. */
  private readonly vezDaLousa = new Set<string>()
  /** Repasses automaticos seguidos, por time (chave: o menor id do time). */
  private readonly seguidos = new Map<string, number>()

  constructor(private readonly deps: DepsRepasse) {}

  /** A fila digitou algo da Lousa no agente (FilaMensagens). */
  aoDigitar(quadroId: string, tipo: TipoMensagem): void {
    // a resposta a uma apresentacao e o resumo do /compact (A17) nao sao trabalho para passar
    if (tipo !== 'repasse') this.vezDaLousa.add(quadroId)
  }

  /** O Sidney digitou neste quadro: o freio do time dele zera. */
  digitou(quadroId: string): void {
    this.vezDaLousa.delete(quadroId)
    this.seguidos.delete(this.chaveDoTime(this.deps.dados(), quadroId))
  }

  /** Cada aviso do OSC 7501 de qualquer terminal. */
  async aoEstado(quadroId: string, estado: EstadoAgente, mensagem?: string): Promise<void> {
    const antes = this.ultimoEstado.get(quadroId)
    this.ultimoEstado.set(quadroId, estado)
    if (!fimDaVez(antes, estado)) return
    if (this.vezDaLousa.delete(quadroId)) return
    this.ultimaMensagem.set(quadroId, mensagem)
    const dados = this.deps.dados()
    for (const l of dados.ligacoes) {
      if (l.de === quadroId && !l.pausada) await this.passarPela(dados, l, mensagem)
    }
  }

  /** Botao da linha ("Passar para…", "Continuar?"): retoma a linha, zera o freio e passa. */
  async passar(ligacaoId: string): Promise<void> {
    const dados = this.deps.dados()
    const l = dados.ligacoes.find((x) => x.id === ligacaoId)
    if (!l) throw new Error('Linha não encontrada')
    if (!this.deps.aberto(l.para)) throw new Error(`${nomeNoTime(dados, l.para)} está fechado`)
    if (l.pausada) this.deps.ajustar(l.id, { pausada: false })
    this.seguidos.delete(this.chaveDoTime(dados, l.de))
    await this.entregar(dados, l, this.ultimaMensagem.get(l.de))
  }

  /** O quadro saiu da lousa. */
  esquecer(quadroId: string): void {
    this.ultimoEstado.delete(quadroId)
    this.ultimaMensagem.delete(quadroId)
    this.vezDaLousa.delete(quadroId)
    // o freio de um time cuja chave era este quadro (o menor id) nao serve mais a ninguem
    this.seguidos.delete(quadroId)
  }

  private async passarPela(dados: DadosTime, l: Ligacao, mensagem?: string): Promise<void> {
    const para = nomeNoTime(dados, l.para)
    if (!this.deps.aberto(l.para)) return this.deps.avisar({ ligacaoId: l.id, tipo: 'descartado', para })
    if (l.modo === 'perguntar') return this.deps.avisar({ ligacaoId: l.id, tipo: 'perguntar', para })
    const chave = this.chaveDoTime(dados, l.de)
    const feitos = this.seguidos.get(chave) ?? 0
    if (feitos >= LIMITE_REPASSES) {
      const ligacao = this.deps.ajustar(l.id, { pausada: true })
      return this.deps.avisar({ ligacaoId: l.id, tipo: 'limite', para, ligacao })
    }
    this.seguidos.set(chave, feitos + 1)
    await this.entregar(dados, l, mensagem)
  }

  private async entregar(dados: DadosTime, l: Ligacao, mensagem?: string): Promise<void> {
    await this.deps.fila.enfileirar(l.para, textoDoRepasse(dados, l.de, mensagem))
    this.deps.avisar({ ligacaoId: l.id, tipo: 'repassou', para: nomeNoTime(dados, l.para) })
  }

  private chaveDoTime(dados: DadosTime, quadroId: string): string {
    return [...timeDe(dados.ligacoes, quadroId)].sort()[0] ?? quadroId
  }
}
