import { Background, Controls, MiniMap, ReactFlow, useNodesState, type Node, type Viewport } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EstadoTela, TipoQuadro } from '../../../shared/model'
import '../estilos/lousa.css'
import { montarNos, type AcoesLousa, type QuadroNo, type RepoNo } from './nos'
import { QuadroNode } from './QuadroNode'
import { RepoNode } from './RepoNode'
import { useSalvarLayout } from './useSalvarLayout'

// Fora do componente: dentro dele o React Flow recriaria todos os nos a cada render.
const nodeTypes = { repo: RepoNode, quadro: QuadroNode }

interface Props {
  /** Muda quando algo fora da lousa (conta, repo) mudou: a lousa recarrega. */
  versao: number
}

/** Mantem posicao/tamanho que o usuario acabou de ajustar quando o estado e recarregado. */
function preservarGeometria(novos: Array<RepoNo | QuadroNo>, atuais: Node[]): Array<RepoNo | QuadroNo> {
  return novos.map((no) => {
    const antigo = atuais.find((a) => a.id === no.id)
    if (!antigo) return no
    return { ...no, position: antigo.position, width: antigo.width, height: antigo.height, style: antigo.style }
  })
}

/** Vista ainda no valor de fabrica: nunca foi movida, entao ajusta para mostrar tudo. */
const vistaIntocada = (v: Viewport): boolean => v.x === 0 && v.y === 0 && v.zoom === 1

export function Lousa({ versao }: Props): React.JSX.Element {
  const [estado, setEstado] = useState<EstadoTela | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [nos, setNos, aoMudarNos] = useNodesState<RepoNo | QuadroNo>([])

  useEffect(() => {
    let ativo = true
    window.lousa.lousa
      .carregar()
      .then((e) => ativo && setEstado(e))
      .catch((e: unknown) => ativo && setErro(e instanceof Error ? e.message : String(e)))
    return () => {
      ativo = false
    }
  }, [versao])

  const falhou = useCallback((e: unknown) => setErro(e instanceof Error ? e.message : String(e)), [])
  const acoes = useMemo<AcoesLousa>(
    () => ({
      criarQuadro: (repoId: string, tipo: TipoQuadro, perfilId?: string) => {
        setErro(null)
        window.lousa.quadros
          .criar(repoId, tipo, perfilId)
          .then((q) => setEstado((e) => (e ? { ...e, quadros: [...e.quadros, q] } : e)))
          .catch(falhou)
      },
      removerQuadro: (quadroId: string) => {
        window.lousa.quadros
          .remover(quadroId)
          .then(() => setEstado((e) => (e ? { ...e, quadros: e.quadros.filter((q) => q.id !== quadroId) } : e)))
          .catch(falhou)
      },
    }),
    [falhou],
  )

  const { aoMudar, aoMoverVista } = useSalvarLayout({
    nos,
    aoMudarNos,
    viewportInicial: estado?.viewport,
    aoFalhar: falhou,
  })

  useEffect(() => {
    if (estado) setNos((atuais) => preservarGeometria(montarNos(estado, acoes), atuais))
  }, [estado, acoes, setNos])

  return (
    <div className="lousa">
      {erro && (
        <p className="lousa-erro" role="alert">
          {erro}
        </p>
      )}
      {estado?.repos.length === 0 && <p className="lousa-vazia">Adicione um repositório para começar.</p>}
      {estado && (
        <ReactFlow
          nodes={nos}
          onNodesChange={aoMudar}
          onMoveEnd={(_, viewport) => aoMoverVista(viewport)}
          nodeTypes={nodeTypes}
          colorMode="dark"
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={estado.viewport}
          fitView={vistaIntocada(estado.viewport)}
          fitViewOptions={{ maxZoom: 1 }}
          deleteKeyCode={null}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={24} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable />
        </ReactFlow>
      )}
    </div>
  )
}
