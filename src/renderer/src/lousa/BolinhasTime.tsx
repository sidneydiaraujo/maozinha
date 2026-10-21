import { Handle, Position } from '@xyflow/react'
import { BOLINHA_ENTRADA, BOLINHA_SAIDA } from './linhas'

/**
 * Bolinhas do time (T28.2, D39), so no agente Claude: a da direita puxa uma linha ate outro
 * agente ("este entrega para aquele"); a da esquerda recebe. Ficam fora do .quadro, que corta
 * o que passa da borda.
 */
export function BolinhasTime(): React.JSX.Element {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id={BOLINHA_ENTRADA}
        className="bolinha-time bolinha-entrada"
        title="Solte aqui uma linha: este agente recebe o trabalho do outro"
      />
      <Handle
        type="source"
        position={Position.Right}
        id={BOLINHA_SAIDA}
        className="bolinha-time bolinha-saida"
        title="Puxe até outro agente para formar um time"
      />
    </>
  )
}
