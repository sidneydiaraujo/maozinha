import { useEffect, useState } from 'react'
import type { Repo } from '../../../shared/model'

interface Props {
  /** Muda quando uma pasta entrou ou saiu: a lista recarrega. */
  versao: number
  /** Uma pasta saiu (e os quadros dela fecharam): a lousa recarrega. */
  aoRemover(): void
}

/**
 * Pastas recentes (T5.3). Entrar pasta e na janelinha "Novo quadro"; aqui so se tira.
 * Tirar fecha os quadros dela e nunca apaga arquivos.
 */
export function ListaPastas({ versao, aoRemover }: Props): React.JSX.Element | null {
  const [repos, setRepos] = useState<Repo[]>([])
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    window.lousa.lousa
      .carregar()
      .then((e) => ativo && setRepos(e.repos))
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [versao])

  async function remover(repoId: string): Promise<void> {
    setConfirmando(null)
    try {
      await window.lousa.repos.remover(repoId)
      setRepos((lista) => lista.filter((r) => r.id !== repoId))
      aoRemover()
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
    }
  }

  if (repos.length === 0) return null
  return (
    <section className="pastas" aria-label="Pastas">
      <h2 className="barra-titulo">Pastas</h2>
      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}
      {[...repos].reverse().map((r) =>
        confirmando === r.id ? (
          <div key={r.id} className="pasta-confirma">
            <p>Fecha os quadros de {r.nome}. Os arquivos não são apagados.</p>
            <button className="botao-pequeno perigo" onClick={() => void remover(r.id)}>
              Tirar
            </button>
            <button className="botao-pequeno" onClick={() => setConfirmando(null)}>
              Cancelar
            </button>
          </div>
        ) : (
          <div key={r.id} className="pasta-item" title={r.caminho}>
            <span>{r.nome}</span>
            <button
              className="botao-fechar"
              aria-label={`Tirar a pasta ${r.nome}`}
              onClick={() => setConfirmando(r.id)}
            >
              ×
            </button>
          </div>
        ),
      )}
    </section>
  )
}
