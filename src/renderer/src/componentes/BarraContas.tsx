import { useEffect, useState } from 'react'
import type { PerfilComConta } from '../../../shared/model'
import { CartaoConta } from './CartaoConta'

interface Props {
  rodape: string
}

export function BarraContas({ rodape }: Props): React.JSX.Element {
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
  }

  async function atualizar(perfil: PerfilComConta): Promise<void> {
    const conta = await window.lousa.perfis.atualizarConta(perfil.id)
    trocar({ ...perfil, conta })
  }

  return (
    <aside className="barra">
      <h1 className="barra-titulo">Contas</h1>
      <div className="barra-lista">
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        {!erro && perfis === null && <p className="apagado">Lendo contas…</p>}
        {perfis?.length === 0 && <p className="apagado">Nenhuma conta do Claude Code neste PC.</p>}
        {perfis?.map((p) => (
          <CartaoConta
            key={p.id}
            perfil={p}
            aoRenomear={(nome) => renomear(p, nome)}
            aoAtualizar={() => atualizar(p)}
          />
        ))}
      </div>
      <footer className="barra-rodape">{rodape}</footer>
    </aside>
  )
}
