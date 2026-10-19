// Copiar e colar no terminal como no Windows Terminal (T8.3). A area de transferencia passa pelo
// main (app:copiar / app:colar): a tela nao tem essa permissao.
import type { Terminal } from '@xterm/xterm'

/**
 * copiarOuInterromper = Ctrl+C (com selecao copia; sem selecao segue como ^C para o programa).
 * colarOuSeguir = Ctrl+V (sem texto na area de transferencia segue como ^V: o Claude cola imagem).
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

async function colar(term: Terminal, seguir: (() => void) | null): Promise<void> {
  const texto = await window.lousa.app.colar()
  if (texto) term.paste(texto)
  else seguir?.()
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
    else if (atalho === 'colarOuSeguir') colar(term, () => escrever('\x16')).catch(falhou)
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
