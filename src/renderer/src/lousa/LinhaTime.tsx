import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import '../estilos/time.css'
import { pedirMenuLinha } from './foco'
import type { ArestaTime } from './linhas'

/** O que a linha diz no meio dela; linha normal (automatica, pastas separadas) fica muda. */
function rotuloDa(d: ArestaTime['data']): { texto: string; dica: string } | null {
  if (!d) return null
  if (d.ligacao.pausada) return { texto: 'pausada', dica: 'Pausada: o trabalho não passa adiante. Clique para retomar.' }
  if (d.mesmaPasta) {
    return { texto: '⚠ mesma pasta', dica: 'Os dois trabalham na mesma pasta: podem se atrapalhar. Use uma cópia separada.' }
  }
  if (d.ligacao.modo === 'perguntar') return { texto: 'perguntar', dica: 'Pergunta antes de passar o trabalho adiante.' }
  return null
}

/** Linha do time (T28.2, D39): seta "este entrega para aquele", na cor do time. */
export function LinhaTime(p: EdgeProps<ArestaTime>): React.JSX.Element {
  const [caminho, x, y] = getBezierPath(p)
  const rotulo = rotuloDa(p.data)
  return (
    <>
      <BaseEdge id={p.id} path={caminho} markerEnd={p.markerEnd} interactionWidth={24} />
      {rotulo && (
        <EdgeLabelRenderer>
          <div
            className="rotulo-linha-time nodrag nopan"
            title={rotulo.dica}
            onClick={(e) => pedirMenuLinha({ ligacaoId: p.id, x: e.clientX, y: e.clientY })}
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
          >
            {rotulo.texto}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
