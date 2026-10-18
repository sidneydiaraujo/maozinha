import { useEffect, useState } from 'react'
import type { PerfilComConta, Repo, TipoQuadro } from '../../../shared/model'
import { PastasRecentes } from './PastasRecentes'

interface Props {
  perfis: PerfilComConta[]
  repos: Repo[]
  /** Veio de arrastar o cartao da conta: ja vem marcada. */
  perfilInicial?: string
  /** Onde a janelinha aparece, em pixels da tela. */
  tela: { x: number; y: number }
  aoCriar(repoId: string, tipo: TipoQuadro, perfilId: string): Promise<void>
  aoNovaPasta(repo: Repo): void
  aoTirarPasta(repoId: string): Promise<void>
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

function BotoesAbrir(p: { desligado: boolean; aoAbrir(tipo: TipoQuadro): void }): React.JSX.Element {
  return (
    <div className="novo-botoes">
      <button className="botao-principal" disabled={p.desligado} onClick={() => p.aoAbrir('agente')}>
        Abrir agente
      </button>
      <button className="botao-pequeno" disabled={p.desligado} onClick={() => p.aoAbrir('terminal')}>
        Abrir terminal
      </button>
    </div>
  )
}

/**
 * "Novo quadro" (T5.3, D14): conta + pasta no mesmo gesto. Unica forma de abrir um quadro;
 * chega pelo botao "+ Novo quadro", duplo clique na lousa ou arrastando o cartao da conta.
 */
export function NovoQuadro(props: Props): React.JSX.Element {
  const { perfis, repos, perfilInicial, tela, aoCriar, aoNovaPasta, aoTirarPasta, aoCancelar } = props
  // Sem conta marcada: a ultima usada na pasta mais recente.
  const [perfilId, setPerfilId] = useState(
    perfilInicial ?? repos[repos.length - 1]?.perfilPadraoId ?? perfis[0]?.id ?? '',
  )
  const [escolhida, setRepoId] = useState<string | null>(() => pastaSugerida(repos, perfilId))
  // A pasta marcada pode ter sido tirada da lista: volta para a sugerida.
  const repoId = repos.some((r) => r.id === escolhida) ? escolhida : pastaSugerida(repos, perfilId)
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
        <p className="novo-rotulo">Conta · quem paga</p>
        <ChipsConta perfis={perfis} marcada={perfilId} aoMarcar={setPerfilId} />
        <p className="novo-rotulo">Pasta · onde o trabalho fica</p>
        {repos.length > 0 && (
          <PastasRecentes
            repos={repos}
            marcada={repoId}
            aoMarcar={setRepoId}
            aoTirar={(id) =>
              aoTirarPasta(id).catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)))
            }
          />
        )}
        <button className="botao-pequeno" onClick={() => void outraPasta()}>
          {repos.length > 0 ? 'Outra pasta…' : 'Escolher pasta…'}
        </button>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <BotoesAbrir desligado={!repoId || ocupado} aoAbrir={(tipo) => void abrir(tipo)} />
      </div>
    </>
  )
}
