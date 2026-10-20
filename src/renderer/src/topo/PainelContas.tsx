// Painel da engrenagem (T7.2): todos os cartoes de conta e "+ Nova conta" (T1.8), e a Aparencia (T15.1).
import { useRef, useState } from 'react'
import { CartaoConta } from '../componentes/CartaoConta'
import { mensagemDe } from '../componentes/erro'
import { NovaConta } from '../componentes/NovaConta'
import { useFecharFora } from '../componentes/useFecharFora'
import { Aparencia } from './Aparencia'
import { ContextoConfig } from './ContextoConfig'
import { UsoConfig } from './UsoConfig'
import { avisoDeEmail, type Contas } from './useContas'

interface Props {
  contas: Contas
  aoFechar(): void
}

function ListaCartoes({ contas }: { contas: Contas }): React.JSX.Element {
  const perfis = contas.perfis ?? []
  return (
    <>
      {perfis.map((p) => (
        <CartaoConta
          key={p.id}
          perfil={p}
          aoRenomear={(nome) => contas.renomear(p, nome)}
          aoAtualizar={() => contas.atualizar(p)}
          aoEntrou={(conta) => contas.entrou(p, conta)}
          aviso={avisoDeEmail(p, perfis)}
          conferirEmail={(email) => avisoDeEmail({ ...p, conta: { ...p.conta, email } }, perfis)}
        />
      ))}
    </>
  )
}

/** Pasta dos registros (T8.6): se algo falhar, o arquivo do dia diz o motivo. */
function Registros(): React.JSX.Element {
  const [erro, setErro] = useState<string | null>(null)
  return (
    <footer className="painel-contas-rodape">
      <button
        className="botao-pequeno"
        onClick={() => window.lousa.app.abrirRegistros().catch((e: unknown) => setErro(mensagemDe(e)))}
      >
        Abrir pasta de registros
      </button>
      <span className="apagado">Se algo falhar, o arquivo do dia diz o motivo.</span>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
    </footer>
  )
}

export function PainelContas({ contas, aoFechar }: Props): React.JSX.Element {
  const painel = useRef<HTMLDivElement>(null)
  const [criando, setCriando] = useState(false)
  useFecharFora(true, painel, aoFechar)

  return (
    <div ref={painel} className="painel-contas" role="dialog" aria-label="Contas">
      <header className="painel-contas-topo">
        <h2 className="barra-titulo">Contas</h2>
        <button className="botao-fechar" aria-label="Fechar" onClick={aoFechar}>
          ×
        </button>
      </header>
      <p className="barra-dica">
        Quem paga cada quadro. Arraste uma conta (daqui ou o ícone no alto) para a lousa para abrir um quadro nela.
      </p>
      <div className="barra-lista">
        {contas.erro && (
          <p className="erro" role="alert">
            {contas.erro}
          </p>
        )}
        {!contas.erro && contas.perfis === null && <p className="apagado">Lendo contas…</p>}
        {contas.perfis?.length === 0 && <p className="apagado">Nenhuma conta neste PC ainda.</p>}
        <ListaCartoes contas={contas} />
        {criando ? (
          <NovaConta
            aoCriar={async (provedor, nome) => {
              await contas.criar(provedor, nome)
              setCriando(false)
            }}
            aoCancelar={() => setCriando(false)}
          />
        ) : (
          <button className="botao-nova-conta" onClick={() => setCriando(true)}>
            + Nova conta
          </button>
        )}
      </div>
      <Aparencia />
      <ContextoConfig />
      <UsoConfig />
      <Registros />
    </div>
  )
}
