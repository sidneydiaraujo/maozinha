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
import type { EstadoTela, Quadro, Repo } from '../../../shared/model'
import '../estilos/lousa.css'
import { chamaAtencao } from './atencao'
import { semQuadro, textoDoFim } from './copia'
import { aoPedirFoco, aoPedirNovoQuadro } from './foco'
import { algumQuadroVisivel, montarNos, type AcoesLousa, type QuadroNo } from './nos'
import { NovoQuadro } from './NovoQuadro'
import { QuadroNode } from './QuadroNode'
import { useNovoQuadro } from './useNovoQuadro'
import { usePanoMeio } from './usePanoMeio'
import { useAmpliar } from './useAmpliar'
import { useMapaAtencao } from './useAtencao'
import { useSalvarLayout } from './useSalvarLayout'

// Fora do componente: dentro dele o React Flow recriaria todos os nos a cada render.
const nodeTypes = { quadro: QuadroNode }

interface Props {
  /** Muda quando algo fora da lousa (nome de conta) mudou: a lousa recarrega. */
  versao: number
  /** Pastas e quadros mudaram: a lateral (T7.3) acompanha. */
  aoMudarPastas(repos: Repo[], quadros: Quadro[]): void
  /** Caminho clicado num terminal (T8.3). */
  aoAbrirArquivo(repoId: string, relativo: string): void
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

function useEstadoLousa(versao: number, extras: Pick<AcoesLousa, 'abrirArquivo' | 'ampliar'>) {
  const { abrirArquivo, ampliar } = extras
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
  const [aviso, setAviso] = useAvisoPassageiro()
  const acoes = useMemo<AcoesLousa>(
    () => ({
      removerQuadro: (quadroId) => {
        window.lousa.quadros
          .remover(quadroId)
          .then((fim) => {
            setEstado((e) => e && semQuadro(e, quadroId, fim))
            setAviso(textoDoFim(fim))
          })
          .catch(falhou)
      },
      // Erro aqui aparece no menu da conta (quem chamou), nao no topo da lousa.
      trocarConta: async (quadroId, perfilId) => {
        const novo = await window.lousa.quadros.trocarConta(quadroId, perfilId)
        setEstado((e) => (e ? { ...e, quadros: e.quadros.map((q) => (q.id === quadroId ? novo : q)) } : e))
      },
      abrirArquivo,
      ampliar,
    }),
    [falhou, abrirArquivo, ampliar, setAviso],
  )
  const tirarPasta = useCallback(
    async (repoId: string) => {
      const fim = await window.lousa.repos.remover(repoId)
      setEstado((e) =>
        e
          ? { ...e, repos: e.repos.filter((r) => r.id !== repoId), quadros: e.quadros.filter((q) => q.repoId !== repoId) }
          : e,
      )
      setAviso(textoDoFim(fim))
    },
    [setAviso],
  )
  return { estado, setEstado, erro, aviso, falhou, acoes, tirarPasta }
}

/** Frase que some sozinha depois de alguns segundos (ex.: o que aconteceu com a copia, D18). */
function useAvisoPassageiro(): [string | null, (texto: string | null) => void] {
  const [aviso, setAviso] = useState<string | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = window.setTimeout(() => setAviso(null), 10000)
    return () => window.clearTimeout(t)
  }, [aviso])
  return [aviso, setAviso]
}

/** Zoom/posicao antigos podem deixar tudo fora da tela: sem nenhum quadro visivel, enquadra. */
function enquadrarSeSumiu(i: ReactFlowInstance<QuadroNo>, estado: EstadoTela): void {
  if (estado.quadros.length > 0 && !algumQuadroVisivel(estado.quadros, estado.viewport)) {
    window.setTimeout(() => void i.fitView({ maxZoom: 1, duration: 300 }), 50)
  }
}

/** A lateral (T7.3) acompanha as pastas e os quadros da lousa. */
function useAvisarPastas(estado: EstadoTela | null, aoMudarPastas: Props['aoMudarPastas']): void {
  const repos = estado?.repos
  const quadros = estado?.quadros
  useEffect(() => {
    if (repos && quadros) aoMudarPastas(repos, quadros)
  }, [repos, quadros, aoMudarPastas])
}

/**
 * Pedidos de fora da lousa: barra de cima, notificacao do Windows ou Ctrl+K enquadram um quadro
 * (T8.2); "Novo quadro em <pasta>" do Ctrl+K abre a janelinha com a pasta marcada (T12.1).
 */
function usePedidos(
  instancia: React.RefObject<ReactFlowInstance<QuadroNo> | null>,
  abrirNoCentro: (perfilId?: string, repoId?: string) => void,
): void {
  useEffect(
    () =>
      aoPedirFoco((quadroId) => {
        void instancia.current?.fitView({ nodes: [{ id: quadroId }], padding: 0.2, maxZoom: 1, duration: 400 })
      }),
    [instancia],
  )
  useEffect(() => aoPedirNovoQuadro((repoId) => abrirNoCentro(undefined, repoId)), [abrirNoCentro])
}

/** Minimapa com a cor da conta; quadro que pede atencao fica ambar. */
function Minimapa(): React.JSX.Element {
  const mapa = useMapaAtencao()
  return (
    <MiniMap<QuadroNo>
      pannable
      zoomable
      nodeColor={(no) => (chamaAtencao(mapa.get(no.id)) ? '#f5a524' : (no.data.perfil?.cor ?? '#555'))}
    />
  )
}

function Avisos(p: { erro: string | null; aviso: string | null; vazia: boolean }): React.JSX.Element {
  const { erro, aviso, vazia } = p
  return (
    <>
      {erro && (
        <p className="lousa-erro" role="alert">
          {erro}
        </p>
      )}
      {!erro && aviso && (
        <p className="lousa-aviso" role="status">
          {aviso}
        </p>
      )}
      {vazia && (
        <p className="lousa-vazia">
          Clique em “+ Novo quadro”, dê duplo clique aqui ou arraste o ícone de uma conta (no alto) para cá.
        </p>
      )}
    </>
  )
}

export function Lousa({ versao, aoMudarPastas, aoAbrirArquivo }: Props): React.JSX.Element {
  const instancia = useRef<ReactFlowInstance<QuadroNo> | null>(null)
  const ampliar = useAmpliar(instancia)
  const { estado, setEstado, erro, aviso, falhou, acoes, tirarPasta } = useEstadoLousa(versao, {
    abrirArquivo: aoAbrirArquivo,
    ampliar,
  })
  useAvisarPastas(estado, aoMudarPastas)
  const [nos, setNos, aoMudarNos] = useNodesState<QuadroNo>([])
  const area = useRef<HTMLDivElement>(null)
  const novo = useNovoQuadro({ instancia, area, setEstado })

  const { aoMudar, aoMoverVista } = useSalvarLayout({
    nos,
    aoMudarNos,
    viewportInicial: estado?.viewport,
    aoFalhar: falhou,
  })
  const aoApertarMeio = usePanoMeio(instancia, aoMoverVista)
  usePedidos(instancia, novo.abrirNoCentro)

  useEffect(() => {
    if (estado) setNos((atuais) => preservarGeometria(montarNos(estado, acoes), atuais))
  }, [estado, acoes, setNos])

  return (
    <div
      className="lousa"
      ref={area}
      onMouseDownCapture={aoApertarMeio}
      onDoubleClick={novo.aoDuploClique}
      onDragOver={novo.aoArrastarPorCima}
      onDrop={novo.aoSoltar}
    >
      <Avisos erro={erro} aviso={aviso} vazia={estado?.quadros.length === 0} />
      {estado && (
        <button className="botao-novo-quadro" onClick={() => novo.abrirNoCentro()}>
          + Novo quadro
        </button>
      )}
      {estado && (
        <ReactFlow
          nodes={nos}
          onNodesChange={aoMudar}
          onMoveEnd={(_, viewport) => aoMoverVista(viewport)}
          nodeTypes={nodeTypes}
          onInit={(i) => {
            instancia.current = i
            enquadrarSeSumiu(i, estado)
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
          <Minimapa />
        </ReactFlow>
      )}
      {estado && novo.novo && (
        <NovoQuadro
          perfis={estado.perfis}
          repos={estado.repos}
          quadros={estado.quadros}
          perfilInicial={novo.novo.perfilId}
          repoInicial={novo.novo.repoId}
          tela={novo.novo.tela}
          aoCriar={novo.criar}
          aoNovaPasta={novo.pastaNova}
          aoTirarPasta={tirarPasta}
          aoCancelar={novo.cancelar}
        />
      )}
    </div>
  )
}
