// Fila de prontos na barra de cima (A26): a mãozinha do Mãozinha chama quando um agente terminou.
// Um pronto: o clique leva direto ao quadro. Mais de um: abre a fila, com o projeto de cada um.
import { useEffect, useRef, useState } from 'react'
import type { Ligacao, Quadro, Repo } from '../../../shared/model'
import '../estilos/prontos.css'
import { pedirFoco } from '../lousa/foco'
import { atencao, useMapaAtencao } from '../lousa/useAtencao'
import { filaDeProntos, haQuanto, textoDosProntos, type ItemPronto } from './prontos'

/** A mãozinha em pixel do ícone do programa, apontando; o toque sai da ponta do dedo. */
export function MaoChamando({ tamanho = 22 }: { tamanho?: number }): React.JSX.Element {
  return (
    <svg className="mao-chamando" viewBox="0 -1 12 16" width={tamanho} height={tamanho} aria-hidden="true">
      <circle className="mao-toque" cx="5" cy="0" r="2.2" />
      <g className="mao-corpo" shapeRendering="crispEdges">
        <rect x="4" y="0" width="2" height="8" />
        <rect x="6" y="3" width="2" height="5" />
        <rect x="8" y="4" width="2" height="4" />
        <rect x="10" y="5" width="1" height="3" />
        <rect x="3" y="7" width="8" height="5" />
        <rect x="1" y="7" width="2" height="2" />
        <rect x="2" y="9" width="1" height="2" />
        <rect x="4" y="12" width="6" height="2" />
        <rect className="mao-brilho" x="4" y="0" width="1" height="7" />
      </g>
    </svg>
  )
}

function ir(item: ItemPronto): void {
  atencao.marcarVisto(item.quadroId)
  pedirFoco(item.quadroId)
}

function LinhaPronto({ item, agora, aoIr }: { item: ItemPronto; agora: number; aoIr(): void }): React.JSX.Element {
  return (
    <li>
      <button className="pronto-linha" onClick={aoIr} title="Ir até o quadro">
        <MaoChamando tamanho={16} />
        <span className="pronto-nome">{item.nome}</span>
        <span className="pronto-projeto">{item.projeto}</span>
        {item.colegas > 0 && <span className="pronto-time">líder · {item.colegas + 1} agentes</span>}
        <span className="pronto-quando">{haQuanto(item.quando, agora)}</span>
      </button>
    </li>
  )
}

/** Fecha a lista com Esc ou com um clique fora dela. */
function useFecharFora(aberta: boolean, fechar: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!aberta) return
    const fora = (e: MouseEvent): void => {
      if (!ref.current?.contains(e.target as Node)) fechar()
    }
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') fechar()
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', tecla)
    }
  }, [aberta, fechar])
  return ref
}

export function FilaProntos(props: {
  quadros: Quadro[]
  repos: Repo[]
  ligacoes: Ligacao[]
}): React.JSX.Element | null {
  const mapa = useMapaAtencao()
  const [aberta, setAberta] = useState(false)
  const ref = useFecharFora(aberta, () => setAberta(false))
  const fila = filaDeProntos(mapa, props)
  if (fila.length === 0) return null
  const primeiro = fila[0] as ItemPronto
  const agora = Date.now()
  const clicar = (): void => {
    if (fila.length === 1) ir(primeiro)
    else setAberta((a) => !a)
  }
  return (
    <div className="topo-prontos-caixa" ref={ref}>
      <button
        className="topo-prontos"
        aria-expanded={fila.length > 1 ? aberta : undefined}
        title={fila.length === 1 ? `${primeiro.nome} terminou (${primeiro.projeto}): ir até ele` : 'Ver quem terminou'}
        onClick={clicar}
      >
        <MaoChamando />
        {textoDosProntos(fila.length)}
      </button>
      {aberta && fila.length > 1 && (
        <div className="fila-prontos" role="dialog" aria-label="Agentes que terminaram">
          <div className="fila-prontos-titulo">Terminaram · do mais antigo ao mais novo</div>
          <ul>
            {fila.map((item) => (
              <LinhaPronto
                key={item.quadroId}
                item={item}
                agora={agora}
                aoIr={() => {
                  setAberta(false)
                  ir(item)
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
