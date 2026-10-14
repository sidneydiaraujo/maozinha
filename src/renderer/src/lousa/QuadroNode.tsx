import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Terminal } from '../componentes/Terminal'
import type { QuadroNo } from './nos'

const NOME_DO_PROVEDOR = { claude: 'Claude', codex: 'Codex' } as const

/** Quadro com a cor da conta DELE (nao do repo): duas contas no mesmo repo ficam lado a lado. */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, acoes } = data
  const conta = perfil ? `${perfil.nome} · ${NOME_DO_PROVEDOR[perfil.provedor]}` : 'conta não encontrada'
  return (
    <div className="quadro" data-quadro={quadro.id} style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}>
      <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
      <header className="cabecalho-quadro">
        <span className="quadro-titulo">{quadro.titulo}</span>
        <span className="quadro-conta" title={perfil?.conta.email ?? undefined}>
          {conta}
        </span>
        <button className="botao-fechar nodrag" aria-label={`Fechar ${quadro.titulo}`} onClick={() => acoes.removerQuadro(quadro.id)}>
          ×
        </button>
      </header>
      <div className="quadro-corpo">
        <Terminal alvo={{ tipo: 'quadro', quadroId: quadro.id }} />
      </div>
    </div>
  )
}
