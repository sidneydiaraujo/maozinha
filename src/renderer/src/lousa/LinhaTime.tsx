import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react'
import '../estilos/time.css'
import { pedirExcluirColega, pedirMenuLinha } from './foco'
import { colegaLivre, type ArestaTime } from './linhas'
import { guardarRepasse, limparRepasse, rotuloDoRepasse, useRepasse } from './repasses'
import { useAtencao } from './useAtencao'

const EXCLUIR = {
  texto: '✕ excluir',
  dica: 'Este colega terminou a tarefa. O líder reaproveita colegas livres no próximo pedido; se não for mais usar, clique para fechar o quadro dele.',
}

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
  const repasse = useRepasse(p.id)
  const doRepasse = repasse && rotuloDoRepasse(repasse)
  const livre = colegaLivre(p.data, useAtencao(p.target)?.aviso.estado)
  const rotulo = doRepasse ?? (livre ? EXCLUIR : rotuloDa(p.data))
  // "Passar para…" e "Continuar?" passam o trabalho; o resto abre o menu da linha (T30.1)
  const clicou = (e: React.MouseEvent): void => {
    // o rotulo e um portal, mas o clique sobe pela arvore do React ate a linha (onEdgeClick)
    e.stopPropagation()
    if (livre && !doRepasse) return pedirExcluirColega(p.target)
    if (!repasse || !doRepasse?.passa) return pedirMenuLinha({ ligacaoId: p.id, x: e.clientX, y: e.clientY })
    window.lousa.time.passar(p.id).then(
      () => limparRepasse(p.id),
      () => guardarRepasse({ ...repasse, tipo: 'descartado' }),
    )
  }
  return (
    <>
      <BaseEdge id={p.id} path={caminho} markerEnd={p.markerEnd} interactionWidth={24} />
      {rotulo && (
        <EdgeLabelRenderer>
          <div
            className={`rotulo-linha-time nodrag nopan${repasse ? ` repasse-${repasse.tipo}` : livre ? ' rotulo-excluir' : ''}`}
            data-linha={p.id}
            title={rotulo.dica}
            onClick={clicou}
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
          >
            {rotulo.texto}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
