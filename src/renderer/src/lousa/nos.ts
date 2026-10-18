// Converte o estado salvo em nos do React Flow (T3.4b, D13: so quadros, soltos; D14: a pasta da o nome). Funcao pura.
import type { Node } from '@xyflow/react'
import type { Caixa, EstadoTela, PerfilComConta, Quadro, Repo, Viewport } from '../../../shared/model'

export interface AcoesLousa {
  removerQuadro(quadroId: string): void
  trocarConta(quadroId: string, perfilId: string): Promise<void>
  /** Caminho clicado no terminal (T8.3): abre no leitor ou no programa do Windows. */
  abrirArquivo(repoId: string, relativo: string): void
  /** Enquadra o quadro na tela; de novo, volta a vista de antes (T8.4). */
  ampliar(quadroId: string): void
}

export type QuadroNo = Node<
  {
    quadro: Quadro
    perfil: PerfilComConta | undefined
    repo: Repo
    /** Nome no cabecalho: a pasta, numerada se tiver mais de um quadro nela. */
    rotulo: string
    /** Contas para onde este quadro pode ir (mesmo provedor: a conversa vai junto). */
    contas: PerfilComConta[]
    acoes: AcoesLousa
  },
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
  const porPasta = new Map<string, number>()
  return estado.quadros.flatMap((quadro): QuadroNo[] => {
    const repo = repos.get(quadro.repoId)
    if (!repo) return []
    const ordem = (porPasta.get(repo.id) ?? 0) + 1
    porPasta.set(repo.id, ordem)
    const perfil = estado.perfis.find((p) => p.id === quadro.perfilId)
    return [
      {
        id: quadro.id,
        type: 'quadro',
        position: { x: quadro.caixa.x, y: quadro.caixa.y },
        style: { width: quadro.caixa.largura, height: quadro.caixa.altura },
        dragHandle: '.cabecalho-quadro',
        data: {
          quadro,
          perfil,
          repo,
          rotulo: ordem === 1 ? repo.nome : `${repo.nome} ${ordem}`,
          contas: estado.perfis.filter((p) => !perfil || p.provedor === perfil.provedor),
          acoes,
        },
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
