import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useNodesState,
  type Node,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { EstadoTela } from '../../../shared/model'
import '../estilos/lousa.css'
import { montarNos, type QuadroNo, type RepoNo } from './nos'
import { QuadroNode } from './QuadroNode'
import { RepoNode } from './RepoNode'
import { useAcoesLousa } from './useAcoesLousa'
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

/** A area visivel (aprox. 1200x800 px de tela) cruza alguma moldura de repo? */
function algumRepoVisivel(estado: EstadoTela, v: Viewport): boolean {
  const x0 = -v.x / v.zoom
  const y0 = -v.y / v.zoom
  const x1 = x0 + 1200 / v.zoom
  const y1 = y0 + 800 / v.zoom
  return estado.repos.some(({ caixa: c }) => c.x < x1 && c.x + c.largura > x0 && c.y < y1 && c.y + c.altura > y0)
}

export function Lousa({ versao }: Props): React.JSX.Element {
  const [estado, setEstado] = useState<EstadoTela | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [nos, setNos, aoMudarNos] = useNodesState<RepoNo | QuadroNo>([])
  const instancia = useRef<ReactFlowInstance<RepoNo | QuadroNo> | null>(null)
  const totalRepos = useRef(0)

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
  const acoes = useAcoesLousa(setEstado, setErro)

  // Repo novo enquadra a vista para o usuario ver a moldura que acabou de criar.
  const enquadrar = useCallback(() => {
    window.setTimeout(() => void instancia.current?.fitView({ maxZoom: 1, duration: 300 }), 50)
  }, [])
  useEffect(() => {
    const quantos = estado?.repos.length ?? 0
    if (quantos > totalRepos.current && instancia.current) enquadrar()
    totalRepos.current = quantos
  }, [estado, enquadrar])

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
          onInit={(i) => {
            instancia.current = i
            // Zoom/posicao antigos podem deixar tudo fora da tela: sem nenhum repo visivel, enquadra.
            if (estado.repos.length > 0 && !algumRepoVisivel(estado, estado.viewport)) enquadrar()
          }}
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
