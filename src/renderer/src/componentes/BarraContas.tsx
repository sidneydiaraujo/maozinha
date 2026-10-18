import { useEffect, useState } from 'react'
import type { PerfilComConta, StatusConta } from '../../../shared/model'
import { CartaoConta } from './CartaoConta'

interface Props {
  rodape: string
  /** Avisa a lousa que uma conta mudou (nome, login): os selos dos quadros acompanham. */
  aoMudar(): void
}

/** Duas contas com o mesmo e-mail quase sempre e o login ter caido na conta errada do navegador. */
function avisoDeEmail(perfil: PerfilComConta, todos: PerfilComConta[]): string | undefined {
  const email = perfil.conta.email?.toLowerCase()
  if (!email) return undefined
  const outra = todos.find((p) => p.id !== perfil.id && p.conta.email?.toLowerCase() === email)
  return outra
    ? `Mesmo e-mail da conta ${outra.nome}. Se não era para ser, entre de novo numa janela anônima.`
    : undefined
}

interface ListaProps {
  perfis: PerfilComConta[]
  aoRenomear(perfil: PerfilComConta, nome: string): Promise<void>
  aoAtualizar(perfil: PerfilComConta): Promise<void>
  aoEntrou(perfil: PerfilComConta, conta: StatusConta): void
}

function ListaCartoes({ perfis, aoRenomear, aoAtualizar, aoEntrou }: ListaProps): React.JSX.Element {
  return (
    <>
      {perfis.map((p) => (
        <CartaoConta
          key={p.id}
          perfil={p}
          aoRenomear={(nome) => aoRenomear(p, nome)}
          aoAtualizar={() => aoAtualizar(p)}
          aoEntrou={(conta) => aoEntrou(p, conta)}
          aviso={avisoDeEmail(p, perfis)}
          conferirEmail={(email) => avisoDeEmail({ ...p, conta: { ...p.conta, email } }, perfis)}
        />
      ))}
    </>
  )
}

export function BarraContas({ rodape, aoMudar }: Props): React.JSX.Element {
  const [perfis, setPerfis] = useState<PerfilComConta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    let ativo = true
    window.lousa.perfis
      .listar()
      .then((lista) => ativo && setPerfis(lista))
      .catch((e: unknown) => ativo && setErro(e instanceof Error ? e.message : String(e)))
    return () => {
      ativo = false
    }
  }, [])

  function trocar(nova: PerfilComConta): void {
    setPerfis((atual) => atual?.map((p) => (p.id === nova.id ? nova : p)) ?? null)
  }

  async function renomear(perfil: PerfilComConta, nome: string): Promise<void> {
    trocar(await window.lousa.perfis.renomear(perfil.id, nome))
    aoMudar()
  }

  async function atualizar(perfil: PerfilComConta): Promise<void> {
    const conta = await window.lousa.perfis.atualizarConta(perfil.id)
    trocar({ ...perfil, conta })
  }

  return (
    <aside className="barra">
      <h1 className="barra-titulo">Contas</h1>
      <p className="barra-dica">Quem paga cada quadro. Arraste uma conta para a lousa para abrir um quadro nela.</p>
      <div className="barra-lista">
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        {!erro && perfis === null && <p className="apagado">Lendo contas…</p>}
        {perfis?.length === 0 && <p className="apagado">Nenhuma conta do Claude Code neste PC.</p>}
        {perfis && (
          <ListaCartoes
            perfis={perfis}
            aoRenomear={renomear}
            aoAtualizar={atualizar}
            aoEntrou={(perfil, conta) => {
              trocar({ ...perfil, conta })
              aoMudar()
            }}
          />
        )}
      </div>
      <footer className="barra-rodape">{rodape}</footer>
    </aside>
  )
}
