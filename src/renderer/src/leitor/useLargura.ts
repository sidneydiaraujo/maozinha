// Largura do leitor, ajustavel arrastando a borda direita e lembrada entre aberturas.
import { useCallback, useState } from 'react'

const GUARDA = 'lousa.leitor.largura'
const PADRAO = 560
const MINIMO = 320

function lerLargura(): number {
  try {
    const n = Number(localStorage.getItem(GUARDA))
    return Number.isFinite(n) && n >= MINIMO ? n : PADRAO
  } catch {
    return PADRAO
  }
}

export function useLargura() {
  const [largura, setLargura] = useState(lerLargura)

  const aoApertarAlca = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const inicioX = e.clientX
      const inicio = largura
      let atual = inicio
      const mover = (ev: MouseEvent): void => {
        atual = Math.max(MINIMO, Math.min(window.innerWidth * 0.6, inicio + ev.clientX - inicioX))
        setLargura(atual)
      }
      const soltar = (): void => {
        window.removeEventListener('mousemove', mover)
        window.removeEventListener('mouseup', soltar)
        try {
          localStorage.setItem(GUARDA, String(Math.round(atual)))
        } catch {
          // sem localStorage a largura volta ao padrao na proxima vez
        }
      }
      window.addEventListener('mousemove', mover)
      window.addEventListener('mouseup', soltar)
    },
    [largura],
  )

  return { largura, aoApertarAlca }
}
