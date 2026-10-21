import { useState } from 'react'
import { MAXIMO_LETRAS_PAPEL } from '../../../shared/time'

interface Props {
  papel: string | undefined
  aoSalvar(papel: string): Promise<void>
}

/**
 * Papel do agente no time (T29.1): "Construtor", "Revisor"... Clique escreve; Enter guarda, Esc
 * desiste. Os colegas passam a chamar o agente por esse nome.
 */
export function PapelDoQuadro({ papel, aoSalvar }: Props): React.JSX.Element {
  const [escrevendo, setEscrevendo] = useState<string | null>(null)
  if (escrevendo === null) {
    return (
      <button
        className={`papel-quadro nodrag ${papel ? '' : 'papel-vazio'}`}
        title="Papel no time: os colegas chamam este agente por esse nome"
        onClick={() => setEscrevendo(papel ?? '')}
      >
        {papel ?? '+ papel'}
      </button>
    )
  }
  const guardar = (): void => {
    const texto = escrevendo
    setEscrevendo(null)
    if (texto.trim() !== (papel ?? '')) void aoSalvar(texto)
  }
  return (
    <input
      className="papel-quadro-campo nodrag"
      aria-label="Papel no time"
      autoFocus
      maxLength={MAXIMO_LETRAS_PAPEL}
      placeholder="Revisor, QA…"
      value={escrevendo}
      onChange={(e) => setEscrevendo(e.target.value)}
      onBlur={guardar}
      onKeyDown={(e) => {
        if (e.key === 'Enter') guardar()
        if (e.key === 'Escape') setEscrevendo(null)
      }}
    />
  )
}
