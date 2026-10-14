// Converte o estado salvo em nos do React Flow (T3.4b, D13: so quadros, soltos). Funcao pura, testavel.
import type { Node } from '@xyflow/react'
import type { Caixa, EstadoTela, PerfilComConta, Quadro, Repo, Viewport } from '../../../shared/model'

export interface AcoesLousa {
  removerQuadro(quadroId: string): void
}

export type QuadroNo = Node<
  { quadro: Quadro; perfil: PerfilComConta | undefined; repo: Repo; acoes: AcoesLousa },
  'quadro'
>

/** Arrastar o cartao da conta para a lousa carrega o id da conta neste tipo. */
export const TIPO_ARRASTE_CONTA = 'application/x-lousa-conta'

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

/** Quadro de pasta que ja nao existe some (remover a pasta fecha os quadros dela). */
export function montarNos(estado: EstadoTela, acoes: AcoesLousa): QuadroNo[] {
  const repos = new Map(estado.repos.map((r) => [r.id, r]))
  return estado.quadros.flatMap((quadro): QuadroNo[] => {
    const repo = repos.get(quadro.repoId)
    if (!repo) return []
    return [
      {
        id: quadro.id,
        type: 'quadro',
        position: { x: quadro.caixa.x, y: quadro.caixa.y },
        style: { width: quadro.caixa.largura, height: quadro.caixa.altura },
        dragHandle: '.cabecalho-quadro',
        data: { quadro, perfil: estado.perfis.find((p) => p.id === quadro.perfilId), repo, acoes },
      },
    ]
  })
}

/** A area visivel (aprox. 1200x800 px de tela) cruza algum quadro? */
export function algumQuadroVisivel(quadros: Quadro[], v: Viewport): boolean {
  const x0 = -v.x / v.zoom
  const y0 = -v.y / v.zoom
  const x1 = x0 + 1200 / v.zoom
  const y1 = y0 + 800 / v.zoom
  return quadros.some(({ caixa: c }) => c.x < x1 && c.x + c.largura > x0 && c.y < y1 && c.y + c.altura > y0)
}
