// R2.10: agente aberto na pasta do usuario (ou acima dela, como C:\Users ou C:\) enxerga tudo o que
// mora ali, inclusive as pastas das contas (~/.claude*, ~/.codex*). O Mãozinha avisa; nao bloqueia.
import { resolve, sep } from 'node:path'

const normalizar = (caminho: string): string => resolve(caminho).replace(/[\\/]+$/, '').toLowerCase()

/** A pasta e a do usuario ou contem ela (a raiz do disco, C:\Users...)? */
export function pastaAmpla(caminho: string, pastaDoUsuario: string): boolean {
  if (!caminho.trim() || !pastaDoUsuario.trim()) return false
  const pasta = normalizar(caminho)
  const usuario = normalizar(pastaDoUsuario)
  return usuario === pasta || usuario.startsWith(`${pasta}${sep}`)
}
