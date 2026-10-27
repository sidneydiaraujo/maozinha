import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ESFORCOS, MODELOS, type AjusteAgente, type Esforco, type Modelo, type Quadro, type QuandoAjusta } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { useFecharFora } from '../componentes/useFecharFora'
import {
  esforcoRecusado,
  familiaDoModelo,
  NOME_ESFORCO,
  NOME_MODELO,
  rotuloDoEsforco,
  rotuloDoModelo,
  type Rotulo,
} from './modelo'
import { usePainel } from './usePainel'

const LARGURA_MENU = 200

const AVISO: Record<QuandoAjusta, string | null> = {
  agora: 'O agente reabriu com a troca, na mesma conversa.',
  quandoParar: 'Vale quando o agente parar: ele reabre na mesma conversa.',
  naAbertura: 'Vale na próxima abertura do agente.',
}

interface PropsSeletor<T extends string> {
  titulo: string
  rotulo: Rotulo
  opcoes: readonly T[]
  nomes: Record<T, string>
  atual: T | null
  /** "este modelo nao aceita esse nivel" (T19.2) */
  alerta?: string | null
  dica: string
  aoEscolher(valor: T): Promise<QuandoAjusta>
}

/** Botao "Opus ▾" com a lista em portal, igual ao selo da conta (dentro do no ficaria sob outros quadros). */
function Seletor<T extends string>(p: PropsSeletor<T>): React.JSX.Element {
  const [lugar, setLugar] = useState<{ x: number; y: number } | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const menu = useRef<HTMLDivElement>(null)
  useFecharFora(lugar !== null, menu, () => setLugar(null))

  const escolher = (valor: T): void => {
    setLugar(null)
    p.aoEscolher(valor)
      .then((quando) => setAviso(AVISO[quando]))
      .catch((e: unknown) => setAviso(mensagemDe(e)))
  }

  const classe = ['quadro-modelo', 'nodrag', p.rotulo.valendo ? '' : 'quadro-modelo-guardado', p.alerta ? 'quadro-modelo-alerta' : '']
  return (
    <>
      <button
        className={classe.filter(Boolean).join(' ')}
        title={[p.alerta, aviso, p.dica].filter(Boolean).join('\n')}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect()
          setLugar({ x: Math.min(r.left, window.innerWidth - LARGURA_MENU - 8), y: r.bottom + 4 })
        }}
      >
        {p.alerta ? '⚠ ' : ''}
        {p.rotulo.texto} ▾
      </button>
      {lugar &&
        createPortal(
          <div ref={menu} className="conta-menu" style={{ left: Math.max(8, lugar.x), top: lugar.y, width: LARGURA_MENU }}>
            <p className="conta-menu-titulo">{p.titulo}</p>
            {p.opcoes.map((valor) => (
              <button key={valor} className="conta-menu-item" aria-current={valor === p.atual} onClick={() => escolher(valor)}>
                <span>
                  <strong>{p.nomes[valor]}</strong>
                </span>
                {valor === p.atual && <span aria-label="atual">✓</span>}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

/**
 * Modelo e esforco do agente Claude no cabecalho (T19.2, D25). O rotulo diz o que o painel do
 * agente conta (Fatia 17); antes dele, o guardado no quadro, em cinza. A tela so manda o valor
 * da lista (agentes:ajustar); o main reabre o agente com ele na mesma conversa (D47).
 */
export function ModeloDoQuadro({ quadro }: { quadro: Quadro }): React.JSX.Element {
  const painel = usePainel(quadro.id)
  // o quadro da tela so muda ao recarregar: o escolhido aqui vale ate la
  const [guardado, setGuardado] = useState<AjusteAgente>({ modelo: quadro.modelo, esforco: quadro.esforco })
  const [pedido, setPedido] = useState<{ esforco: Esforco; quando: number } | null>(null)

  const ajustar = (mudanca: AjusteAgente): Promise<QuandoAjusta> => {
    setGuardado((g) => ({ ...g, ...mudanca }))
    if (mudanca.esforco) setPedido({ esforco: mudanca.esforco, quando: Date.now() })
    return window.lousa.agentes.ajustar(quadro.id, mudanca)
  }
  const modeloAtual = painel?.modelo ? familiaDoModelo(painel.modelo.id) : (guardado.modelo ?? null)
  const recusado = esforcoRecusado(pedido, painel)

  return (
    <>
      <Seletor<Modelo>
        titulo="Modelo deste agente"
        rotulo={rotuloDoModelo(guardado, painel)}
        opcoes={MODELOS}
        nomes={NOME_MODELO}
        atual={modeloAtual}
        dica="Trocar o modelo reabre o agente na mesma conversa (sem mudar o padrão da conta)."
        aoEscolher={(modelo) => ajustar({ modelo })}
      />
      <Seletor<Esforco>
        titulo="Esforço (quanto o Claude pensa)"
        rotulo={rotuloDoEsforco(guardado, painel)}
        opcoes={ESFORCOS}
        nomes={NOME_ESFORCO}
        atual={painel?.esforco ?? guardado.esforco ?? null}
        alerta={recusado ? 'Este modelo não aceita esse nível.' : null}
        dica="Mais esforço: respostas mais pensadas, mais lentas e com mais uso da conta."
        aoEscolher={(esforco) => ajustar({ esforco })}
      />
    </>
  )
}
