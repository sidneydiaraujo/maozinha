import { useEffect, useState } from 'react'
import '../estilos/envio.css'
import { montarEnvio, quadrosPorExtenso } from './envio'
import { enviarMensagem } from './escrever'
import { MensagensProntas } from './MensagensProntas'

interface Props {
  /** Quadros selecionados na lousa (Ctrl+clique no cabecalho ou Shift+arrastar no vazio). */
  quadroIds: string[]
}

/**
 * Com dois quadros ou mais selecionados, uma barra no pe da lousa manda a mesma mensagem para
 * todos (T13.1, D21): "rode os testes", "faça commit"... Enter envia; Shift+Enter quebra a linha.
 */
export function BarraEnvio({ quadroIds }: Props): React.JSX.Element | null {
  const [texto, setTexto] = useState('')
  const [aviso, setAviso] = useState<string | null>(null)

  useEffect(() => {
    if (!aviso) return
    const t = window.setTimeout(() => setAviso(null), 4000)
    return () => window.clearTimeout(t)
  }, [aviso])

  if (quadroIds.length < 2) return null

  async function enviar(): Promise<void> {
    if (!montarEnvio(texto)) return
    const alvos = [...quadroIds]
    const resultados = await Promise.allSettled(alvos.map((id) => enviarMensagem(id, texto)))
    const falhas = resultados.filter((r) => r.status === 'rejected').length
    setTexto('')
    setAviso(
      falhas === 0
        ? `Enviado para ${quadrosPorExtenso(alvos.length)}`
        : `Enviado para ${alvos.length - falhas} de ${alvos.length} (${quadrosPorExtenso(falhas)} sem terminal aberto)`,
    )
  }

  return (
    <div className="barra-envio nodrag" role="form" aria-label="Mensagem para vários quadros">
      <span className="barra-envio-rotulo">Para {quadrosPorExtenso(quadroIds.length)}</span>
      <textarea
        rows={1}
        value={texto}
        placeholder="A mesma mensagem para todos os selecionados (Enter envia)"
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== 'Enter' || e.shiftKey) return
          e.preventDefault()
          void enviar()
        }}
      />
      <MensagensProntas texto={texto} aoEscolher={setTexto} />
      <button className="botao-principal" disabled={texto.trim() === ''} onClick={() => void enviar()}>
        Enviar
      </button>
      {aviso && <span className="barra-envio-aviso">{aviso}</span>}
    </div>
  )
}
