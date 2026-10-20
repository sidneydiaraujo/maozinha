// Copiar e colar no terminal como no Windows Terminal (T8.3). A area de transferencia passa pelo
// main (app:copiar / app:colar): a tela nao tem essa permissao.
import type { Terminal } from '@xterm/xterm'

/**
 * copiarOuInterromper = Ctrl+C (com selecao copia; sem selecao segue como ^C para o programa).
 * colarOuSeguir = Ctrl+V (texto cola; so um print vira o Alt+V do Claude; nada segue como ^V).
 * buscar = Ctrl+F (T12.2): procura no historico do terminal.
 */
export type Atalho = 'copiar' | 'copiarOuInterromper' | 'colar' | 'colarOuSeguir' | 'buscar'

interface Tecla {
  key: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
}

export function atalhoDe(e: Tecla): Atalho | null {
  if (e.altKey || e.metaKey) return null
  if (!e.ctrlKey) return e.shiftKey && e.key === 'Insert' ? 'colar' : null
  const letra = e.key.toLowerCase()
  if (letra === 'c') return e.shiftKey ? 'copiar' : 'copiarOuInterromper'
  if (letra === 'v') return e.shiftKey ? 'colar' : 'colarOuSeguir'
  if (letra === 'f' && !e.shiftKey) return 'buscar'
  return null
}

async function copiar(term: Terminal): Promise<void> {
  if (!term.hasSelection()) return
  await window.lousa.app.copiar(term.getSelection())
  term.clearSelection()
}

/** No Windows o Claude cola imagem com Alt+V, que o xterm manda como ESC v (T16.0). */
export const ALT_V = '\x1bv'

export type Colagem = { tipo: 'imagem' } | { tipo: 'texto'; texto: string } | null

/** O que o Ctrl+V manda (T16.1): texto cola como sempre; so um print vira o Alt+V; nada = null. */
export function colagem(temImagem: boolean, texto: string): Colagem {
  if (texto) return { tipo: 'texto', texto }
  return temImagem ? { tipo: 'imagem' } : null
}

async function colar(term: Terminal, seguir: (() => void) | null): Promise<void> {
  const texto = await window.lousa.app.colar()
  if (texto) term.paste(texto)
  else seguir?.()
}

/** Ctrl+V: com texto, cola; com um print e sem texto, Alt+V; sem nada, ^V cru para o programa. */
async function colarOuSeguir(term: Terminal, escrever: (dados: string) => void): Promise<void> {
  const texto = await window.lousa.app.colar()
  const c = colagem(texto ? false : await window.lousa.app.temImagem(), texto)
  if (c?.tipo === 'texto') term.paste(c.texto)
  else escrever(c ? ALT_V : '\x16')
}

/** Liga as teclas e o botao direito (selecao = copia; sem selecao = cola). Devolve o desligar. */
export function ligarTeclas(
  term: Terminal,
  el: HTMLElement,
  escrever: (dados: string) => void,
  aoBuscar: () => void,
): () => void {
  const falhou = (): void => undefined // area de transferencia ocupada por outro programa: so nao faz nada
  term.attachCustomKeyEventHandler((e) => {
    const atalho = atalhoDe(e)
    if (!atalho) return true
    if (atalho === 'copiarOuInterromper' && !term.hasSelection()) return true
    if (e.type !== 'keydown') return false
    e.preventDefault()
    if (atalho === 'buscar') aoBuscar()
    else if (atalho === 'colar') colar(term, null).catch(falhou)
    else if (atalho === 'colarOuSeguir') colarOuSeguir(term, escrever).catch(falhou)
    else copiar(term).catch(falhou)
    return false
  })
  const botaoDireito = (e: MouseEvent): void => {
    e.preventDefault()
    const acao = term.hasSelection() ? copiar(term) : colar(term, null)
    acao.catch(falhou)
  }
  el.addEventListener('contextmenu', botaoDireito)
  return () => el.removeEventListener('contextmenu', botaoDireito)
}
