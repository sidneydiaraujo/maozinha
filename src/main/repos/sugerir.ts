// Sugere a conta de um repositorio pela pasta dele (T3.1, C11).
// O dono do git remote nao serve de pista: repos pessoais e da empresa
// estao todos na mesma conta do GitHub.
import type { Perfil } from '../../shared/model'

/** Minusculas, '/' vira '\' e sem '\' no fim: comparavel no Windows. */
export function normalizarCaminho(caminho: string): string {
  return caminho.toLowerCase().replaceAll('/', '\\').replace(/\\+$/, '')
}

function dentroDe(caminho: string, raiz: string): boolean {
  const c = normalizarCaminho(caminho)
  const r = normalizarCaminho(raiz)
  return r !== '' && (c === r || c.startsWith(`${r}\\`))
}

/**
 * 1) a primeira conta cuja raiz contem a pasta; 2) a ultima conta usada, se
 * ainda existir; 3) a primeira conta; 4) sem contas, null.
 */
export function sugerirPerfil(
  caminho: string,
  perfis: Pick<Perfil, 'id' | 'raizes'>[],
  ultimoPerfilId: string | null,
): string | null {
  const dono = perfis.find((p) => p.raizes.some((raiz) => dentroDe(caminho, raiz)))
  if (dono) return dono.id
  if (ultimoPerfilId !== null && perfis.some((p) => p.id === ultimoPerfilId)) return ultimoPerfilId
  return perfis[0]?.id ?? null
}
