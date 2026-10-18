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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { EstadoTela } from '../../../shared/model'
import '../estilos/lousa.css'
import { algumQuadroVisivel, montarNos, type AcoesLousa, type QuadroNo } from './nos'
import { NovoQuadro } from './NovoQuadro'
import { QuadroNode } from './QuadroNode'
import { useNovoQuadro } from './useNovoQuadro'
import { usePanoMeio } from './usePanoMeio'
import { useSalvarLayout } from './useSalvarLayout'

// Fora do componente: dentro dele o React Flow recriaria todos os nos a cada render.
const nodeTypes = { quadro: QuadroNode }

interface Props {
  /** Muda quando algo fora da lousa (conta, pasta) mudou: a lousa recarrega. */
  versao: number
  /** "+ Agente" num cartao: abre o "Novo quadro" com essa conta. Muda a cada clique. */
  pedido: { perfilId: string; vez: number } | null
  /** Uma pasta nova entrou pela janelinha: a barra lateral atualiza a lista. */
  aoMudarPastas(): void
}

/** Mantem posicao/tamanho que o usuario acabou de ajustar quando o estado e recarregado. */
function preservarGeometria(novos: QuadroNo[], atuais: Node[]): QuadroNo[] {
  return novos.map((no) => {
    const antigo = atuais.find((a) => a.id === no.id)
    if (!antigo) return no
    return { ...no, position: antigo.position, width: antigo.width, height: antigo.height, style: antigo.style }
  })
}

/** Vista ainda no valor de fabrica: nunca foi movida, entao ajusta para mostrar tudo. */
const vistaIntocada = (v: Viewport): boolean => v.x === 0 && v.y === 0 && v.zoom === 1

function useEstadoLousa(versao: number) {
  const [estado, setEstado] = useState<EstadoTela | null>(null)
  const [erro, setErro] = useState<string | null>(null)
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
      removerQuadro: (quadroId) => {
        window.lousa.quadros
          .remover(quadroId)
          .then(() => setEstado((e) => (e ? { ...e, quadros: e.quadros.filter((q) => q.id !== quadroId) } : e)))
          .catch(falhou)
      },
    }),
    [falhou],
  )
  return { estado, setEstado, erro, falhou, acoes }
}

function Avisos({ erro, vazia }: { erro: string | null; vazia: boolean }): React.JSX.Element {
  return (
    <>
      {erro && (
        <p className="lousa-erro" role="alert">
          {erro}
        </p>
      )}
      {vazia && (
        <p className="lousa-vazia">
          Arraste uma conta da barra para cá, dê duplo clique aqui ou use “+ Agente” num cartão.
        </p>
      )}
    </>
  )
}

export function Lousa({ versao, pedido, aoMudarPastas }: Props): React.JSX.Element {
  const { estado, setEstado, erro, falhou, acoes } = useEstadoLousa(versao)
  const [nos, setNos, aoMudarNos] = useNodesState<QuadroNo>([])
  const instancia = useRef<ReactFlowInstance<QuadroNo> | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const novo = useNovoQuadro({ instancia, area, setEstado })
  const { abrirNoCentro } = novo

  const { aoMudar, aoMoverVista } = useSalvarLayout({
    nos,
    aoMudarNos,
    viewportInicial: estado?.viewport,
    aoFalhar: falhou,
  })
  const aoApertarMeio = usePanoMeio(instancia, aoMoverVista)

  useEffect(() => {
    if (estado) setNos((atuais) => preservarGeometria(montarNos(estado, acoes), atuais))
  }, [estado, acoes, setNos])
  useEffect(() => {
    if (pedido) abrirNoCentro(pedido.perfilId)
  }, [pedido, abrirNoCentro])

  return (
    <div
      className="lousa"
      ref={area}
      onMouseDownCapture={aoApertarMeio}
      onDoubleClick={novo.aoDuploClique}
      onDragOver={novo.aoArrastarPorCima}
      onDrop={novo.aoSoltar}
    >
      <Avisos erro={erro} vazia={estado?.quadros.length === 0} />
      {estado && (
        <ReactFlow
          nodes={nos}
          onNodesChange={aoMudar}
          onMoveEnd={(_, viewport) => aoMoverVista(viewport)}
          nodeTypes={nodeTypes}
          onInit={(i) => {
            instancia.current = i
            // Zoom/posicao antigos podem deixar tudo fora da tela: sem nenhum quadro visivel, enquadra.
            if (estado.quadros.length > 0 && !algumQuadroVisivel(estado.quadros, estado.viewport)) {
              window.setTimeout(() => void i.fitView({ maxZoom: 1, duration: 300 }), 50)
            }
          }}
          colorMode="dark"
          minZoom={0.2}
          maxZoom={2}
          zoomOnDoubleClick={false}
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
      {estado && novo.novo && (
        <NovoQuadro
          perfis={estado.perfis}
          repos={estado.repos}
          perfilInicial={novo.novo.perfilId}
          tela={novo.novo.tela}
          aoCriar={novo.criar}
          aoNovaPasta={(repo) => {
            novo.pastaNova(repo)
            aoMudarPastas()
          }}
          aoCancelar={novo.cancelar}
        />
      )}
    </div>
  )
}
