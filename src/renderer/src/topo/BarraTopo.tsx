// Barra de cima (T7.2): engrenagem (painel de contas) e um icone por conta, como os
// icones de extensao no canto do VSCode. A versao fica a direita (o smoke procura ali).
import { useCallback, useRef, useState } from 'react'
import type { Quadro } from '../../../shared/model'
import '../estilos/topo.css'
import { chamaAtencao, proximoAChamar } from '../lousa/atencao'
import { pedirFoco } from '../lousa/foco'
import { useMapaAtencao } from '../lousa/useAtencao'
import { IconeConta } from './IconeConta'
import { PainelContas } from './PainelContas'
import { Engrenagem } from './Simbolos'
import type { Contas } from './useContas'

interface Props {
  contas: Contas
  versao: string
  /** Na ordem da lousa: o botao "esperando voce" enquadra um por vez (T8.2). */
  quadros: Quadro[]
}

function ChamadasAtencao({ quadros }: { quadros: Quadro[] }): React.JSX.Element | null {
  const mapa = useMapaAtencao()
  const ultimo = useRef<string | null>(null)
  const ordem = quadros.map((q) => q.id)
  const quantos = ordem.filter((id) => chamaAtencao(mapa.get(id))).length
  if (quantos === 0) return null
  const focarProximo = (): void => {
    const id = proximoAChamar(mapa, ordem, ultimo.current)
    ultimo.current = id
    if (id) pedirFoco(id)
  }
  return (
    <button className="topo-chamadas" title="Mostrar o próximo quadro que pede atenção" onClick={focarProximo}>
      ● {quantos} esperando você
    </button>
  )
}

export function BarraTopo({ contas, versao, quadros }: Props): React.JSX.Element {
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
      <ChamadasAtencao quadros={quadros} />
      <span className="topo-marca">Lousa.ia</span>
      <span className="topo-versao">{versao}</span>
      {painel && <PainelContas contas={contas} aoFechar={fecharPainel} />}
    </header>
  )
}
