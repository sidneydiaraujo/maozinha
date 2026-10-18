// Barra de cima (T7.2): engrenagem (painel de contas) e um icone por conta, como os
// icones de extensao no canto do VSCode. A versao fica a direita (o smoke procura ali).
import { useCallback, useState } from 'react'
import '../estilos/topo.css'
import { IconeConta } from './IconeConta'
import { PainelContas } from './PainelContas'
import { Engrenagem } from './Simbolos'
import type { Contas } from './useContas'

interface Props {
  contas: Contas
  versao: string
}

export function BarraTopo({ contas, versao }: Props): React.JSX.Element {
  const [painel, setPainel] = useState(false)
  const [abertoId, setAbertoId] = useState<string | null>(null)
  const fecharBalao = useCallback(() => setAbertoId(null), [])
  const fecharPainel = useCallback(() => setPainel(false), [])

  return (
    <header className="topo">
      <button
        className="topo-engrenagem"
        title="Contas e configurações"
        aria-label="Contas e configurações"
        aria-expanded={painel}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={() => setPainel((p) => !p)}
      >
        <Engrenagem />
      </button>
      <div className="topo-contas" aria-label="Contas">
        {contas.perfis?.map((p) => (
          <IconeConta
            key={p.id}
            perfil={p}
            contas={contas}
            aberto={abertoId === p.id}
            aoAlternar={() => setAbertoId((id) => (id === p.id ? null : p.id))}
            aoFechar={fecharBalao}
          />
        ))}
        {contas.perfis === null && !contas.erro && <span className="apagado">Lendo contas…</span>}
        {contas.erro && <span className="erro">{contas.erro}</span>}
      </div>
      <span className="topo-marca">Lousa.ia</span>
      <span className="topo-versao">{versao}</span>
      {painel && <PainelContas contas={contas} aoFechar={fecharPainel} />}
    </header>
  )
}
