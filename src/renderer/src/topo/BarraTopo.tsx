// Barra de cima (T7.2): engrenagem (painel de contas) e um icone por conta, como os
// icones de extensao no canto do VSCode. A versao fica a direita (o smoke procura ali).
import { useCallback, useRef, useState } from 'react'
import type { Ligacao, Quadro, Repo } from '../../../shared/model'
import '../estilos/topo.css'
import { proximoAChamar, textoDaPilula } from '../lousa/atencao'
import { pedirFoco } from '../lousa/foco'
import { useMapaAtencao } from '../lousa/useAtencao'
import { FilaProntos } from './FilaProntos'
import { IconeConta } from './IconeConta'
import { PainelContas } from './PainelContas'
import { Engrenagem } from './Simbolos'
import type { Contas } from './useContas'

interface Props {
  contas: Contas
  versao: string
  /** Dica do mouse na versao: o motor por baixo (D45). */
  motor: string
  /** Na ordem da lousa: o botao "esperando voce" enquadra um por vez (T8.2). */
  quadros: Quadro[]
  /** O projeto e o time de cada pronto (A26). */
  repos: Repo[]
  ligacoes: Ligacao[]
}

function ChamadasAtencao({ quadros }: { quadros: Quadro[] }): React.JSX.Element | null {
  const mapa = useMapaAtencao()
  const ultimo = useRef<string | null>(null)
  const ordem = quadros.map((q) => q.id)
  const texto = textoDaPilula(mapa, ordem)
  if (!texto) return null
  // so "trabalhando": a pilula fica azul e o clique nao tem para onde ir
  const esperando = proximoAChamar(mapa, ordem, null) !== null
  const focarProximo = (): void => {
    const id = proximoAChamar(mapa, ordem, ultimo.current)
    ultimo.current = id
    if (id) pedirFoco(id)
  }
  return (
    <button
      className={esperando ? 'topo-chamadas' : 'topo-chamadas topo-chamadas-calmo'}
      title={esperando ? 'Mostrar o próximo quadro que pede atenção' : 'Agentes trabalhando'}
      onClick={focarProximo}
    >
      {texto}
    </button>
  )
}

export function BarraTopo({ contas, versao, motor, quadros, repos, ligacoes }: Props): React.JSX.Element {
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
      <div className="topo-centro">
        <ChamadasAtencao quadros={quadros} />
        <FilaProntos quadros={quadros} repos={repos} ligacoes={ligacoes} />
      </div>
      <span className="topo-marca">Mãozinha</span>
      <span className="topo-versao" title={motor}>
        {versao}
      </span>
      {painel && <PainelContas contas={contas} aoFechar={fecharPainel} />}
    </header>
  )
}
