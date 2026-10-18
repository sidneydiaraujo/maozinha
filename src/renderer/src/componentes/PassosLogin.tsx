import { useState } from 'react'
import type { FaseLogin } from './useLogin'

/** Desenho animado de cada fase: navegador abrindo, esperando, conferindo, ok, falhou. */
export function Animacao({ fase }: { fase: FaseLogin }): React.JSX.Element {
  if (fase === 'pronto' || fase === 'falhou') {
    return (
      <svg className={`login-selo login-selo-${fase}`} viewBox="0 0 52 52" aria-hidden="true">
        <circle className="login-selo-circulo" cx="26" cy="26" r="24" />
        {fase === 'pronto' ? (
          <path className="login-selo-traco" d="M15 27 l7 7 l15 -16" />
        ) : (
          <path className="login-selo-traco" d="M18 18 L34 34 M34 18 L18 34" />
        )}
      </svg>
    )
  }
  return (
    <div className={`login-navegador login-navegador-${fase}`} aria-hidden="true">
      <div className="login-navegador-barra">
        <span />
        <span />
        <span />
      </div>
      <div className="login-navegador-corpo">
        <div className="login-onda" />
      </div>
    </div>
  )
}

/** Para entrar com outro e-mail: o link vai para uma janela anonima e o codigo volta para ca. */
export function OutraConta({ link, aoEnviarCodigo }: { link: string | null; aoEnviarCodigo(c: string): void }) {
  const [copiado, setCopiado] = useState<'sim' | 'falhou' | null>(null)
  const [codigo, setCodigo] = useState('')
  const [enviado, setEnviado] = useState(false)

  async function copiar(): Promise<void> {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopiado('sim')
    } catch {
      setCopiado('falhou')
    }
  }

  return (
    <details className="login-outra">
      <summary>Vai entrar com outro e-mail? Use uma janela anônima</summary>
      <p className="apagado">O navegador entra com a conta que já estiver logada no claude.ai. Para usar outra:</p>
      <ol>
        <li>
          <button className="botao-pequeno" disabled={!link} onClick={() => void copiar()}>
            {copiado === 'sim' ? 'Link copiado ✓' : 'Copiar link'}
          </button>
          {copiado === 'falhou' && link && (
            <input className="login-link" readOnly value={link} onFocus={(e) => e.target.select()} />
          )}
        </li>
        <li>Abra uma janela anônima (Ctrl+Shift+N), cole o link e entre com a conta certa.</li>
        <li>
          Se o site mostrar um código, cole aqui:
          <form
            className="login-codigo"
            onSubmit={(e) => {
              e.preventDefault()
              if (!codigo.trim()) return
              aoEnviarCodigo(codigo)
              setCodigo('')
              setEnviado(true)
            }}
          >
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="código"
              aria-label="Código do login"
              autoComplete="off"
              spellCheck={false}
            />
            <button className="botao-pequeno" disabled={!codigo.trim()}>
              Enviar
            </button>
          </form>
          {enviado && <span className="apagado">Código enviado. Conferindo…</span>}
        </li>
      </ol>
    </details>
  )
}

/** Texto curto de cada fase. */
export const TEXTOS: Record<FaseLogin, { titulo: string; sub: string }> = {
  abrindo: { titulo: 'Abrindo o navegador…', sub: 'Um instante.' },
  navegador: { titulo: 'Autorize no navegador', sub: 'Esta janela confirma sozinha quando você terminar.' },
  conferindo: { titulo: 'Conferindo a conta…', sub: 'Lendo o login que acabou de entrar.' },
  pronto: { titulo: 'Conta conectada', sub: '' },
  falhou: { titulo: 'O login não terminou', sub: 'Nada mudou nesta conta. Tente de novo.' },
}
