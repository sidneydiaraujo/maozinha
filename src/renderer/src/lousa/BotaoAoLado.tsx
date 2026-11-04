// Outro quadro na mesma pasta, fora do time (A20): enquanto o agente e os colegas trabalham, o
// usuario abre um agente ou um terminal livre para evoluir ou pesquisar, sem linha e sem repasse.
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { TipoQuadro } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { useFecharFora } from '../componentes/useFecharFora'

const LARGURA_MENU = 260

interface Props {
  rotulo: string
  aoAbrir(tipo: TipoQuadro): Promise<void>
}

export function BotaoAoLado({ rotulo, aoAbrir }: Props): React.JSX.Element {
  const [lugar, setLugar] = useState<{ x: number; y: number } | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const menu = useRef<HTMLDivElement>(null)
  const fechar = (): void => {
    setLugar(null)
    setErro(null)
  }
  useFecharFora(lugar !== null && !ocupado, menu, fechar)

  async function abrir(tipo: TipoQuadro): Promise<void> {
    setOcupado(true)
    try {
      await aoAbrir(tipo)
      fechar()
    } catch (e) {
      setErro(mensagemDe(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <button
        className="botao-acao botao-ao-lado nodrag"
        title="Abrir outro agente ou terminal nesta pasta, fora do time: não mexe no trabalho deste quadro"
        aria-label={`Abrir outro quadro na pasta de ${rotulo}`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setLugar({ x: Math.min(r.right - LARGURA_MENU, window.innerWidth - LARGURA_MENU - 8), y: r.bottom + 4 })
        }}
      >
        ＋
      </button>
      {lugar &&
        createPortal(
          <div ref={menu} className="conta-menu" style={{ left: Math.max(8, lugar.x), top: lugar.y, width: LARGURA_MENU }}>
            <p className="conta-menu-titulo">Abrir nesta pasta</p>
            <p className="ao-lado-explica">Um quadro à parte, embaixo deste. Não entra no time e não mexe no que ele está fazendo.</p>
            <button className="conta-menu-item" disabled={ocupado} onClick={() => void abrir('agente')}>
              <span className="ao-lado-texto">
                <strong>Agente avulso</strong>
                <small>Na mesma conta, para perguntar ou pesquisar enquanto o time trabalha</small>
              </span>
            </button>
            <button className="conta-menu-item" disabled={ocupado} onClick={() => void abrir('terminal')}>
              <span className="ao-lado-texto">
                <strong>Terminal</strong>
                <small>PowerShell nesta pasta, para rodar comandos</small>
              </span>
            </button>
            {erro && (
              <p className="erro" role="alert">
                {erro}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
