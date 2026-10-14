// Converte o estado salvo em nos do React Flow (T3.4b). Funcao pura, testavel.
import type { Node } from '@xyflow/react'
import type { EstadoTela, PerfilComConta, Quadro, Repo, TipoQuadro } from '../../../shared/model'

export interface AcoesLousa {
  criarQuadro(repoId: string, tipo: TipoQuadro, perfilId?: string): void
  removerQuadro(quadroId: string): void
}

export type RepoNo = Node<{ repo: Repo; perfis: PerfilComConta[]; acoes: AcoesLousa }, 'repo'>
export type QuadroNo = Node<{ quadro: Quadro; perfil: PerfilComConta | undefined; acoes: AcoesLousa }, 'quadro'>

export const idDoNoRepo = (repoId: string): string => `repo:${repoId}`

/** O pai (moldura do repo) vem ANTES dos filhos (quadros): exigencia do React Flow. */
export function montarNos(estado: EstadoTela, acoes: AcoesLousa): Array<RepoNo | QuadroNo> {
  const repos = estado.repos.map(
    (repo): RepoNo => ({
      id: idDoNoRepo(repo.id),
      type: 'repo',
      position: { x: repo.caixa.x, y: repo.caixa.y },
      style: { width: repo.caixa.largura, height: repo.caixa.altura },
      dragHandle: '.cabecalho-repo',
      data: { repo, perfis: estado.perfis, acoes },
    }),
  )
  const existentes = new Set(estado.repos.map((r) => r.id))
  const quadros = estado.quadros
    .filter((q) => existentes.has(q.repoId))
    .map(
      (quadro): QuadroNo => ({
        id: quadro.id,
        type: 'quadro',
        parentId: idDoNoRepo(quadro.repoId),
        extent: 'parent',
        position: { x: quadro.caixa.x, y: quadro.caixa.y },
        style: { width: quadro.caixa.largura, height: quadro.caixa.altura },
        dragHandle: '.cabecalho-quadro',
        data: { quadro, perfil: estado.perfis.find((p) => p.id === quadro.perfilId), acoes },
      }),
    )
  return [...repos, ...quadros]
}
