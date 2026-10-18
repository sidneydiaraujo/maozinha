import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PerfilComConta, TipoQuadro } from '../../../shared/model'
import { useFecharFora } from '../componentes/useFecharFora'

interface Props {
  perfil: PerfilComConta | undefined
  contas: PerfilComConta[]
  tipo: TipoQuadro
  aoTrocar(perfilId: string): Promise<void>
}

const LARGURA_MENU = 260

function Confirmar(p: {
  conta: PerfilComConta
  tipo: TipoQuadro
  ocupado: boolean
  aoConfirmar(): void
  aoVoltar(): void
}): React.JSX.Element {
  return (
    <div className="conta-menu-confirma">
      <p>
        Trocar para <strong>{p.conta.nome}</strong>?
      </p>
      <p className="apagado">
        {p.tipo === 'agente'
          ? 'O Claude reinicia nesta mesma pasta e continua a mesma conversa, com os tokens desta conta.'
          : 'O terminal reinicia nesta mesma pasta com esta conta.'}
      </p>
      <div className="conta-menu-botoes">
        <button className="botao-pequeno botao-principal" disabled={p.ocupado} onClick={p.aoConfirmar}>
          {p.ocupado ? 'Trocando…' : 'Trocar'}
        </button>
        <button className="botao-pequeno" disabled={p.ocupado} onClick={p.aoVoltar}>
          Voltar
        </button>
      </div>
    </div>
  )
}

function ListaContas(p: {
  contas: PerfilComConta[]
  atual: string | undefined
  aoEscolher(conta: PerfilComConta): void
}): React.JSX.Element {
  return (
    <>
      <p className="conta-menu-titulo">Quem paga este quadro</p>
      {p.contas.map((c) => (
        <button
          key={c.id}
          className="conta-menu-item"
          style={{ '--cor': c.cor } as React.CSSProperties}
          aria-current={c.id === p.atual}
          onClick={() => p.aoEscolher(c)}
        >
          <span className="bolinha" aria-hidden="true" />
          <span>
            <strong>{c.nome}</strong>
            <small>{[c.conta.plano, c.conta.logado ? null : 'sem login'].filter(Boolean).join(' · ')}</small>
          </span>
          {c.id === p.atual && <span aria-label="atual">✓</span>}
        </button>
      ))}
    </>
  )
}

/**
 * Selo da conta no cabecalho do quadro (D14): a conta so diz quem paga. Trocar mantem o
 * quadro, a pasta e a conversa. O menu vai para o body: dentro do no ficaria sob outros quadros.
 */
export function ContaDoQuadro({ perfil, contas, tipo, aoTrocar }: Props): React.JSX.Element {
  const [lugar, setLugar] = useState<{ x: number; y: number } | null>(null)
  const [escolhida, setEscolhida] = useState<PerfilComConta | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const menu = useRef<HTMLDivElement>(null)
  const fechar = (): void => {
    setLugar(null)
    setEscolhida(null)
    setErro(null)
  }
  useFecharFora(lugar !== null && !ocupado, menu, fechar)

  async function trocar(conta: PerfilComConta): Promise<void> {
    setOcupado(true)
    try {
      await aoTrocar(conta.id)
      fechar()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    } finally {
      setOcupado(false)
    }
  }

  return (
    <>
      <button
        className="quadro-conta nodrag"
        title={`Quem paga este quadro: ${perfil?.conta.email ?? 'conta não encontrada'}. Clique para trocar.`}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setLugar({ x: Math.min(r.right - LARGURA_MENU, window.innerWidth - LARGURA_MENU - 8), y: r.bottom + 4 })
        }}
      >
        <span className="bolinha" aria-hidden="true" />
        {perfil?.nome ?? 'conta não encontrada'} ▾
      </button>
      {lugar &&
        createPortal(
          <div
            ref={menu}
            className="conta-menu"
            style={{ left: Math.max(8, lugar.x), top: lugar.y, width: LARGURA_MENU }}
          >
            {escolhida ? (
              <Confirmar
                conta={escolhida}
                tipo={tipo}
                ocupado={ocupado}
                aoConfirmar={() => void trocar(escolhida)}
                aoVoltar={() => setEscolhida(null)}
              />
            ) : (
              <ListaContas
                contas={contas}
                atual={perfil?.id}
                aoEscolher={(c) => (c.id === perfil?.id ? fechar() : setEscolhida(c))}
              />
            )}
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
