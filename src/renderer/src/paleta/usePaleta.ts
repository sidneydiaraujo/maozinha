import { useEffect, useState } from 'react'

/**
 * Ctrl+K abre e fecha a paleta (T12.1) de qualquer lugar, inclusive com o terminal em foco:
 * a tecla e pega antes do xterm (fase de captura), entao nao chega ao programa do terminal.
 */
export function usePaleta(): { aberta: boolean; fechar(): void } {
  const [aberta, setAberta] = useState(false)
  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (!e.ctrlKey || e.shiftKey || e.altKey || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      e.stopPropagation()
      setAberta((a) => !a)
    }
    window.addEventListener('keydown', tecla, true)
    return () => window.removeEventListener('keydown', tecla, true)
  }, [])
  return { aberta, fechar: () => setAberta(false) }
}
