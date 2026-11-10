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
import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { EstadoTela, Ligacao, Quadro, Repo } from '../../../shared/model'
import '../estilos/lousa.css'
import '../estilos/novo.css'
import { chamaAtencao } from './atencao'
import { BarraEnvio } from './BarraEnvio'
import { marcarSelecionados, useUltimoQuadro } from './alvos'
import { aoPedirAviso, aoPedirFoco, aoPedirMostrar, aoPedirNovoQuadro } from './foco'
import { algumQuadroVisivel, montarNos, type AcoesLousa } from './nos'
import { montarNotas, type AcoesNota, type NoLousa } from './notas'
import { NotaNode } from './NotaNode'
import { NovoQuadro } from './NovoQuadro'
import { juntarComAtuais } from './juntarNos'
import { QuadroNode } from './QuadroNode'
import { useEstadoLousa } from './useEstadoLousa'
import { useNotas } from './useNotas'
import { useNovoQuadro } from './useNovoQuadro'
import { useVistasSalvas } from './useVistasSalvas'
import { usePanoMeio } from './usePanoMeio'
import { useAmpliar, type Ampliacao } from './useAmpliar'
import { useLigacoes } from './useLigacoes'
import { useMapaAtencao } from './useAtencao'
import { useSalvarLayout } from './useSalvarLayout'

// Fora do componente: dentro dele o React Flow recriaria todos os nos a cada render.
const nodeTypes = { quadro: QuadroNode, nota: NotaNode }
const OPCOES_FIXAS = {
  colorMode: 'dark',
  minZoom: 0.2,
  maxZoom: 2,
  zoomOnDoubleClick: false,
  deleteKeyCode: null,
  proOptions: { hideAttribution: true },
} as const

interface Props {
  /** Muda quando algo fora da lousa (nome de conta) mudou: a lousa recarrega. */
  versao: number
  /** Pastas, quadros e linhas do time mudaram: a lateral (T7.3) e a fila de prontos (A26) acompanham. */
  aoMudarPastas(repos: Repo[], quadros: Quadro[], ligacoes: Ligacao[]): void
  /** Caminho clicado num terminal (T8.3). */
  aoAbrirArquivo(repoId: string, relativo: string): void
}

/** Vista ainda no valor de fabrica: nunca foi movida, entao ajusta para mostrar tudo. */
const vistaIntocada = (v: Viewport): boolean => v.x === 0 && v.y === 0 && v.zoom === 1

/** Zoom/posicao antigos podem deixar tudo fora da tela: sem nenhum quadro visivel, enquadra. */
function enquadrarSeSumiu(i: ReactFlowInstance<NoLousa>, estado: EstadoTela): void {
  if (estado.quadros.length > 0 && !algumQuadroVisivel(estado.quadros, estado.viewport)) {
    window.setTimeout(() => void i.fitView({ maxZoom: 1, duration: 300 }), 50)
  }
}

/**
 * Pedidos de fora da lousa: barra de cima, notificacao do Windows ou Ctrl+K enquadram um quadro
 * (T8.2); "Novo quadro em <pasta>" do Ctrl+K abre a janelinha com a pasta marcada (T12.1).
 */
function usePedidos(
  { irPara, mostrar }: Pick<Ampliacao, 'irPara' | 'mostrar'>,
  abrirNoCentro: (perfilId?: string, repoId?: string) => void,
  avisar: (texto: string) => void,
): void {
  useEffect(() => aoPedirFoco(irPara), [irPara])
  useEffect(() => aoPedirMostrar(mostrar), [mostrar])
  useEffect(() => aoPedirNovoQuadro((repoId) => abrirNoCentro(undefined, repoId)), [abrirNoCentro])
  // "Enviado para 2 quadros" de uma mensagem mandada pelo Ctrl+K (T25.2)
  useEffect(() => aoPedirAviso(avisar), [avisar])
}

/** Selecao e ultimo quadro usado: para quem vai uma mensagem pronta ou uma nota (T25.2). */
function useAlvos(nos: Node[]): string[] {
  useUltimoQuadro()
  // nota selecionada nao conta: a mensagem vai so para quadros
  const selecionados = nos.filter((n) => n.selected && n.type === 'quadro').map((n) => n.id)
  const chave = selecionados.join(',')
  useEffect(() => marcarSelecionados(chave ? chave.split(',') : []), [chave])
  return selecionados
}

/** Minimapa com a cor da conta; quadro que pede atencao fica ambar. */
function Minimapa(): React.JSX.Element {
  const mapa = useMapaAtencao()
  return (
    <MiniMap<NoLousa>
      pannable
      zoomable
      nodeColor={(no) => {
        if (no.type === 'nota') return '#8a7440'
        return chamaAtencao(mapa.get(no.id)) ? '#f0b44c' : (no.data.perfil?.cor ?? '#555')
      }}
    />
  )
}

/** Botoes do canto de cima da lousa. */
function BotoesCriar(p: { aoNovoQuadro(): void; aoNovaNota(): void }): React.JSX.Element {
  return (
    <>
      <button className="botao-novo-quadro" onClick={p.aoNovoQuadro}>
        + Novo quadro
      </button>
      <button className="botao-nova-nota" title="Texto solto na lousa (markdown)" onClick={p.aoNovaNota}>
        + Nota
      </button>
    </>
  )
}

/** Quadros e notas viram os nos do React Flow sempre que o estado muda; o que nao mudou fica (R4.23). */
function useMontarNos(
  estado: EstadoTela | null,
  acoes: { quadros: AcoesLousa; notas: AcoesNota },
  setNos: Dispatch<SetStateAction<NoLousa[]>>,
): void {
  const { quadros, notas } = acoes
  useEffect(() => {
    if (!estado) return
    setNos((atuais) => juntarComAtuais([...montarNos(estado, quadros), ...montarNotas(estado, notas)], atuais))
  }, [estado, quadros, notas, setNos])
}

function Avisos(p: { erro: string | null; aviso: string | null; vazia: boolean; aoFecharErro(): void }): React.JSX.Element {
  const { erro, aviso, vazia } = p
  return (
    <>
      {erro && (
        <p className="lousa-erro" role="alert" title="Clique para fechar" onClick={p.aoFecharErro}>
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
  const instancia = useRef<ReactFlowInstance<NoLousa> | null>(null)
  const area = useRef<HTMLDivElement>(null)
  const ampliacao = useAmpliar(instancia, area)
  const { estado, setEstado, erro, limparErro, aviso, setAviso, falhou, acoes, tirarPasta } = useEstadoLousa(versao, {
    abrirArquivo: aoAbrirArquivo,
    ampliar: ampliacao.ampliar,
    aoMudarPastas,
  })
  const [nos, setNos, aoMudarNos] = useNodesState<NoLousa>([])
  const novo = useNovoQuadro({ instancia, area, setEstado })
  const notas = useNotas({ instancia, area, setEstado, falhou })

  const { aoMudar, aoMoverVista } = useSalvarLayout({
    nos,
    aoMudarNos,
    viewportInicial: estado?.viewport,
    aoFalhar: falhou,
  })
  const aoApertarMeio = usePanoMeio(instancia, aoMoverVista, ampliacao.esquecer)
  usePedidos(ampliacao, novo.abrirNoCentro, setAviso)
  const selecionados = useAlvos(nos)
  useMontarNos(estado, { quadros: acoes, notas: notas.acoes }, setNos)
  useVistasSalvas({ instancia, estado, setEstado, nos, setNos, aoMoverVista, avisar: setAviso })
  const time = useLigacoes({ estado, setEstado, avisar: setAviso, instancia })

  return (
    <div
      className="lousa"
      ref={area}
      onMouseDownCapture={aoApertarMeio}
      onDoubleClick={novo.aoDuploClique}
      onDragOver={novo.aoArrastarPorCima}
      onDrop={novo.aoSoltar}
    >
      <Avisos erro={erro} aoFecharErro={limparErro} aviso={aviso} vazia={estado?.quadros.length === 0 && !estado.notas?.length} />
      <BarraEnvio quadroIds={selecionados} />
      {estado && <BotoesCriar aoNovoQuadro={() => novo.abrirNoCentro()} aoNovaNota={notas.criarNoCentro} />}
      {estado && (
        <ReactFlow
          nodes={nos}
          {...time.flow}
          onNodesChange={aoMudar}
          // roda, arrastar no vazio, minimapa: mexida do usuario (com evento) desfaz o "ampliado"
          onMoveStart={(evento) => evento && ampliacao.esquecer()}
          onMoveEnd={(_, viewport) => aoMoverVista(viewport)}
          nodeTypes={nodeTypes}
          onInit={(i) => {
            instancia.current = i
            enquadrarSeSumiu(i, estado)
          }}
          {...OPCOES_FIXAS}
          defaultViewport={estado.viewport}
          fitView={vistaIntocada(estado.viewport)}
          fitViewOptions={{ maxZoom: 1 }}
        >
          <Background gap={24} />
          <Controls showInteractive={false} />
          <Minimapa />
        </ReactFlow>
      )}
      {time.menu}
      {estado && novo.novo && (
        <NovoQuadro
          perfis={estado.perfis}
          repos={estado.repos}
          quadros={estado.quadros}
          perfilInicial={novo.novo.perfilId}
          repoInicial={novo.novo.repoId}
          tela={novo.novo.tela}
          aoCriar={novo.criar}
          aoCriarLivre={novo.criarLivre}
          aoNovaPasta={novo.pastaNova}
          aoTirarPasta={tirarPasta}
          aoCancelar={novo.cancelar}
        />
      )}
    </div>
  )
}
