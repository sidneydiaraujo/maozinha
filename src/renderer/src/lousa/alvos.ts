// Para quem vai uma mensagem pronta ou uma nota (T25.2, D33): os quadros selecionados na lousa
// ou, sem selecao, o ultimo quadro em que o usuario clicou ou digitou.
import { useEffect } from 'react'

/** Selecionados (se houver) ou o ultimo usado, desde que ainda exista. Puro. */
export function escolherAlvos(selecionados: string[], ultimo: string | null, existentes: string[]): string[] {
  const vivos = selecionados.filter((id) => existentes.includes(id))
  if (vivos.length > 0) return vivos
  return ultimo && existentes.includes(ultimo) ? [ultimo] : []
}

const estado = { selecionados: [] as string[], ultimo: null as string | null }

/** A lousa avisa a selecao a cada mudanca. */
export function marcarSelecionados(ids: string[]): void {
  estado.selecionados = ids
}

/** Quadros que existem agora, lidos da tela (a lousa e a dona da lista). */
function quadrosNaTela(): string[] {
  return [...document.querySelectorAll<HTMLElement>('[data-quadro]')].map((e) => e.dataset.quadro ?? '')
}

export function alvosAgora(): string[] {
  return escolherAlvos(estado.selecionados, estado.ultimo, quadrosNaTela())
}

/** Guarda o ultimo quadro tocado: clique ou foco em qualquer coisa dentro dele. */
export function useUltimoQuadro(): void {
  useEffect(() => {
    const marcar = (e: Event): void => {
      const id = (e.target as Element | null)?.closest?.<HTMLElement>('[data-quadro]')?.dataset.quadro
      if (id) estado.ultimo = id
    }
    window.addEventListener('pointerdown', marcar, true)
    window.addEventListener('focusin', marcar, true)
    return () => {
      window.removeEventListener('pointerdown', marcar, true)
      window.removeEventListener('focusin', marcar, true)
    }
  }, [])
}
