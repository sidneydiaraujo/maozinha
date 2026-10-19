// Onde fica e como se chama a copia separada de um repositorio (T10.1, D18). Funcoes puras.
import type { Repo } from '../../shared/model'
import { slugConta } from '../perfis/slug'

/** Pasta irma do repositorio onde ficam as copias: '<pai>\<nome>.copias'. */
export function pastaDasCopias(caminhoOrigem: string): string {
  return `${caminhoOrigem.replace(/[\\/]+$/, '')}.copias`
}

/** 'Claude 3' -> 'claude-3'; se ja usado (sem caixa), 'claude-3-2', 'claude-3-3'... */
export function apelidoDaCopia(titulo: string, usados: string[]): string {
  const base = slugConta(titulo) || 'copia'
  const ocupados = new Set(usados.map((u) => u.toLowerCase()))
  if (!ocupados.has(base)) return base
  let n = 2
  while (ocupados.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

export function planejarCopia(
  origem: Pick<Repo, 'caminho'>,
  titulo: string,
  usados: string[],
): { caminho: string; branch: string; apelido: string } {
  const apelido = apelidoDaCopia(titulo, usados)
  return { caminho: `${pastaDasCopias(origem.caminho)}\\${apelido}`, branch: `lousa/${apelido}`, apelido }
}
