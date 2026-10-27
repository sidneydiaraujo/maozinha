// Aba "Historico" da lateral (A10, D48): os terminais desta sessao, o mais recente em cima.
// Clicar num aberto leva a lousa ate ele, ampliado. Fica montada mesmo com a aba "Pastas" a
// mostra, para nao perder o que aconteceu enquanto estava escondida.
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import '../estilos/historico.css'
import { pedirMostrar } from '../lousa/foco'
import { useMapaAtencao } from '../lousa/useAtencao'
import { detalheDoItem, emOrdem, juntarQuadros, marcarAtividade, type ItemHistorico, type QuadroVisto } from './sessao'

/** De quanto em quanto tempo a saida dos terminais sobe a lista e o "ha 5 min" anda. */
const PASSO_MS = 5000

function useHistorico(vistos: QuadroVisto[]): { itens: ItemHistorico[]; agora: number } {
  const [itens, setItens] = useState<ItemHistorico[]>([])
  const [agora, setAgora] = useState(() => Date.now())
  const chave = JSON.stringify(vistos)
  useEffect(() => setItens((h) => juntarQuadros(h, JSON.parse(chave) as QuadroVisto[], Date.now())), [chave])

  // o agente mudou de estado (OSC 7501): sobe na hora, com o estado novo
  const mapa = useMapaAtencao()
  const anterior = useRef(mapa)
  useEffect(() => {
    const antes = anterior.current
    anterior.current = mapa
    const agoraMesmo = Date.now()
    setItens((h) => {
      let novo = h
      for (const [id, a] of mapa) if (antes.get(id)?.aviso !== a.aviso) novo = marcarAtividade(novo, id, agoraMesmo, a.aviso.estado)
      return novo
    })
  }, [mapa])

  // saida do terminal (o id do terminal e o do quadro): anota e aplica a cada passo, sem redesenhar
  // a lateral a cada pedaco que chega
  useEffect(() => {
    const ultimos = new Map<string, number>()
    const parar = window.lousa.terminais.aoDados((id) => ultimos.set(id, Date.now()))
    const relogio = window.setInterval(() => {
      setAgora(Date.now())
      if (ultimos.size === 0) return
      const lote = [...ultimos]
      ultimos.clear()
      setItens((h) => lote.reduce((x, [id, em]) => marcarAtividade(x, id, em), h))
    }, PASSO_MS)
    return () => {
      parar()
      window.clearInterval(relogio)
    }
  }, [])
  return { itens, agora }
}

interface Props {
  quadros: Quadro[]
  repos: Repo[]
  perfis: PerfilComConta[]
  /** As abas "Pastas | Historico" no alto. */
  abas: React.ReactNode
  oculto: boolean
}

export function Historico({ quadros, repos, perfis, abas, oculto }: Props): React.JSX.Element {
  const vistos = useMemo(
    () =>
      quadros.map((q): QuadroVisto => {
        const perfil = perfis.find((p) => p.id === q.perfilId)
        return {
          quadroId: q.id,
          nome: q.papel || q.titulo,
          pasta: repos.find((r) => r.id === q.repoId)?.nome ?? '',
          conta: perfil?.nome ?? 'conta removida',
          cor: perfil?.cor ?? '#555',
          tipo: q.tipo,
        }
      }),
    [quadros, repos, perfis],
  )
  const { itens, agora } = useHistorico(vistos)
  return (
    <aside className="explorador historico" aria-label="Histórico" hidden={oculto}>
      <header className="explorador-topo">{abas}</header>
      <ul className="historico-lista">
        {itens.length === 0 && <li className="apagado explorador-vazio">Nenhum terminal nesta sessão ainda.</li>}
        {emOrdem(itens).map((i) => {
          const fechado = i.fechadoEm !== undefined
          return (
            <li key={i.quadroId}>
              <button
                className="historico-item"
                disabled={fechado}
                title={fechado ? 'Este quadro já foi fechado' : 'Ir até este terminal, ampliado'}
                onClick={() => pedirMostrar(i.quadroId)}
              >
                <span className="bolinha" style={{ '--cor': i.cor } as React.CSSProperties} />
                <span className="historico-textos">
                  <span className="historico-nome">
                    {i.nome}
                    <span className="historico-tipo">{i.tipo === 'agente' ? 'agente' : 'terminal'}</span>
                  </span>
                  <span className="historico-detalhe">{detalheDoItem(i, agora)}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
