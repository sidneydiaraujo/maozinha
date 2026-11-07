// Notificacao do Windows e barra de tarefas piscando quando o agente de um quadro para (T8.1).
// So com a janela fora de foco: com ela na frente, o brilho do quadro (T8.2) basta.
import { BrowserWindow, Notification } from 'electron'
import { IPC } from '../../shared/ipc'
import type { AvisoAgente } from '../../shared/model'
import { log } from '../log'
import { pedeAtencao, textoDoAviso } from './texto'

export interface DepsAvisos {
  /** "pasta · Claude 1"; null se o terminal nao e de um quadro. */
  descrever(terminalId: string): string | null
  enviar(canal: string, payload: unknown): void
}

function janelaPrincipal(): BrowserWindow | undefined {
  return BrowserWindow.getAllWindows().find((j) => !j.isDestroyed())
}

export class AvisosDoWindows {
  /** Uma por quadro: guardar a referencia mantem o clique vivo; a nova substitui a velha. */
  private readonly abertas = new Map<string, Notification>()

  constructor(private readonly deps: DepsAvisos) {}

  aoEstado(terminalId: string, aviso: AvisoAgente): void {
    this.abertas.get(terminalId)?.close()
    this.abertas.delete(terminalId)
    if (!pedeAtencao(aviso)) return
    const janela = janelaPrincipal()
    if (!janela || (janela.isFocused() && !janela.isMinimized())) return
    const onde = this.deps.descrever(terminalId)
    if (!onde) return
    log('info', `aviso do agente: ${aviso.estado}`)
    janela.flashFrame(true)
    if (!Notification.isSupported()) return
    const { titulo, corpo } = textoDoAviso(aviso, onde)
    const notificacao = new Notification({ title: titulo, body: corpo })
    notificacao.on('click', () => {
      if (janela.isDestroyed()) return
      if (janela.isMinimized()) janela.restore()
      janela.show()
      janela.focus()
      this.deps.enviar(IPC.quadrosFocar, { quadroId: terminalId })
    })
    notificacao.on('close', () => {
      if (this.abertas.get(terminalId) === notificacao) this.abertas.delete(terminalId)
    })
    this.abertas.set(terminalId, notificacao)
    notificacao.show()
  }

  /**
   * R3.17: o quadro saiu da lousa (fechado, pasta tirada, trocou de conta). A notificacao dele sai da
   * Central de Avisos do Windows e da memoria; antes ficava viva e o clique levava a um quadro que nao
   * existe mais.
   */
  esquecer(terminalId: string): void {
    const aberta = this.abertas.get(terminalId)
    this.abertas.delete(terminalId)
    aberta?.close()
  }

  /** A janela voltou ao foco: para de piscar na barra de tarefas. */
  static pararDePiscar(janela: BrowserWindow): void {
    if (!janela.isDestroyed()) janela.flashFrame(false)
  }
}
