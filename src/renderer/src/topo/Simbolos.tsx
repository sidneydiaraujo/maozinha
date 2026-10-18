// Desenhos da barra de cima (T7.2). Usam currentColor: a cor vem da conta.
import type { Provedor } from '../../../shared/model'

const RAIOS = [0, 30, 60, 90, 120, 150]
const DENTES = [0, 45, 90, 135, 180, 225, 270, 315]

/** Claude = estrela de raios; Codex = hexagono com miolo. */
export function SimboloProvedor({ provedor }: { provedor: Provedor }): React.JSX.Element {
  if (provedor === 'claude') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          {RAIOS.map((a) => (
            <line key={a} x1="12" y1="3.5" x2="12" y2="20.5" transform={`rotate(${a} 12 12)`} />
          ))}
        </g>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3 L19.8 7.5 V16.5 L12 21 L4.2 16.5 V7.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}

export function Engrenagem(): React.JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <g fill="currentColor">
        {DENTES.map((a) => (
          <rect key={a} x="10.4" y="1.6" width="3.2" height="5" rx="1" transform={`rotate(${a} 12 12)`} />
        ))}
      </g>
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="3" />
    </svg>
  )
}

export function SimboloPasta({ aberta }: { aberta: boolean }): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="simbolo-pasta">
      <path
        d={aberta ? 'M1.5 4h5l1.5 1.5H14.5V7H4L1.5 13V4Z M4 7H15.5L13 13H1.5Z' : 'M1.5 3.5h5L8 5h6.5v8H1.5Z'}
        fill="currentColor"
      />
    </svg>
  )
}

export function SimboloArquivo(): React.JSX.Element {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="simbolo-arquivo">
      <path d="M3.5 1.5h6l3 3v10h-9Z M9.5 1.5v3h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}
