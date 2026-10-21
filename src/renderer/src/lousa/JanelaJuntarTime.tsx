// "Juntar o time" (T31.1): as copias do time voltam para a pasta original na ordem de entrega,
// uma por vez. O main junta; aqui a lista, o resultado e, no conflito, o pedido ao agente (D30).
import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { ResultadoJuntarTime } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import '../estilos/juntar.css'
import { enviarMensagem } from './escrever'
import { frasesDoResultado } from './juntarTime'
import { ehConflito, pedidoDeResolver } from './resolver'

export interface CopiaDoTime {
  quadroId: string
  apelido: string
  agente: boolean
}

interface Props {
  ligacaoId: string
  copias: CopiaDoTime[]
  aoFechar(): void
}

export function JanelaJuntarTime({ ligacaoId, copias, aoFechar }: Props): React.JSX.Element {
  const [fase, setFase] = useState<'pronto' | 'juntando' | ResultadoJuntarTime>('pronto')
  const [erro, setErro] = useState<string | null>(null)

  async function juntar(): Promise<void> {
    setErro(null)
    setFase('juntando')
    try {
      setFase(await window.lousa.time.juntar(ligacaoId))
    } catch (e) {
      setErro(mensagemDe(e))
      setFase('pronto')
    }
  }

  const resultado = typeof fase === 'object' ? fase : null
  const parou = resultado?.parou ?? null
  const agenteDoConflito = parou && ehConflito(parou.erro) && copias.find((c) => c.quadroId === parou.quadroId && c.agente)
  async function pedirResolver(): Promise<void> {
    if (!parou) return
    try {
      await enviarMensagem(parou.quadroId, pedidoDeResolver(parou.branch, parou.branchAlvo))
      aoFechar()
    } catch (e) {
      setErro(mensagemDe(e))
    }
  }

  return createPortal(
    <div className="janela-fundo" onMouseDown={(e) => e.target === e.currentTarget && aoFechar()}>
      <div className="janela janela-juntar janela-juntar-time" role="dialog" aria-label="Juntar o time">
        <h2 className="janela-titulo">Juntar o time</h2>
        {resultado ? (
          <ul className="juntar-time-resultado">
            {frasesDoResultado(resultado).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : (
          <>
            <p>As cópias voltam para a pasta original nesta ordem, uma por vez (quem entrega antes):</p>
            <ol className="juntar-time-lista">
              {copias.map((c) => (
                <li key={c.quadroId}>{c.apelido}</li>
              ))}
            </ol>
            <p className="apagado">Para no primeiro conflito. Cópia com alteração não salva fica de fora.</p>
          </>
        )}
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <Botoes
          fase={fase}
          total={copias.length}
          resolverEm={agenteDoConflito ? (parou?.apelido ?? '') : null}
          aoJuntar={() => void juntar()}
          aoResolver={() => void pedirResolver()}
          aoFechar={aoFechar}
        />
      </div>
    </div>,
    document.body,
  )
}

interface PropsBotoes {
  fase: 'pronto' | 'juntando' | ResultadoJuntarTime
  total: number
  /** Apelido da copia em conflito com agente (D30), ou null. */
  resolverEm: string | null
  aoJuntar(): void
  aoResolver(): void
  aoFechar(): void
}

function Botoes(p: PropsBotoes): React.JSX.Element {
  const terminou = typeof p.fase === 'object'
  return (
    <div className="juntar-botoes">
      {p.resolverEm !== null && (
        <button className="botao-principal" onClick={p.aoResolver} title="Escreve o pedido no agente desta cópia">
          Pedir ao agente de {p.resolverEm} para resolver
        </button>
      )}
      {!terminou && p.total > 0 && (
        <button className="botao-principal" disabled={p.fase === 'juntando'} onClick={p.aoJuntar}>
          {p.fase === 'juntando' ? 'Juntando…' : `Juntar ${p.total === 1 ? '1 cópia' : `${p.total} cópias`}`}
        </button>
      )}
      <button className="botao-pequeno" onClick={p.aoFechar}>
        {terminou ? 'Fechar' : 'Cancelar'}
      </button>
    </div>
  )
}
