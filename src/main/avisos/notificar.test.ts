import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AvisoAgente } from '../../shared/model'

// so o necessario do Electron: uma janela fora de foco e notificacoes que contam quem fechou
const fechadas: string[] = []
vi.mock('electron', () => {
  class Notification {
    static isSupported = (): boolean => true
    constructor(readonly opcoes: { title: string; body: string }) {}
    on(): void {}
    show(): void {}
    close(): void {
      fechadas.push(`${this.opcoes.title} ${this.opcoes.body}`)
    }
  }
  const janela = { isDestroyed: () => false, isFocused: () => false, isMinimized: () => false, flashFrame: () => undefined }
  return { Notification, BrowserWindow: { getAllWindows: () => [janela] } }
})
vi.mock('../log', () => ({ log: () => undefined }))

const { AvisosDoWindows } = await import('./notificar')

const esperando: AvisoAgente = { estado: 'esperando', mensagem: 'Posso editar?' }

describe('AvisosDoWindows.esquecer (R3.17)', () => {
  beforeEach(() => {
    fechadas.length = 0
  })

  it('o quadro que saiu leva a notificacao dele junto; a dos outros fica', () => {
    const avisos = new AvisosDoWindows({ descrever: (id) => `app · ${id}`, enviar: () => undefined })
    avisos.aoEstado('q1', esperando)
    avisos.aoEstado('q2', esperando)
    avisos.esquecer('q1')
    expect(fechadas).toHaveLength(1)
    expect(fechadas[0]).toContain('q1')
    avisos.esquecer('q1') // de novo: nada a fechar
    expect(fechadas).toHaveLength(1)
  })
})
