import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PerfilComConta, Repo } from '../../../shared/model'

interface Props {
  repo: Repo
  perfis: PerfilComConta[]
  aoMudarPadrao(perfilId: string): void
  aoRemover(): void
}

function ConfirmarRemocao({ aoConfirmar, aoCancelar }: { aoConfirmar(): void; aoCancelar(): void }): React.JSX.Element {
  return (
    <div className="menu-repo-confirma">
      <p>Fecha os terminais deste repositório e tira ele da lousa. Os arquivos da pasta não são apagados.</p>
      <button className="botao-pequeno perigo" onClick={aoConfirmar}>
        Remover da lousa
      </button>
      <button className="botao-pequeno" onClick={aoCancelar}>
        Cancelar
      </button>
    </div>
  )
}

/**
 * Menu "⋯" da moldura (T3.6). "Conta padrao" so vale para os quadros NOVOS; remover
 * fecha os terminais do repo e tira a moldura, mas nunca mexe nos arquivos da pasta.
 */
export function MenuRepo({ repo, perfis, aoMudarPadrao, aoRemover }: Props): React.JSX.Element {
  const [aberto, setAberto] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const botao = useRef<HTMLButtonElement>(null)
  // Portal + posicao fixa: os quadros do canvas ficam por cima da moldura e escondiam o menu.
  const canto = botao.current?.getBoundingClientRect()

  const fechar = (): void => {
    setAberto(false)
    setConfirmando(false)
  }

  return (
    <span className="menu-repo nodrag">
      <button
        ref={botao}
        className="botao-pequeno seta"
        aria-label="Mais ações do repositório"
        aria-expanded={aberto}
        onClick={() => (aberto ? fechar() : setAberto(true))}
      >
        ⋯
      </button>
      {aberto &&
        canto &&
        createPortal(
          <div
            className="menu-repo-lista"
            role="menu"
            style={{
              top: canto.bottom + 4,
              left: Math.max(8, canto.right - 260),
            }}
          >
            <p className="menu-repo-titulo">Conta padrão (só quadros novos)</p>
            {perfis.map((p) => (
              <button
                key={p.id}
                role="menuitemradio"
                aria-checked={p.id === repo.perfilPadraoId}
                className="botao-pequeno chip-conta"
                style={{ '--cor': p.cor } as React.CSSProperties}
                onClick={() => {
                  if (p.id !== repo.perfilPadraoId) aoMudarPadrao(p.id)
                  fechar()
                }}
              >
                {p.id === repo.perfilPadraoId ? '✓ ' : ''}
                {p.nome}
              </button>
            ))}
            <hr />
            {confirmando ? (
              <ConfirmarRemocao
                aoConfirmar={() => {
                  fechar()
                  aoRemover()
                }}
                aoCancelar={() => setConfirmando(false)}
              />
            ) : (
              <button className="botao-pequeno perigo" role="menuitem" onClick={() => setConfirmando(true)}>
                Remover repositório…
              </button>
            )}
          </div>,
          document.body,
        )}
    </span>
  )
}
