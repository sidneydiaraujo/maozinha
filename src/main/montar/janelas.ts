// Aviso do main para todas as janelas abertas (saiu de montagens.ts no R4.20).
import { BrowserWindow } from 'electron'

/** Entrega um evento a todas as janelas abertas (so o dado, nunca o objeto `event`). */
export function enviarParaJanelas(canal: string, payload: unknown): void {
  for (const janela of BrowserWindow.getAllWindows()) {
    if (!janela.isDestroyed()) janela.webContents.send(canal, payload)
  }
}
