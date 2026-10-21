import { useState, type CSSProperties, type KeyboardEvent } from 'react'
import type { GitDaConta, PerfilComConta, StatusConta } from '../../../shared/model'
import { TIPO_ARRASTE_CONTA } from '../lousa/nos'
import { GitDaContaSecao } from './GitDaConta'
import { JanelaLogin } from './JanelaLogin'

interface Props {
  perfil: PerfilComConta
  aoRenomear(nome: string): Promise<void>
  aoAtualizar(): Promise<void>
  /** So no painel da engrenagem; o balao do icone fica sem a secao de git. */
  aoDefinirGit?(git: GitDaConta | null): Promise<void>
  /** O login terminou: a conta ja foi lida de novo. */
  aoEntrou(conta: StatusConta): void
  /** Ex.: "mesmo e-mail da conta Principal". */
  aviso?: string
  /** O aviso que este e-mail geraria (para a janela de login avisar na hora). */
  conferirEmail(email: string): string | undefined
}

const NOME_DO_PROVEDOR = { claude: 'Claude', codex: 'Codex' } as const

interface AcoesProps {
  logado: boolean
  aoAtualizar(): Promise<void>
  aoEntrar(): void
}

function AcoesCartao({ logado, aoAtualizar, aoEntrar }: AcoesProps): React.JSX.Element {
  const [atualizando, setAtualizando] = useState(false)
  async function atualizar(): Promise<void> {
    setAtualizando(true)
    try {
      await aoAtualizar()
    } finally {
      setAtualizando(false)
    }
  }
  return (
    <div className="cartao-acoes">
      <button className="botao-pequeno" disabled={atualizando} onClick={() => void atualizar()}>
        {atualizando ? 'Atualizando…' : 'Atualizar'}
      </button>
      <button className="botao-pequeno botao-entrar" onClick={aoEntrar}>
        {logado ? 'Trocar login' : 'Entrar'}
      </button>
    </div>
  )
}

/** Plano, "padrão do PC" e os avisos/erros da conta. */
function Avisos({
  perfil,
  aviso,
  falha,
}: {
  perfil: PerfilComConta
  aviso?: string
  falha: string | null
}): React.JSX.Element {
  const { conta } = perfil
  return (
    <>
      {conta.plano && <span className="etiqueta">{conta.plano}</span>}
      {perfil.ehPadrao && (
        <span className="etiqueta" title="Mesma conta do VSCode e dos terminais fora da Lousa">
          padrão do PC · compartilhada
        </span>
      )}
      {conta.erro && (
        <p className="erro" role="alert">
          {conta.erro}
        </p>
      )}
      {aviso && (
        <p className="aviso-conta" role="status">
          {aviso}
        </p>
      )}
      {falha && (
        <p className="erro" role="alert">
          {falha}
        </p>
      )}
    </>
  )
}

export function CartaoConta(props: Props): React.JSX.Element {
  const { perfil, aoRenomear, aoAtualizar, aoDefinirGit, aoEntrou, aviso, conferirEmail } = props
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(perfil.nome)
  const [falha, setFalha] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)
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

  const email = conta.email ?? (conta.logado ? 'Logado' : 'Sem login')
  return (
    <article
      className="cartao"
      data-conta={perfil.id}
      style={{ '--cor': perfil.cor } as CSSProperties}
      draggable={!editando}
      onDragStart={(e) => {
        e.dataTransfer.setData(TIPO_ARRASTE_CONTA, perfil.id)
        e.dataTransfer.effectAllowed = 'copy'
      }}
    >
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
      <Avisos perfil={perfil} aviso={aviso} falha={falha} />
      <AcoesCartao logado={conta.logado} aoAtualizar={aoAtualizar} aoEntrar={() => setEntrando(true)} />
      {aoDefinirGit && <GitDaContaSecao perfil={perfil} aoSalvar={aoDefinirGit} />}
      {entrando && (
        <JanelaLogin
          perfil={perfil}
          aoConcluir={aoEntrou}
          conferirEmail={conferirEmail}
          aoFechar={() => setEntrando(false)}
        />
      )}
    </article>
  )
}
