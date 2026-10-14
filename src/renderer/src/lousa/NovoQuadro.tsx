import { useEffect, useState } from 'react'
import type { PerfilComConta, Repo, TipoQuadro } from '../../../shared/model'

interface Props {
  perfis: PerfilComConta[]
  repos: Repo[]
  /** Veio de arrastar a conta ou do "+ Agente" do cartao: ja vem marcada. */
  perfilInicial?: string
  /** Onde a janelinha aparece, em pixels da tela. */
  tela: { x: number; y: number }
  aoCriar(repoId: string, tipo: TipoQuadro, perfilId: string): Promise<void>
  aoNovaPasta(repo: Repo): void
  aoCancelar(): void
}

const LARGURA = 340
const ALTURA_MAX = 460

/** Pasta onde esta conta trabalhou por ultimo; senao a pasta mais recente. */
function pastaSugerida(repos: Repo[], perfilId: string): string | null {
  const daConta = [...repos].reverse().find((r) => r.perfilPadraoId === perfilId)
  return daConta?.id ?? repos[repos.length - 1]?.id ?? null
}

function ChipsConta(p: { perfis: PerfilComConta[]; marcada: string; aoMarcar(id: string): void }): React.JSX.Element {
  return (
    <div className="novo-opcoes" role="radiogroup" aria-label="Conta">
      {p.perfis.map((perfil) => (
        <button
          key={perfil.id}
          role="radio"
          aria-checked={perfil.id === p.marcada}
          className="chip-escolha"
          style={{ '--cor': perfil.cor } as React.CSSProperties}
          onClick={() => p.aoMarcar(perfil.id)}
        >
          {perfil.nome}
        </button>
      ))}
    </div>
  )
}

function ListaPastas(p: { repos: Repo[]; marcada: string | null; aoMarcar(id: string): void }): React.JSX.Element {
  return (
    <div className="novo-pastas" role="radiogroup" aria-label="Pasta">
      {[...p.repos].reverse().map((r) => (
        <button
          key={r.id}
          role="radio"
          aria-checked={r.id === p.marcada}
          className="pasta-escolha"
          title={r.caminho}
          onClick={() => p.aoMarcar(r.id)}
        >
          <strong>{r.nome}</strong>
          <span>{r.caminho}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * "Novo quadro" (T5.3): conta + pasta no mesmo gesto. Unica forma de abrir um quadro;
 * chega por arrastar a conta, duplo clique na lousa ou "+ Agente" no cartao.
 */
export function NovoQuadro(props: Props): React.JSX.Element {
  const { perfis, repos, perfilInicial, tela, aoCriar, aoNovaPasta, aoCancelar } = props
  const [perfilId, setPerfilId] = useState(perfilInicial ?? perfis[0]?.id ?? '')
  const [repoId, setRepoId] = useState<string | null>(() => pastaSugerida(repos, perfilId))
  const [erro, setErro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState(false)

  async function abrir(tipo: TipoQuadro): Promise<void> {
    if (!repoId || ocupado) return
    setOcupado(true)
    setErro(null)
    try {
      await aoCriar(repoId, tipo, perfilId)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
      setOcupado(false)
    }
  }

  async function outraPasta(): Promise<void> {
    setErro(null)
    try {
      const escolha = await window.lousa.repos.escolherPasta()
      if (!escolha) return
      const conta = perfilInicial ?? escolha.sugestaoPerfilId ?? perfilId
      const repo = await window.lousa.repos.adicionar(escolha.caminho, conta)
      aoNovaPasta(repo)
      setPerfilId(conta)
      setRepoId(repo.id)
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') aoCancelar()
      if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) void abrir('agente')
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  })

  const left = Math.max(8, Math.min(tela.x, window.innerWidth - LARGURA - 8))
  const top = Math.max(8, Math.min(tela.y, window.innerHeight - ALTURA_MAX - 8))
  return (
    <>
      <div className="novo-fundo" onMouseDown={aoCancelar} />
      <div className="novo-quadro" role="dialog" aria-label="Novo quadro" style={{ left, top, width: LARGURA }}>
        <p className="novo-rotulo">Conta</p>
        <ChipsConta perfis={perfis} marcada={perfilId} aoMarcar={setPerfilId} />
        <p className="novo-rotulo">Pasta</p>
        {repos.length > 0 && <ListaPastas repos={repos} marcada={repoId} aoMarcar={setRepoId} />}
        <button className="botao-pequeno" onClick={() => void outraPasta()}>
          {repos.length > 0 ? 'Outra pasta…' : 'Escolher pasta…'}
        </button>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <div className="novo-botoes">
          <button className="botao-principal" disabled={!repoId || ocupado} onClick={() => void abrir('agente')}>
            Abrir agente
          </button>
          <button className="botao-pequeno" disabled={!repoId || ocupado} onClick={() => void abrir('terminal')}>
            Abrir terminal
          </button>
        </div>
      </div>
    </>
  )
}
