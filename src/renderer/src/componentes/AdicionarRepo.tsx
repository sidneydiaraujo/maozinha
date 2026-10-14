import { useEffect, useRef, useState } from 'react'
import type { PerfilComConta, Repo } from '../../../shared/model'

interface Props {
  caminho: string
  perfis: PerfilComConta[]
  sugestaoPerfilId: string | null
  aoAdicionar(repo: Repo): void
  aoCancelar(): void
}

/** "De qual conta e este repositorio?": um botao grande por conta; Enter confirma a sugerida. */
export function AdicionarRepo({ caminho, perfis, sugestaoPerfilId, aoAdicionar, aoCancelar }: Props): React.JSX.Element {
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const sugerido = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    sugerido.current?.focus()
  }, [])

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') aoCancelar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoCancelar])

  async function escolher(perfilId: string): Promise<void> {
    if (enviando) return
    setEnviando(true)
    setErro(null)
    try {
      aoAdicionar(await window.lousa.repos.adicionar(caminho, perfilId))
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e))
      setEnviando(false)
    }
  }

  return (
    <div className="janela-fundo" role="dialog" aria-modal="true" aria-label="Conta padrão do repositório">
      <div className="janela">
        <h2 className="janela-titulo">Conta padrão deste repositório?</h2>
        <p className="caminho-escolhido">{caminho}</p>
        <p className="apagado">Você pode abrir outras contas neste mesmo repositório depois.</p>
        <div className="escolhas-conta">
          {perfis.map((p) => (
            <button
              key={p.id}
              ref={p.id === sugestaoPerfilId ? sugerido : undefined}
              className={`escolha-conta${p.id === sugestaoPerfilId ? ' sugerida' : ''}`}
              style={{ '--cor': p.cor } as React.CSSProperties}
              disabled={enviando}
              onClick={() => void escolher(p.id)}
            >
              <strong>{p.nome}</strong>
              <span>
                {p.provedor === 'claude' ? 'Claude' : 'Codex'} · {p.conta.email ?? (p.conta.logado ? 'Logado' : 'Sem login')}
              </span>
              {p.id === sugestaoPerfilId && <em>sugerida</em>}
            </button>
          ))}
        </div>
        {erro && (
          <p className="erro" role="alert">
            {erro}
          </p>
        )}
        <button className="botao-pequeno" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
