import { useState } from 'react'
import type { Repo } from '../../../shared/model'

interface Props {
  repos: Repo[]
  marcada: string | null
  aoMarcar(repoId: string): void
  /** Tira a pasta da lista: fecha os quadros dela, nunca apaga arquivos. */
  aoTirar(repoId: string): Promise<void>
}

/** Pastas recentes do "Novo quadro" (D14): escolher e tirar ficam no mesmo lugar. */
export function PastasRecentes({ repos, marcada, aoMarcar, aoTirar }: Props): React.JSX.Element {
  const [confirmando, setConfirmando] = useState<string | null>(null)
  return (
    <div className="novo-pastas" role="radiogroup" aria-label="Pasta">
      {[...repos].reverse().map((r) =>
        confirmando === r.id ? (
          <div key={r.id} className="pasta-confirma">
            <p>
              Tirar <strong>{r.nome}</strong> da lista? Os quadros dela fecham; os arquivos ficam.
            </p>
            <button
              className="botao-pequeno perigo"
              onClick={() => {
                setConfirmando(null)
                void aoTirar(r.id)
              }}
            >
              Tirar
            </button>
            <button className="botao-pequeno" onClick={() => setConfirmando(null)}>
              Cancelar
            </button>
          </div>
        ) : (
          <div key={r.id} className="pasta-linha">
            <button
              role="radio"
              aria-checked={r.id === marcada}
              className="pasta-escolha"
              title={r.caminho}
              onClick={() => aoMarcar(r.id)}
            >
              <strong>{r.nome}</strong>
              <span>{r.caminho}</span>
            </button>
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
    </div>
  )
}
