// Copia separada na tela (T10.4, D18): quando sugerir e o que dizer ao fechar. Funcoes puras.
import type { EstadoTela, FimDaCopia, Quadro, ResumoCopia } from '../../../shared/model'

/** Ja tem quadro nesta pasta: o novo agente deve ir para uma copia, para nao pisar no outro. */
export function sugerirSeparado(quadros: Quadro[], repoId: string | null): boolean {
  return repoId !== null && quadros.some((q) => q.repoId === repoId)
}

/** Frase curta para o alto da lousa; null quando nao havia copia. */
export function textoDoFim(fim: FimDaCopia): string | null {
  switch (fim.copia) {
    case 'apagada':
      return 'Cópia separada apagada: todo o trabalho dela já estava na pasta original.'
    case 'branchGuardada':
      return `Cópia apagada; os commits ficaram na branch ${fim.branch}.`
    case 'mantida':
      return `Cópia mantida em ${fim.caminho}: ${fim.motivo.toLowerCase()}.`
    case 'nenhuma':
      return null
  }
}

/** Titulo e aviso da janela "Juntar" (T11.2): o que a copia tem e o que fica de fora. */
export function frasesDoResumo(r: ResumoCopia): { titulo: string; aviso: string | null } {
  const mais = r.arquivos.reduce((s, a) => s + a.mais, 0)
  const menos = r.arquivos.reduce((s, a) => s + a.menos, 0)
  const commits = r.commits === 1 ? '1 commit' : `${r.commits} commits`
  const arquivos = r.totalArquivos === 1 ? '1 arquivo' : `${r.totalArquivos} arquivos`
  const titulo =
    r.commits === 0
      ? `A cópia não tem commit novo para juntar em ${r.branchAlvo}.`
      : `${commits} da branch ${r.branch}, ${arquivos} (+${mais} −${menos}), para juntar em ${r.branchAlvo}.`
  const aviso = r.pendente ? 'A cópia tem alterações sem commit: elas não entram. Peça ao agente um commit antes.' : null
  return { titulo, aviso }
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
