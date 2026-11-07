// Onde a tela do app mora (R2.7): a janela carrega daqui e o IPC so atende quem veio daqui.
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { PaginaDoApp } from './security'

/** O index.html do build, ao lado do main compilado (out/main -> out/renderer). */
export const ARQUIVO_DA_TELA = join(__dirname, '../renderer/index.html')

export function paginaDoApp(): PaginaDoApp {
  return { dev: process.env['ELECTRON_RENDERER_URL'], arquivo: pathToFileURL(ARQUIVO_DA_TELA).href }
}
