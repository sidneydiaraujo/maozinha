// Linhas do time na lousa (T28.2, D39): puxar, validar, ajustar e remover. O main decide; a tela
// so manda ids de quadro e de linha.
import type { Connection, Edge, OnConnectEnd } from '@xyflow/react'
import { createElement, useCallback, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import type { EstadoTela, ModoLigacao } from '../../../shared/model'
import { podeLigar, TEXTO_RECUSA } from '../../../shared/time'
import { mensagemDe as mensagem } from '../componentes/erro'
import { comLigacao, dadosDaTela, montarArestas, type DadosLinha } from './linhas'
import { LinhaTime } from './LinhaTime'
import { MenuLinha, type PedidoMenuLinha } from './MenuLinha'

// Fora do hook: o React Flow recriaria as arestas a cada render.
const edgeTypes = { time: LinhaTime }

interface Deps {
  estado: EstadoTela | null
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>
  avisar(texto: string): void
}

export function useLigacoes({ estado, setEstado, avisar }: Deps) {
  const [menu, setMenu] = useState<PedidoMenuLinha | null>(null)
  // tipo largo (Edge): a lousa e a instancia do React Flow nao sabem de arestas proprias
  const arestas = useMemo<Edge[]>(() => (estado ? montarArestas(estado) : []), [estado])

  const conexaoValida = useCallback(
    (c: Connection | Edge) => !!estado && podeLigar(dadosDaTela(estado), c.source, c.target).ok,
    [estado],
  )
  const onConnect = useCallback(
    (c: Connection) => {
      window.lousa.time
        .ligar(c.source, c.target)
        .then((ligacao) => setEstado((e) => e && comLigacao(e, ligacao.id, ligacao)))
        .catch((e: unknown) => avisar(mensagem(e)))
    },
    [setEstado, avisar],
  )
  // soltou em cima de um quadro que nao pode: diz por que (a linha some sozinha)
  const onConnectEnd = useCallback<OnConnectEnd>(
    (_, conexao) => {
      if (!estado || conexao.isValid !== false || !conexao.fromNode || !conexao.toNode) return
      const veredito = podeLigar(dadosDaTela(estado), conexao.fromNode.id, conexao.toNode.id)
      if (!veredito.ok) avisar(TEXTO_RECUSA[veredito.motivo])
    },
    [estado, avisar],
  )
  const onEdgeClick = useCallback((evento: React.MouseEvent, aresta: Edge) => {
    const dados = aresta.data as DadosLinha | undefined
    if (dados) setMenu({ ligacao: dados.ligacao, x: evento.clientX, y: evento.clientY })
  }, [])

  const fechar = useCallback(() => setMenu(null), [])
  const ajustar = (id: string, mudanca: { modo?: ModoLigacao; pausada?: boolean }): void => {
    setMenu(null)
    window.lousa.time
      .ajustar(id, mudanca)
      .then((nova) => setEstado((e) => e && comLigacao(e, id, nova)))
      .catch((e: unknown) => avisar(mensagem(e)))
  }
  const remover = (id: string): void => {
    setMenu(null)
    window.lousa.time
      .desligar(id)
      .then(() => setEstado((e) => e && comLigacao(e, id, null)))
      .catch((e: unknown) => avisar(mensagem(e)))
  }

  const menuAberto =
    menu &&
    createElement(MenuLinha, {
      ...menu,
      aoAjustar: (mudanca) => ajustar(menu.ligacao.id, mudanca),
      aoRemover: () => remover(menu.ligacao.id),
      aoFechar: fechar,
    })

  return {
    /** Espalhado no <ReactFlow>. Clicar na bolinha nao comeca linha (o clique e da T28.3). */
    flow: { edges: arestas, edgeTypes, onConnect, onConnectEnd, onEdgeClick, isValidConnection: conexaoValida, connectOnClick: false },
    menu: menuAberto,
  }
}
