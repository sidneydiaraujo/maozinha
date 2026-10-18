import { useEffect } from 'react'

/** Fecha um menu ou balao ao clicar fora dele ou apertar Esc. */
export function useFecharFora(aberto: boolean, caixa: React.RefObject<HTMLElement | null>, fechar: () => void): void {
  useEffect(() => {
    if (!aberto) return
    const clique = (e: MouseEvent): void => {
      if (!caixa.current?.contains(e.target as Node)) fechar()
    }
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('mousedown', clique)
    window.addEventListener('keydown', tecla)
    return () => {
      window.removeEventListener('mousedown', clique)
      window.removeEventListener('keydown', tecla)
    }
  }, [aberto, caixa, fechar])
}
