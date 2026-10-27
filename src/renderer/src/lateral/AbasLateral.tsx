// "Pastas | Histórico" no alto da lateral (D48): as duas ficam montadas, so uma aparece.
export type AbaLateral = 'pastas' | 'historico'

const ROTULOS: Record<AbaLateral, string> = { pastas: 'Pastas', historico: 'Histórico' }

export function AbasLateral({ aba, aoTrocar }: { aba: AbaLateral; aoTrocar(aba: AbaLateral): void }): React.JSX.Element {
  return (
    <div className="abas-lateral" role="tablist" aria-label="Lateral">
      {(Object.keys(ROTULOS) as AbaLateral[]).map((a) => (
        <button
          key={a}
          role="tab"
          aria-selected={aba === a}
          className={aba === a ? 'aba-lateral aba-lateral-ativa' : 'aba-lateral'}
          onClick={() => aoTrocar(a)}
        >
          {ROTULOS[a]}
        </button>
      ))}
    </div>
  )
}
