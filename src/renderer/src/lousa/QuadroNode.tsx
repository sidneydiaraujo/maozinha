import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Terminal } from '../componentes/Terminal'
import { ContaDoQuadro } from './ContaDoQuadro'
import type { QuadroNo } from './nos'

/**
 * Quadro solto na lousa (D13, D14): a pasta da o nome (onde o trabalho fica) e o selo
 * diz a conta (quem paga). Trocar a conta remonta o terminal, que retoma a conversa.
 */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, repo, rotulo, contas, acoes } = data
  return (
    <div className="quadro" data-quadro={quadro.id} style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}>
      <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
      <header className="cabecalho-quadro">
        <span className="quadro-pasta" title={repo.caminho}>
          <span aria-hidden="true">📁</span> {rotulo}
        </span>
        {quadro.tipo === 'terminal' && <span className="etiqueta">terminal</span>}
        <ContaDoQuadro
          perfil={perfil}
          contas={contas}
          tipo={quadro.tipo}
          aoTrocar={(perfilId) => acoes.trocarConta(quadro.id, perfilId)}
        />
        <button
          className="botao-fechar nodrag"
          aria-label={`Fechar ${rotulo}`}
          onClick={() => acoes.removerQuadro(quadro.id)}
        >
          ×
        </button>
      </header>
      <div className="quadro-corpo">
        <Terminal key={quadro.perfilId} alvo={{ tipo: 'quadro', quadroId: quadro.id }} />
      </div>
    </div>
  )
}
