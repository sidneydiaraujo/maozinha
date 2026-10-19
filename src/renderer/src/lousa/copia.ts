// Copia separada na tela (T10.4, D18): quando sugerir e o que dizer ao fechar. Funcoes puras.
import type { EstadoTela, FimDaCopia, Quadro } from '../../../shared/model'

/** Ja tem quadro nesta pasta: o novo agente deve ir para uma copia, para nao pisar no outro. */
export function sugerirSeparado(quadros: Quadro[], repoId: string | null): boolean {
  return repoId !== null && quadros.some((q) => q.repoId === repoId)
}

/** Frase curta para o alto da lousa; null quando nao havia copia. */
export function textoDoFim(fim: FimDaCopia): string | null {
  switch (fim.copia) {
    case 'apagada':
      return 'Cópia separada apagada: não tinha trabalho novo.'
    case 'branchGuardada':
      return `Cópia apagada; os commits ficaram na branch ${fim.branch}.`
    case 'mantida':
      return `Cópia mantida em ${fim.caminho}: ${fim.motivo.toLowerCase()}.`
    case 'nenhuma':
      return null
  }
}

/** Tira o quadro; se a copia dele foi apagada, a pasta da copia sai da lista tambem. */
export function semQuadro(e: EstadoTela, quadroId: string, fim: FimDaCopia): EstadoTela {
  const repoId = e.quadros.find((q) => q.id === quadroId)?.repoId
  const saiPasta = fim.copia === 'apagada' || fim.copia === 'branchGuardada'
  return {
    ...e,
    quadros: e.quadros.filter((q) => q.id !== quadroId),
    repos: saiPasta ? e.repos.filter((r) => r.id !== repoId) : e.repos,
  }
}
