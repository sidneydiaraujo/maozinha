import type { ReactFlowInstance } from '@xyflow/react'
import { useCallback, useState, type Dispatch, type RefObject, type SetStateAction } from 'react'
import type { EstadoTela, Posicao, Repo, TipoQuadro } from '../../../shared/model'
import { TIPO_ARRASTE_CONTA, type QuadroNo } from './nos'

/** Tamanho do quadro novo (igual ao do main): o "+ Novo quadro" centraliza o quadro na vista. */
const METADE_QUADRO = { x: 320, y: 210 }
const METADE_JANELA = { x: 170, y: 200 }

export interface PedidoNovo {
  perfilId?: string
  /** Onde a janelinha aparece (pixels da tela). */
  tela: Posicao
  /** Onde o quadro nasce (coordenadas da lousa). */
  lousa: Posicao
}

interface Opcoes {
  instancia: RefObject<ReactFlowInstance<QuadroNo> | null>
  area: RefObject<HTMLDivElement | null>
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>
}

/**
 * As tres portas para o "Novo quadro" (T5.3, D14): o botao "+ Novo quadro", duplo clique no
 * vazio e soltar uma conta arrastada da barra. Todas abrem a mesma janelinha.
 */
export function useNovoQuadro({ instancia, area, setEstado }: Opcoes) {
  const [novo, setNovo] = useState<PedidoNovo | null>(null)

  const naLousa = useCallback(
    (tela: Posicao): Posicao => instancia.current?.screenToFlowPosition(tela) ?? tela,
    [instancia],
  )

  /** Botao "+ Novo quadro": sem conta marcada, a janelinha sugere a ultima usada na pasta. */
  const abrirNoCentro = useCallback(
    (perfilId?: string) => {
      const r = area.current?.getBoundingClientRect()
      const centro = r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 600, y: 400 }
      const lousa = naLousa(centro)
      setNovo({
        perfilId,
        tela: { x: centro.x - METADE_JANELA.x, y: centro.y - METADE_JANELA.y },
        lousa: { x: lousa.x - METADE_QUADRO.x, y: lousa.y - METADE_QUADRO.y },
      })
    },
    [area, naLousa],
  )

  const aoDuploClique = useCallback(
    (e: React.MouseEvent) => {
      const alvo = e.target as Element
      if (!alvo.closest('.react-flow__pane') || alvo.closest('.react-flow__node')) return
      const tela = { x: e.clientX, y: e.clientY }
      setNovo({ tela, lousa: naLousa(tela) })
    },
    [naLousa],
  )

  const aoArrastarPorCima = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(TIPO_ARRASTE_CONTA)) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const aoSoltar = useCallback(
    (e: React.DragEvent) => {
      const perfilId = e.dataTransfer.getData(TIPO_ARRASTE_CONTA)
      if (!perfilId) return
      e.preventDefault()
      const tela = { x: e.clientX, y: e.clientY }
      setNovo({ perfilId, tela, lousa: naLousa(tela) })
    },
    [naLousa],
  )

  const criar = useCallback(
    async (repoId: string, tipo: TipoQuadro, perfilId: string) => {
      if (!novo) return
      const quadro = await window.lousa.quadros.criar(repoId, tipo, perfilId, novo.lousa)
      setEstado((e) =>
        e
          ? {
              ...e,
              quadros: [...e.quadros, quadro],
              repos: e.repos.map((r) => (r.id === repoId ? { ...r, perfilPadraoId: perfilId } : r)),
            }
          : e,
      )
      setNovo(null)
    },
    [novo, setEstado],
  )

  const pastaNova = useCallback(
    (repo: Repo) =>
      setEstado((e) => (e && !e.repos.some((r) => r.id === repo.id) ? { ...e, repos: [...e.repos, repo] } : e)),
    [setEstado],
  )

  return {
    novo,
    cancelar: () => setNovo(null),
    abrirNoCentro,
    aoDuploClique,
    aoArrastarPorCima,
    aoSoltar,
    criar,
    pastaNova,
  }
}
