import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { PerfilComConta } from '../../../shared/model'

interface Props {
  perfil: PerfilComConta
  aoRenomear(nome: string): Promise<void>
  aoAtualizar(): Promise<void>
}

const NOME_DO_PROVEDOR = { claude: 'Claude', codex: 'Codex' } as const

export function CartaoConta({ perfil, aoRenomear, aoAtualizar }: Props): React.JSX.Element {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(perfil.nome)
  const [atualizando, setAtualizando] = useState(false)
  const [falha, setFalha] = useState<string | null>(null)
  const { conta } = perfil

  function comecarEdicao(): void {
    setRascunho(perfil.nome)
    setEditando(true)
  }

  async function salvar(): Promise<void> {
    const nome = rascunho.trim()
    setEditando(false)
    if (nome === '' || nome === perfil.nome) return
    try {
      setFalha(null)
      await aoRenomear(nome)
    } catch (e) {
      setFalha(e instanceof Error ? e.message : String(e))
    }
  }

  function teclou(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key === 'Enter') void salvar()
    if (e.key === 'Escape') setEditando(false)
  }

  async function atualizar(): Promise<void> {
    setAtualizando(true)
    try {
      await aoAtualizar()
    } finally {
      setAtualizando(false)
    }
  }

  const email = conta.email ?? (conta.logado ? 'Logado' : 'Sem login')
  return (
    <article className="cartao" data-conta={perfil.id} style={{ '--cor': perfil.cor } as CSSProperties}>
      <header className="cartao-topo">
        {editando ? (
          <input
            className="cartao-nome-campo"
            value={rascunho}
            maxLength={40}
            autoFocus
            aria-label="Nome da conta"
            onChange={(e) => setRascunho(e.target.value)}
            onKeyDown={teclou}
            onBlur={() => setEditando(false)}
          />
        ) : (
          <h2 className="cartao-nome" title="Duplo clique para renomear" onDoubleClick={comecarEdicao}>
            {perfil.nome}
          </h2>
        )}
        <span className="etiqueta etiqueta-provedor">{NOME_DO_PROVEDOR[perfil.provedor]}</span>
      </header>
      <p className="cartao-email">{email}</p>
      {conta.plano && <span className="etiqueta">{conta.plano}</span>}
      {conta.erro && (
        <p className="erro" role="alert">
          {conta.erro}
        </p>
      )}
      {falha && (
        <p className="erro" role="alert">
          {falha}
        </p>
      )}
      <button className="botao-pequeno" disabled={atualizando} onClick={() => void atualizar()}>
        {atualizando ? 'Atualizando…' : 'Atualizar'}
      </button>
    </article>
  )
}
