import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Terminal } from '../componentes/Terminal'
import type { QuadroNo } from './nos'

/** Quadro solto na lousa (D13): titulo, conta (com a cor dela) e pasta no cabecalho. */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, repo, acoes } = data
  return (
    <div className="quadro" data-quadro={quadro.id} style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}>
      <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
      <header className="cabecalho-quadro">
        <span className="quadro-titulo">{quadro.titulo}</span>
        <span className="quadro-conta" title={perfil?.conta.email ?? undefined}>
          {perfil?.nome ?? 'conta não encontrada'}
        </span>
        <span className="quadro-pasta" title={repo.caminho}>
          {repo.nome}
        </span>
        <button
          className="botao-fechar nodrag"
          aria-label={`Fechar ${quadro.titulo}`}
          onClick={() => acoes.removerQuadro(quadro.id)}
        >
          ×
        </button>
      </header>
      <div className="quadro-corpo">
        <Terminal alvo={{ tipo: 'quadro', quadroId: quadro.id }} />
      </div>
    </div>
  )
}
