// Converte o estado salvo em nos do React Flow (T3.4b). Funcao pura, testavel.
import type { Node } from '@xyflow/react'
import type { Caixa, EstadoTela, PerfilComConta, Quadro, Repo, TipoQuadro } from '../../../shared/model'

export interface AcoesLousa {
  criarQuadro(repoId: string, tipo: TipoQuadro, perfilId?: string): void
  removerQuadro(quadroId: string): void
  mudarPerfilPadrao(repoId: string, perfilId: string): void
  removerRepo(repoId: string): void
}

export type RepoNo = Node<{ repo: Repo; perfis: PerfilComConta[]; acoes: AcoesLousa; vazio: boolean }, 'repo'>
export type QuadroNo = Node<{ quadro: Quadro; perfil: PerfilComConta | undefined; acoes: AcoesLousa }, 'quadro'>

export const idDoNoRepo = (repoId: string): string => `repo:${repoId}`
export const repoIdDoNo = (noId: string): string => noId.replace(/^repo:/, '')

const numero = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined)

/** Posicao e tamanho atuais de um no; depois de redimensionar, width/height mandam no style. */
export function caixaDoNo(no: Node): Caixa {
  return {
    x: no.position.x,
    y: no.position.y,
    largura: no.width ?? numero(no.style?.width) ?? no.measured?.width ?? 0,
    altura: no.height ?? numero(no.style?.height) ?? no.measured?.height ?? 0,
  }
}

/** O pai (moldura do repo) vem ANTES dos filhos (quadros): exigencia do React Flow. */
export function montarNos(estado: EstadoTela, acoes: AcoesLousa): Array<RepoNo | QuadroNo> {
  const repos = estado.repos.map((repo): RepoNo => ({
    id: idDoNoRepo(repo.id),
    type: 'repo',
    position: { x: repo.caixa.x, y: repo.caixa.y },
    style: { width: repo.caixa.largura, height: repo.caixa.altura },
    dragHandle: '.cabecalho-repo',
    data: { repo, perfis: estado.perfis, acoes, vazio: !estado.quadros.some((q) => q.repoId === repo.id) },
  }))
  const existentes = new Set(estado.repos.map((r) => r.id))
  const quadros = estado.quadros
    .filter((q) => existentes.has(q.repoId))
    .map((quadro): QuadroNo => ({
      id: quadro.id,
      type: 'quadro',
      parentId: idDoNoRepo(quadro.repoId),
      extent: 'parent',
      position: { x: quadro.caixa.x, y: quadro.caixa.y },
      style: { width: quadro.caixa.largura, height: quadro.caixa.altura },
      dragHandle: '.cabecalho-quadro',
      data: { quadro, perfil: estado.perfis.find((p) => p.id === quadro.perfilId), acoes },
    }))
  return [...repos, ...quadros]
}
