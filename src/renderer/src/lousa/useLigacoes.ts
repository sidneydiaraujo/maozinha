// Linhas do time na lousa (T28.2, T28.3, D39): puxar, validar, ajustar, remover e criar colega.
// O main decide; a tela so manda ids de quadro e de linha (e a posicao do colega na lousa).
import type { Connection, Edge, OnConnectEnd, OnConnectStart, ReactFlowInstance } from '@xyflow/react'
import {
  createElement,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from 'react'
import type { ColegaNovo, EstadoTela, ModoLigacao, Posicao } from '../../../shared/model'
import { copiasDoTime, podeLigar, TEXTO_RECUSA } from '../../../shared/time'
import { mensagemDe } from '../componentes/erro'
import { aoPedirColega, aoPedirMenuLinha } from './foco'
import { JanelaJuntarTime, type CopiaDoTime } from './JanelaJuntarTime'
import { comColega, comLigacao, dadosDaTela, montarArestas, type DadosLinha } from './linhas'
import { LinhaTime } from './LinhaTime'
import { MenuLinha, type PedidoMenuLinha } from './MenuLinha'
import { limparRepasse } from './repasses'
import type { NoLousa } from './notas'

// Fora do hook: o React Flow recriaria as arestas a cada render.
const edgeTypes = { time: LinhaTime }
/** Arraste menor que isto e um clique: quem cuida e a propria bolinha (BolinhasTime). */
const CLIQUE_PX = 10

interface Deps {
  estado: EstadoTela | null
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>
  avisar(texto: string): void
  instancia: RefObject<ReactFlowInstance<NoLousa> | null>
}

type Ajuste = { modo?: ModoLigacao; pausada?: boolean }

/** Pedidos ao main; cada resposta entra no estado da tela, cada recusa vira aviso. */
function acoesDoTime(setEstado: Deps['setEstado'], avisar: Deps['avisar']) {
  const falhou = (e: unknown): void => avisar(mensagemDe(e))
  const entrou = (c: ColegaNovo): void => {
    setEstado((e) => e && comColega(e, c))
    avisar(c.repo ? `Colega novo na cópia ${c.repo.copia?.apelido ?? c.repo.nome}, já ligado.` : 'Colega novo na mesma pasta, já ligado.')
  }
  return {
    ligar: (de: string, para: string) =>
      window.lousa.time
        .ligar(de, para)
        .then((l) => setEstado((e) => e && comLigacao(e, l.id, l)))
        .catch(falhou),
    ajustar: (id: string, mudanca: Ajuste) =>
      window.lousa.time
        .ajustar(id, mudanca)
        .then((l) => {
          setEstado((e) => e && comLigacao(e, id, l))
          limparRepasse(id) // retomar ou mudar o modo tira o "Continuar?" (T30.1)
        })
        .catch(falhou),
    remover: (id: string) =>
      window.lousa.time
        .desligar(id)
        .then(() => setEstado((e) => e && comLigacao(e, id, null)))
        .catch(falhou),
    colega: (quadroId: string, posicao?: Posicao) => window.lousa.time.colega(quadroId, posicao).then(entrou).catch(falhou),
    separar: (id: string) =>
      window.lousa.time
        .separar(id)
        .then((c) => {
          setEstado((e) => e && comLigacao(e, id, null))
          entrou(c)
        })
        .catch(falhou),
  }
}

/** As copias do time da linha, na ordem de entrega, para a janela "Juntar o time" (T31.1). */
function copiasParaJuntar(estado: EstadoTela, quadroId: string): CopiaDoTime[] {
  return copiasDoTime(dadosDaTela(estado), quadroId).map(({ quadroId: id, repoId }) => {
    const repo = estado.repos.find((r) => r.id === repoId)
    return { quadroId: id, apelido: repo?.copia?.apelido ?? repo?.nome ?? id, agente: estado.quadros.find((q) => q.id === id)?.tipo === 'agente' }
  })
}

const pontoDo = (e: MouseEvent | TouchEvent): Posicao => {
  const p = 'changedTouches' in e ? e.changedTouches[0] : e
  return { x: p?.clientX ?? 0, y: p?.clientY ?? 0 }
}

type FimDaLinha =
  | { faz: 'nada' }
  | { faz: 'explicar'; para: string } // soltou num quadro que o React Flow recusou
  | { faz: 'ligar'; para: string } // soltou no corpo de um quadro, longe da bolinha
  | { faz: 'colega'; ponto: Posicao } // soltou no vazio

/** O que fazer quando a linha e solta. Arraste curto e clique: a bolinha cuida (T28.3). */
function fimDaLinha(conexao: Parameters<OnConnectEnd>[1], ponto: Posicao, inicio: Posicao | null): FimDaLinha {
  const de = conexao.fromNode?.id
  if (!de) return { faz: 'nada' }
  if (conexao.toNode) return conexao.isValid === false ? { faz: 'explicar', para: conexao.toNode.id } : { faz: 'nada' }
  if (conexao.fromHandle?.type !== 'source') return { faz: 'nada' }
  if (inicio && Math.hypot(ponto.x - inicio.x, ponto.y - inicio.y) < CLIQUE_PX) return { faz: 'nada' }
  return soltouLonge(de, ponto)
}

/** Longe de qualquer bolinha: no corpo de outro quadro, liga nele; no vazio, colega ali. */
function soltouLonge(de: string, ponto: Posicao): FimDaLinha {
  const sobre = document.elementFromPoint(ponto.x, ponto.y)?.closest<HTMLElement>('.react-flow__node')?.dataset.id
  if (sobre) return sobre === de ? { faz: 'nada' } : { faz: 'ligar', para: sobre }
  return { faz: 'colega', ponto }
}

function useFimDaConexao(deps: Deps, acoes: ReturnType<typeof acoesDoTime>, inicio: RefObject<Posicao | null>): OnConnectEnd {
  const { estado, avisar, instancia } = deps
  return useCallback<OnConnectEnd>(
    (evento, conexao) => {
      const de = conexao.fromNode?.id
      if (!estado || !de) return
      const fim = fimDaLinha(conexao, pontoDo(evento), inicio.current)
      if (fim.faz === 'colega') return void acoes.colega(de, instancia.current?.screenToFlowPosition(fim.ponto))
      if (fim.faz === 'nada') return
      const veredito = podeLigar(dadosDaTela(estado), de, fim.para)
      if (!veredito.ok) avisar(TEXTO_RECUSA[veredito.motivo])
      else if (fim.faz === 'ligar') void acoes.ligar(de, fim.para)
    },
    [estado, avisar, instancia, acoes, inicio],
  )
}

export function useLigacoes(deps: Deps) {
  const { estado, setEstado, avisar } = deps
  const [menu, setMenu] = useState<PedidoMenuLinha | null>(null)
  const [juntar, setJuntar] = useState<{ ligacaoId: string; copias: CopiaDoTime[] } | null>(null)
  const inicio = useRef<Posicao | null>(null)
  const acoes = useMemo(() => acoesDoTime(setEstado, avisar), [setEstado, avisar])
  useEffect(() => aoPedirColega((quadroId) => void acoes.colega(quadroId)), [acoes])
  // colega que o proprio agente pediu e o Sidney aceitou (A19): entra como o da bolinha; o
  // reaproveitado (09/11) so troca o papel
  useEffect(
    () =>
      window.lousa.time.aoColegaCriado((c) => setEstado((e) => e && comColega(e, c))),
    [setEstado],
  )
  // o freio do repasse pausa a linha no main (T30.1): a tela pega a linha como ficou
  useEffect(
    () => window.lousa.time.aoRepasse((r) => r.ligacao && setEstado((e) => e && comLigacao(e, r.ligacaoId, r.ligacao ?? null))),
    [setEstado],
  )
  // tipo largo (Edge): a lousa e a instancia do React Flow nao sabem de arestas proprias
  const arestas = useMemo<Edge[]>(() => (estado ? montarArestas(estado) : []), [estado])

  const conexaoValida = useCallback(
    (c: Connection | Edge) => !!estado && podeLigar(dadosDaTela(estado), c.source, c.target).ok,
    [estado],
  )
  const onConnect = useCallback((c: Connection) => void acoes.ligar(c.source, c.target), [acoes])
  const onConnectStart = useCallback<OnConnectStart>((e) => {
    inicio.current = pontoDo(e)
  }, [])
  const onConnectEnd = useFimDaConexao(deps, acoes, inicio)
  const onEdgeClick = useCallback((evento: React.MouseEvent, aresta: Edge) => {
    const d = aresta.data as DadosLinha | undefined
    if (d) setMenu({ ligacao: d.ligacao, mesmaPasta: d.mesmaPasta, x: evento.clientX, y: evento.clientY })
  }, [])
  const fechar = useCallback(() => setMenu(null), [])
  // o rotulo da linha fica fora dela: clicar nele abre o mesmo menu
  useEffect(
    () =>
      aoPedirMenuLinha(({ ligacaoId, x, y }) => {
        const d = arestas.find((a) => a.id === ligacaoId)?.data as DadosLinha | undefined
        if (d) setMenu({ ligacao: d.ligacao, mesmaPasta: d.mesmaPasta, x, y })
      }),
    [arestas],
  )
  const fazer = (acao: () => Promise<unknown>): void => {
    setMenu(null)
    void acao()
  }

  const menuAberto =
    menu &&
    createElement(MenuLinha, {
      ...menu,
      aoAjustar: (mudanca: Ajuste) => fazer(() => acoes.ajustar(menu.ligacao.id, mudanca)),
      aoRemover: () => fazer(() => acoes.remover(menu.ligacao.id)),
      aoSeparar: () => fazer(() => acoes.separar(menu.ligacao.id)),
      aoJuntarTime: () => {
        setMenu(null)
        if (estado) setJuntar({ ligacaoId: menu.ligacao.id, copias: copiasParaJuntar(estado, menu.ligacao.de) })
      },
      aoFechar: fechar,
    })

  return {
    /** Espalhado no <ReactFlow>. O clique na bolinha nao comeca linha: cria um colega (T28.3). */
    flow: {
      edges: arestas,
      edgeTypes,
      onConnect,
      onConnectStart,
      onConnectEnd,
      onEdgeClick,
      isValidConnection: conexaoValida,
      connectOnClick: false,
    },
    menu: createElement(Fragment, null, menuAberto, juntar && createElement(JanelaJuntarTime, { ...juntar, aoFechar: () => setJuntar(null) })),
  }
}
