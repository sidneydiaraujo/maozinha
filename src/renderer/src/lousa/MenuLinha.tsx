import { useEffect, useRef } from 'react'
import type { Ligacao, ModoLigacao } from '../../../shared/model'

export interface PedidoMenuLinha {
  ligacao: Ligacao
  mesmaPasta: boolean // os dois na mesma pasta: oferece o colega numa copia (T28.3)
  x: number // posicao do clique na tela
  y: number
}

interface Props extends PedidoMenuLinha {
  aoAjustar(mudanca: { modo?: ModoLigacao; pausada?: boolean }): void
  aoRemover(): void
  aoSeparar(): void
  aoJuntarTime(): void
  aoFechar(): void
}

/** Menu da linha do time (T28.2): automatico ou perguntar, pausar, remover e (mesma pasta) separar. */
export function MenuLinha({ ligacao, mesmaPasta, x, y, aoAjustar, aoRemover, aoSeparar, aoJuntarTime, aoFechar }: Props): React.JSX.Element {
  const caixa = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const fora = (e: MouseEvent): void => {
      if (!caixa.current?.contains(e.target as Node)) aoFechar()
    }
    const esc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') aoFechar()
    }
    document.addEventListener('mousedown', fora)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', fora)
      document.removeEventListener('keydown', esc)
    }
  }, [aoFechar])
  const automatico = ligacao.modo === 'automatico'
  return (
    <div ref={caixa} className="conta-menu menu-linha" role="menu" style={{ left: x, top: y }}>
      <p className="conta-menu-titulo">Quando um termina, o próximo…</p>
      <button className="conta-menu-item" role="menuitemradio" aria-checked={automatico} onClick={() => aoAjustar({ modo: 'automatico' })}>
        <span className="menu-linha-marca">{automatico ? '●' : '○'}</span> recebe sozinho (automático)
      </button>
      <button className="conta-menu-item" role="menuitemradio" aria-checked={!automatico} onClick={() => aoAjustar({ modo: 'perguntar' })}>
        <span className="menu-linha-marca">{automatico ? '○' : '●'}</span> recebe quando você mandar (perguntar)
      </button>
      <hr className="menu-linha-divisa" />
      {mesmaPasta && (
        <button
          className="conta-menu-item"
          role="menuitem"
          title="Cria um colega numa cópia separada e passa a linha para ele; este quadro continua aberto"
          onClick={aoSeparar}
        >
          ⑂ Abrir o colega numa cópia
        </button>
      )}
      <button
        className="conta-menu-item"
        role="menuitem"
        title="As cópias do time voltam para a pasta original, na ordem de entrega (T31.1)"
        onClick={aoJuntarTime}
      >
        ⇢ Juntar o time
      </button>
      <button className="conta-menu-item" role="menuitem" onClick={() => aoAjustar({ pausada: !ligacao.pausada })}>
        {ligacao.pausada ? '▶ Retomar' : '⏸ Pausar'}
      </button>
      <button className="conta-menu-item menu-linha-remover" role="menuitem" onClick={aoRemover}>
        × Remover a linha
      </button>
    </div>
  )
}
