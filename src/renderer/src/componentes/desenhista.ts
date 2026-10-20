// Desenhista WebGL do xterm (T15.2, D23): o mesmo do VSCode, letra nitida e desenho mais rapido.
// Sem WebGL (limite de desenhos, contexto caiu, rodada de prova) o terminal fica no desenho normal.
import { WebglAddon } from '@xterm/addon-webgl'
import type { Terminal } from '@xterm/xterm'

/** O Chromium segura 16 contextos WebGL por pagina e derruba o mais velho no 17º: fica folga. */
export const LIMITE_WEBGL = 14

let ativos = 0

/**
 * A rodada de prova abre a pagina com `?desenho=dom` (src/main/cenario.ts): com WebGL o texto
 * nao fica no HTML (`.xterm-rows`), que e por onde os cenarios leem a tela.
 */
export function querWebgl(busca: string): boolean {
  return new URLSearchParams(busca).get('desenho') !== 'dom'
}

/** Liga o WebGL depois do `term.open`; devolve quem desliga (antes do `term.dispose`). */
export function ligarDesenhista(term: Terminal, el: HTMLElement): () => void {
  el.dataset.desenho = 'dom'
  if (!querWebgl(location.search) || ativos >= LIMITE_WEBGL) return () => undefined
  let webgl: WebglAddon | null = new WebglAddon()
  const soltar = (): void => {
    if (!webgl) return
    const addon = webgl
    webgl = null
    ativos--
    el.dataset.desenho = 'dom'
    addon.dispose() // o xterm volta sozinho ao desenho normal
  }
  try {
    webgl.onContextLoss(soltar)
    term.loadAddon(webgl)
  } catch {
    // placa sem WebGL2: fica no desenho normal, sem erro na tela
    webgl = null
    return () => undefined
  }
  ativos++
  el.dataset.desenho = 'webgl'
  return soltar
}
