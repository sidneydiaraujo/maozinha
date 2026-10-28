import { useState } from 'react'
import { MAXIMO_LETRAS_PAPEL } from '../../../shared/time'

interface Props {
  papel: string | undefined
  aoSalvar(papel: string): Promise<void>
}

/**
 * Papel do agente (T29.1): "Construtor", "Revisor"... Clique escreve; Enter guarda, Esc desiste.
 * Os colegas do time chamam o agente por esse nome, e ele assina os cards do KANBAN.md (D52).
 */
export function PapelDoQuadro({ papel, aoSalvar }: Props): React.JSX.Element {
  const [escrevendo, setEscrevendo] = useState<string | null>(null)
  if (escrevendo === null) {
    return (
      <button
        className={`papel-quadro nodrag ${papel ? '' : 'papel-vazio'}`}
        title={'Nome do agente: assina os cards do KANBAN.md e é como os colegas do time o chamam.\nO nome novo vale quando o agente abre de novo.'}
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
      aria-label="Papel do agente"
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
