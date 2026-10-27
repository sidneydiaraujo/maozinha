import { useEffect, useState } from 'react'
import { podeDigitar } from '../../../shared/compactar'
import { mensagemDe } from '../componentes/erro'
import '../estilos/contexto.css'
import { aoMudarPrefContexto, lerPrefContexto, vistaDoContexto, type NivelContexto } from './contexto'
import { useAtencao } from './useAtencao'
import { usePainel } from './usePainel'

const RAIO = 9
const VOLTA = 2 * Math.PI * RAIO

/** O anel com o numero no meio. Tambem e a previa na engrenagem (T18.2). */
export function DesenhoAnel({ numero, nivel }: { numero: number; nivel: NivelContexto }): React.JSX.Element {
  return (
    <svg className={`anel anel-${nivel}`} viewBox="0 0 24 24" aria-hidden="true">
      <circle className="anel-fundo" cx="12" cy="12" r={RAIO} />
      <circle
        className="anel-cheio"
        cx="12"
        cy="12"
        r={RAIO}
        strokeDasharray={`${(numero / 100) * VOLTA} ${VOLTA}`}
        transform="rotate(-90 12 12)"
      />
      <text x="12" y="12" dominantBaseline="central" textAnchor="middle">
        {numero}
      </text>
    </svg>
  )
}

function usePrefContexto(): ReturnType<typeof lerPrefContexto> {
  const [pref, setPref] = useState(lerPrefContexto)
  useEffect(() => aoMudarPrefContexto(setPref), [])
  return pref
}

interface PropsPergunta {
  quadroId: string
  pode: boolean
  aoFechar(): void
}

/** "Compactar a conversa agora?" Se o main recusar (o agente voltou a trabalhar), mostra a frase dele. */
function PerguntaCompactar({ quadroId, pode, aoFechar }: PropsPergunta): React.JSX.Element {
  const [erro, setErro] = useState<string | null>(null)
  const confirmar = (): void => {
    setErro(null)
    window.lousa.agentes
      .compactar(quadroId)
      .then(aoFechar)
      .catch((e: unknown) => setErro(mensagemDe(e)))
  }
  return (
    <span className="anel-pergunta nodrag" role="dialog" aria-label="Compactar a conversa">
      <span>Compactar a conversa agora?</span>
      <small className="apagado">O Claude resume o que já foi dito e libera espaço.</small>
      {erro && <small className="anel-erro">{erro}</small>}
      <span className="anel-botoes">
        <button className="botao-pequeno botao-principal" disabled={!pode} onClick={confirmar}>
          Compactar
        </button>
        <button className="botao-pequeno" onClick={aoFechar}>
          Cancelar
        </button>
      </span>
    </span>
  )
}

/**
 * Anel de contexto no cabecalho do agente (T18.1, D24). Sem dado ainda, nao aparece. O clique
 * oferece compactar a conversa; quem escreve /compact e o main, e so com o agente parado.
 */
export function AnelContexto({ quadroId }: { quadroId: string }): React.JSX.Element | null {
  const painel = usePainel(quadroId)
  const estado = useAtencao(quadroId)?.aviso.estado
  const pref = usePrefContexto()
  const [perguntando, setPerguntando] = useState(false)
  const contexto = painel?.contexto ?? null
  const vista = vistaDoContexto(contexto?.usado ?? null, pref, contexto?.tamanho)
  if (!vista.visivel) return null
  // o anel so aparece com painel, e painel e a linha de status: o Claude esta pronto (D48). Sem
  // estado ainda (recem-aberto, nada pedido), ja pode compactar; o main confere de novo
  const pode = podeDigitar(estado, true)
  // cinza so com o agente ocupado
  const ocupado = estado === 'trabalhando' || estado === 'esperando'

  return (
    <span className="anel-caixa">
      <button
        className={ocupado ? 'anel-contexto anel-esperar nodrag' : 'anel-contexto nodrag'}
        aria-label={vista.texto}
        aria-disabled={!pode}
        data-nivel={vista.nivel}
        title={`${vista.texto}\n${pode ? 'Clique para compactar a conversa' : 'Para compactar, espere o agente parar'}`}
        onClick={() => pode && setPerguntando((p) => !p)}
      >
        <DesenhoAnel numero={vista.numero} nivel={vista.nivel} />
      </button>
      {perguntando && <PerguntaCompactar quadroId={quadroId} pode={pode} aoFechar={() => setPerguntando(false)} />}
    </span>
  )
}
