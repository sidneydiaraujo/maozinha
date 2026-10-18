import { NodeResizer, type NodeProps } from '@xyflow/react'
import { Terminal } from '../componentes/Terminal'
import '../estilos/quadro.css'
import { chamaAtencao, seloDoAviso } from './atencao'
import { ContaDoQuadro } from './ContaDoQuadro'
import type { QuadroNo } from './nos'
import { atencao, useAtencao } from './useAtencao'

/** "esperando você", "terminou"... no cabecalho (T8.2); a frase do Claude aparece ao parar o mouse. */
function SeloAgente({ quadroId }: { quadroId: string }): React.JSX.Element | null {
  const aviso = useAtencao(quadroId)?.aviso
  const selo = aviso ? seloDoAviso(aviso) : null
  if (!selo) return null
  return (
    <span className={`selo-agente ${selo.classe}`} title={aviso?.mensagem}>
      {selo.texto}
    </span>
  )
}

/**
 * Quadro solto na lousa (D13, D14): a pasta da o nome (onde o trabalho fica) e o selo
 * diz a conta (quem paga). Trocar a conta remonta o terminal, que retoma a conversa.
 */
export function QuadroNode({ data, selected }: NodeProps<QuadroNo>): React.JSX.Element {
  const { quadro, perfil, repo, rotulo, contas, acoes } = data
  const chamando = chamaAtencao(useAtencao(quadro.id))
  return (
    <div
      className={chamando ? 'quadro quadro-chamando' : 'quadro'}
      data-quadro={quadro.id}
      style={{ '--cor': perfil?.cor ?? '#555' } as React.CSSProperties}
      onMouseDownCapture={() => chamando && atencao.marcarVisto(quadro.id)}
    >
      <NodeResizer minWidth={360} minHeight={220} isVisible={selected} />
      <header className="cabecalho-quadro">
        <span className="quadro-pasta" title={repo.caminho}>
          <span aria-hidden="true">📁</span> {rotulo}
        </span>
        {quadro.tipo === 'terminal' && <span className="etiqueta">terminal</span>}
        <SeloAgente quadroId={quadro.id} />
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
        <Terminal
          key={quadro.perfilId}
          alvo={{ tipo: 'quadro', quadroId: quadro.id }}
          aoAviso={(aviso) => atencao.aplicar(quadro.id, aviso)}
        />
      </div>
    </div>
  )
}
