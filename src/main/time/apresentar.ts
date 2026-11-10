// O time se conhece (T29.1, D39): quando o time muda, cada agente fica sabendo quem ele e, quem sao os
// colegas e para quem entrega. A Lousa so digita com o agente parado (como a D25). D66: a apresentacao
// nunca e digitada sozinha (cada uma gastava uma volta do Claude, "ok", em agente que ninguem chamou);
// ela vai junto do proximo trabalho que o agente receber, numa mensagem so.
import { podeCompactar, podeDigitar } from '../../shared/compactar'
import type { AvisoAgente } from '../../shared/model'
import { comApresentacao, textoDoTime, TEXTO_SAIU_DO_TIME, type DadosTime } from '../../shared/time'
import { digitarMensagem } from '../../shared/digitar'
import type { DepsAjustes } from '../agentes/ajustes'

export interface DepsFila extends DepsAjustes {
  escrever(terminalId: string, dados: string): void
  esperar(ms: number): Promise<void>
  /**
   * Troca de modelo esperando (D49, A15): o agente vai reabrir, entao a mensagem espera o
   * reaberto. Digitada antes, ou se perdia no terminal que fecha, ou fazia a troca esperar a
   * resposta inteira.
   */
  segurar?(terminalId: string): boolean
  /** Relogio (A27); sem ele, Date.now. */
  agora?(): number
  /** Mensagem do time esperando ha mais de DEMORA_MS: vai para o registro do app (A27). */
  aoDemorar?(terminalId: string, detalhe: string): void
}

/** Digitou e o agente nao deu sinal nenhum: depois disto a fila tenta de novo (A27). */
export const SEM_SINAL_MS = 60_000
/** De quanto em quanto tempo a fila confere sozinha quem tem mensagem esperando (A27). */
export const REVISAR_MS = 15_000
/** Esperando mais do que isto: o registro do app ganha uma linha com o porque. */
export const DEMORA_MS = 2 * 60_000

/** Montar uma arvore manda uma apresentacao so: espera o time ficar 2 s sem mudar. */
export const ESPERA_APRESENTAR_MS = 2000

/** De onde veio o que a Lousa digitou: a resposta a uma apresentacao nao passa adiante (T30.1). */
export type TipoMensagem = 'apresentacao' | 'repasse' | 'compactar'

/**
 * Mensagens da Lousa para os agentes. A apresentacao (`mandar`) e uma por agente: a mais nova
 * substitui a anterior (a velha nao vale mais), e ela so sai junto do proximo trabalho (D66). O
 * trabalho (`enfileirar`: repasse T30.1, tarefa de colega A19) espera em ordem. Uma mensagem por
 * parada: depois de digitar, a proxima espera o agente parar de novo. Agente trabalhando, esperando
 * voce ou fechado: espera ele parar.
 */
export class FilaMensagens {
  private readonly pendentes = new Map<string, string>()
  private readonly emOrdem = new Map<string, string[]>()
  /** Ja digitou nesta parada (quando); limpa no proximo aviso do agente ou depois de SEM_SINAL_MS. */
  private readonly digitouAgora = new Map<string, number>()
  /** Sem claude.exe na ultima tentativa (quando): a revisao nao pergunta ao Windows de novo logo. */
  private readonly semClaudeEm = new Map<string, number>()
  /** Desde quando cada agente tem mensagem esperando; se ja foi para o registro. */
  private readonly esperandoDesde = new Map<string, { desde: number; avisou: boolean }>()

  constructor(
    private readonly deps: DepsFila,
    private readonly aoDigitar: (quadroId: string, tipo: TipoMensagem) => void = () => {},
  ) {}

  /** Guarda a apresentacao: ela vai junto do proximo trabalho, nunca sozinha (D66). */
  mandar(quadroId: string, texto: string): Promise<void> {
    this.pendentes.set(quadroId, texto)
    return Promise.resolve()
  }

  /** Repasse: entra no fim da fila do agente; nada substitui nada (T30.1). */
  async enfileirar(quadroId: string, texto: string): Promise<void> {
    const fila = this.emOrdem.get(quadroId) ?? []
    if (fila.length > 0 || !this.livre(quadroId)) {
      this.emOrdem.set(quadroId, [...fila, texto])
      return
    }
    await this.digitar(quadroId, texto)
  }

  aoEstado(quadroId: string, aviso: AvisoAgente): Promise<void> {
    this.digitouAgora.delete(quadroId)
    if (!podeCompactar(aviso.estado)) return Promise.resolve()
    return this.soltar(quadroId)
  }

  /** O Claude acabou de ficar pronto (D49): o que esperava a abertura sai agora. */
  aoPronto(quadroId: string): Promise<void> {
    return this.livre(quadroId) ? this.soltar(quadroId) : Promise.resolve()
  }

  /** O proximo trabalho, um por parada; sem trabalho, a apresentacao continua esperando (D66). */
  private soltar(quadroId: string): Promise<void> {
    if (this.deps.segurar?.(quadroId)) return Promise.resolve()
    const [repasse, ...resto] = this.emOrdem.get(quadroId) ?? []
    if (repasse === undefined) return Promise.resolve()
    this.emOrdem.set(quadroId, resto)
    return this.digitar(quadroId, repasse)
  }

  /**
   * A fila confere sozinha (A27): sem depender de um aviso do agente que pode nao vir, solta o que
   * pode sair. Antes, uma tarefa de colega podia ficar parada para sempre na fila.
   */
  async revisar(): Promise<void> {
    const agora = this.relogio()
    // so trabalho conta: a apresentacao sozinha espera o proximo trabalho, sem prazo (D66)
    const comEspera = new Set([...this.emOrdem].filter(([, f]) => f.length > 0).map(([id]) => id))
    for (const id of this.esperandoDesde.keys()) if (!comEspera.has(id)) this.esperandoDesde.delete(id)
    for (const id of comEspera) {
      this.vigiarDemora(id, agora)
      if (agora - (this.semClaudeEm.get(id) ?? -Infinity) < SEM_SINAL_MS) continue
      if (this.livre(id)) await this.soltar(id)
    }
  }

  /** O quadro saiu da lousa: as mensagens dele nao valem mais. */
  esquecer(quadroId: string): void {
    this.pendentes.delete(quadroId)
    this.emOrdem.delete(quadroId)
    this.digitouAgora.delete(quadroId)
    this.semClaudeEm.delete(quadroId)
    this.esperandoDesde.delete(quadroId)
  }

  private relogio(): number {
    return this.deps.agora?.() ?? Date.now()
  }

  private vigiarDemora(quadroId: string, agora: number): void {
    const marca = this.esperandoDesde.get(quadroId)
    if (!marca) return void this.esperandoDesde.set(quadroId, { desde: agora, avisou: false })
    if (marca.avisou || agora - marca.desde < DEMORA_MS) return
    marca.avisou = true
    const digitou = this.digitouAgora.get(quadroId)
    const detalhe = [
      `aberto=${this.deps.aberto(quadroId)}`,
      `estado=${this.deps.aviso(quadroId)?.estado ?? 'nenhum'}`,
      `pronto=${this.deps.pronto(quadroId)}`,
      `digitou=${digitou === undefined ? 'nao' : `ha ${Math.round((agora - digitou) / 1000)} s`}`,
      `segurando=${!!this.deps.segurar?.(quadroId)}`,
      `semClaude=${this.semClaudeEm.has(quadroId)}`,
      `naFila=${(this.emOrdem.get(quadroId) ?? []).length}`,
      `apresentacao=${this.pendentes.has(quadroId)}`,
    ].join(' ')
    this.deps.aoDemorar?.(quadroId, detalhe)
  }

  /** Digitou nesta parada e o agente ainda nao deu sinal (vale por SEM_SINAL_MS). */
  private digitouHaPouco(quadroId: string): boolean {
    const quando = this.digitouAgora.get(quadroId)
    return quando !== undefined && this.relogio() - quando < SEM_SINAL_MS
  }

  pendente(quadroId: string): string | undefined {
    return this.pendentes.get(quadroId)
  }

  emEspera(quadroId: string): string[] {
    return this.emOrdem.get(quadroId) ?? []
  }

  private livre(quadroId: string): boolean {
    return (
      this.deps.aberto(quadroId) &&
      podeDigitar(this.deps.aviso(quadroId)?.estado, this.deps.pronto(quadroId)) &&
      !this.digitouHaPouco(quadroId) &&
      !this.deps.segurar?.(quadroId)
    )
  }

  /**
   * Texto e Enter separados: juntos o Claude trata como colagem e nao envia (D21). Sem claude.exe
   * no terminal (saiu e ficou o PowerShell), nao digita: o trabalho volta para o comeco da fila e a
   * apresentacao continua guardada. Com apresentacao guardada, ela vai na frente, na mesma mensagem.
   */
  private async digitar(quadroId: string, trabalho: string): Promise<void> {
    this.digitouAgora.set(quadroId, this.relogio())
    if (!(await this.deps.temClaude(quadroId))) {
      this.digitouAgora.delete(quadroId)
      this.semClaudeEm.set(quadroId, this.relogio())
      this.emOrdem.set(quadroId, [trabalho, ...(this.emOrdem.get(quadroId) ?? [])])
      return
    }
    const apresentacao = this.pendentes.get(quadroId)
    this.pendentes.delete(quadroId)
    this.semClaudeEm.delete(quadroId)
    this.esperandoDesde.delete(quadroId)
    this.aoDigitar(quadroId, 'repasse')
    const texto = apresentacao === undefined ? trabalho : comApresentacao(apresentacao, trabalho)
    await digitarMensagem({ escrever: (dados) => this.deps.escrever(quadroId, dados), esperar: this.deps.esperar }, texto)
  }
}

export interface DepsApresentador {
  /** O time como esta salvo agora (quadros, pastas, linhas e o provedor de cada conta). */
  dados(): DadosTime
  fila: Pick<FilaMensagens, 'mandar'>
  /** setTimeout que devolve como cancelar. */
  adiar(fn: () => void, ms: number): () => void
}

export class ApresentadorTime {
  /** O que cada agente ja ouviu; so manda de novo quando o texto muda. */
  private readonly ouvido = new Map<string, string>()
  private cancelar: (() => void) | null = null

  constructor(private readonly deps: DepsApresentador) {}

  /** Algo no time pode ter mudado (linha, colega, papel, quadro fechado, conta trocada). */
  mudou(): void {
    this.cancelar?.()
    this.cancelar = this.deps.adiar(() => {
      this.cancelar = null
      this.apresentar()
    }, ESPERA_APRESENTAR_MS)
  }

  apresentar(): void {
    const dados = this.deps.dados()
    const existem = new Set(dados.quadros.map((q) => q.id))
    for (const id of [...this.ouvido.keys()]) if (!existem.has(id)) this.ouvido.delete(id)
    for (const q of dados.quadros) {
      if (q.tipo !== 'agente' || dados.provedores[q.perfilId] !== 'claude') continue
      const antes = this.ouvido.get(q.id)
      const agora = textoDoTime(dados, q.id) ?? (antes && antes !== TEXTO_SAIU_DO_TIME ? TEXTO_SAIU_DO_TIME : null)
      if (agora === null || agora === antes) continue
      this.ouvido.set(q.id, agora)
      void this.deps.fila.mandar(q.id, agora)
    }
  }
}
