// Quadro novo nasce num espaco livre (T24.1, D32): nunca em cima de outro quadro. Puro.
import type { Caixa, Posicao } from '../../shared/model'

/** Folga minima entre dois quadros. */
export const FOLGA = 24

function encosta(a: Caixa, b: Caixa): boolean {
  return (
    a.x < b.x + b.largura + FOLGA &&
    b.x < a.x + a.largura + FOLGA &&
    a.y < b.y + b.altura + FOLGA &&
    b.y < a.y + a.altura + FOLGA
  )
}

/**
 * Onde por um quadro `tamanho` que o usuario pediu em `desejada`. Livre: fica ali. Senao, o lugar
 * livre mais perto entre os vizinhos de cada quadro (direita, abaixo, esquerda, acima); se nenhum
 * servir, a direita de todos, na altura pedida.
 */
export function lugarLivre(
  ocupadas: Caixa[],
  desejada: Posicao,
  tamanho: Pick<Caixa, 'largura' | 'altura'>,
): Posicao {
  const livre = (p: Posicao): boolean => !ocupadas.some((c) => encosta({ ...p, ...tamanho }, c))
  if (livre(desejada)) return desejada
  const vizinhos = ocupadas.flatMap((c) => [
    { x: c.x + c.largura + FOLGA, y: c.y },
    { x: c.x, y: c.y + c.altura + FOLGA },
    { x: c.x - tamanho.largura - FOLGA, y: c.y },
    { x: c.x, y: c.y - tamanho.altura - FOLGA },
  ])
  const distancia = (p: Posicao): number => Math.hypot(p.x - desejada.x, p.y - desejada.y)
  const melhor = vizinhos.filter(livre).sort((a, b) => distancia(a) - distancia(b))[0]
  if (melhor) return melhor
  return { x: Math.max(...ocupadas.map((c) => c.x + c.largura)) + FOLGA, y: desejada.y }
}
