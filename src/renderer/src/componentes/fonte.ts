// Tamanho da letra de cada terminal (T8.4): Ctrl+roda do mouse muda, e o tamanho fica guardado
// por terminal neste PC (localStorage; se falhar, so volta ao padrao).
import { lerAparencia, TAMANHO_MAIOR as MAIOR, TAMANHO_MENOR as MENOR } from './tema'

const CHAVE = 'lousa.fontes'

/** Quadro sem tamanho guardado usa o da Aparencia (T15.1). */
export const fontePadrao = (): number => lerAparencia().tamanho

/** Roda para cima (deltaY < 0) aumenta um ponto; para baixo diminui; sempre entre 9 e 24. */
export function proximaFonte(atual: number, deltaY: number): number {
  if (deltaY === 0) return atual
  return Math.min(MAIOR, Math.max(MENOR, atual + (deltaY < 0 ? 1 : -1)))
}

function lerTodas(): Record<string, number> {
  try {
    const salvo: unknown = JSON.parse(localStorage.getItem(CHAVE) ?? '{}')
    return salvo && typeof salvo === 'object' ? (salvo as Record<string, number>) : {}
  } catch {
    return {}
  }
}

export function lerFonte(chave: string): number {
  const valor = lerTodas()[chave]
  return typeof valor === 'number' && valor >= MENOR && valor <= MAIOR ? valor : fontePadrao()
}

/** Voltar ao tamanho da Aparencia apaga o do quadro: ele passa a seguir a Aparencia de novo. */
export function guardarFonte(chave: string, tamanho: number): void {
  try {
    const todas = lerTodas()
    if (tamanho === fontePadrao()) delete todas[chave]
    else todas[chave] = tamanho
    localStorage.setItem(CHAVE, JSON.stringify(todas))
  } catch {
    // sem localStorage (janela privada, teste): o tamanho vale so ate fechar
  }
}
