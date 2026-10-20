// Um icone por conta na barra de cima (T7.2): desenho do provedor na cor da conta.
// Clique abre o cartao da conta num balao; arrastar para a lousa abre um quadro nela.
// Conta Claude: barras de uso da sessao e da semana sob o icone (T20.2).
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import type { PerfilComConta } from '../../../shared/model'
import { CartaoConta } from '../componentes/CartaoConta'
import { useFecharFora } from '../componentes/useFecharFora'
import { TIPO_ARRASTE_CONTA } from '../lousa/nos'
import { SimboloProvedor } from './Simbolos'
import { BarrasUso, UsoNoBalao, useUsoConta } from './UsoConta'
import { avisoDeEmail, type Contas } from './useContas'

interface Props {
  perfil: PerfilComConta
  contas: Contas
  aberto: boolean
  aoAlternar(): void
  aoFechar(): void
}

const LARGURA_BALAO = 300

function descricao(perfil: PerfilComConta): string {
  const { conta } = perfil
  const quem = conta.email ?? (conta.logado ? 'logada' : 'sem login')
  return `${perfil.nome} · ${quem}${conta.plano ? ` · ${conta.plano}` : ''}`
}

export function IconeConta({ perfil, contas, aberto, aoAlternar, aoFechar }: Props): React.JSX.Element {
  const botao = useRef<HTMLButtonElement>(null)
  const balao = useRef<HTMLDivElement>(null)
  const [posicao, setPosicao] = useState({ left: 0, top: 0 })
  useFecharFora(aberto, balao, aoFechar)

  useLayoutEffect(() => {
    if (!aberto || !botao.current) return
    const r = botao.current.getBoundingClientRect()
    setPosicao({ left: Math.min(r.left, window.innerWidth - LARGURA_BALAO - 8), top: r.bottom + 6 })
  }, [aberto])

  const todos = contas.perfis ?? []
  const usoBruto = useUsoConta(perfil.id)
  // Codex: a linha de status e do Claude; o uso dele fica para a Fatia 9
  const comUso = perfil.provedor === 'claude'
  const uso = comUso ? usoBruto : null
  const titulo = [descricao(perfil), ...(uso?.linhas ?? [])].join('\n')
  return (
    <>
      <button
        ref={botao}
        className="icone-conta"
        data-conta={perfil.id}
        style={{ '--cor': perfil.cor } as CSSProperties}
        title={titulo}
        aria-label={`Conta ${descricao(perfil)}`}
        aria-expanded={aberto}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData(TIPO_ARRASTE_CONTA, perfil.id)
          e.dataTransfer.effectAllowed = 'copy'
        }}
        // o clique no proprio icone alterna; sem isto o "clicou fora" fecharia e ele reabriria
        onMouseDown={(e) => e.stopPropagation()}
        onClick={aoAlternar}
      >
        <SimboloProvedor provedor={perfil.provedor} />
        <span className={`icone-status${perfil.conta.logado ? ' icone-status-on' : ''}`} />
        {uso && <BarrasUso vista={uso} />}
      </button>
      {aberto &&
        createPortal(
          <div ref={balao} className="balao-conta" style={{ ...posicao, width: LARGURA_BALAO }}>
            {comUso && <UsoNoBalao vista={uso} />}
            <CartaoConta
              perfil={perfil}
              aoRenomear={(nome) => contas.renomear(perfil, nome)}
              aoAtualizar={() => contas.atualizar(perfil)}
              aoEntrou={(conta) => contas.entrou(perfil, conta)}
              aviso={avisoDeEmail(perfil, todos)}
              conferirEmail={(email) => avisoDeEmail({ ...perfil, conta: { ...perfil.conta, email } }, todos)}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
