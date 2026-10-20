// Uso da sessao (5 h) e da semana de cada conta Claude (T20.2): duas barras finas sob o icone e as
// linhas no balao. O dado vem dos agentes da conta (T20.1); uma inscricao so, fora do React.
import { useEffect, useState, useSyncExternalStore } from 'react'
import type { UsoConta } from '../../../shared/model'
import { vistaDoUso, type VistaUso } from './uso'

let mapa: ReadonlyMap<string, UsoConta> = new Map()
const ouvintes = new Set<() => void>()
let inscrito = false

function guardar(uso: UsoConta): void {
  const atual = mapa.get(uso.perfilId)
  if (atual && atual.quando > uso.quando) return
  mapa = new Map(mapa).set(uso.perfilId, uso)
  for (const ouvinte of ouvintes) ouvinte()
}

function inscrever(ouvinte: () => void): () => void {
  if (!inscrito) {
    inscrito = true
    window.lousa.perfis.aoUso(guardar)
    window.lousa.perfis
      .uso()
      .then((lista) => lista.forEach(guardar))
      .catch(() => {
        // sem uso: as barras so nao aparecem
      })
  }
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

/** Redesenha de tempos em tempos: "zera em", "visto há" e o 0% de quem ja zerou andam sozinhos. */
function useTique(ms = 30_000): void {
  const [, setTique] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTique((t) => t + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}

export function useUsoConta(perfilId: string): VistaUso | null {
  const uso = useSyncExternalStore(inscrever, () => mapa).get(perfilId)
  useTique()
  // a hora de agora, nao a do ultimo tique: o dado que acabou de chegar tambem conta certo
  return vistaDoUso(uso, Date.now())
}

export function BarrasUso({ vista }: { vista: VistaUso }): React.JSX.Element {
  return (
    <span className={`uso-barras${vista.velho ? ' uso-velho' : ''}`} aria-hidden="true">
      {vista.barras.map((b) => (
        <span key={b.nome} className="uso-barra">
          <span className={`uso-cheio uso-${b.nivel}`} style={{ width: `${b.usado}%` }} />
        </span>
      ))}
    </span>
  )
}

export function UsoNoBalao({ vista }: { vista: VistaUso | null }): React.JSX.Element {
  return (
    <div className={`uso-balao${vista?.velho ? ' uso-velho' : ''}`}>
      {vista ? (
        <>
          {vista.linhas.map((l) => (
            <div key={l}>{l}</div>
          ))}
          <div className="apagado">{vista.visto}</div>
        </>
      ) : (
        <div className="apagado">Uso: sem dado ainda (aparece quando um agente desta conta responder)</div>
      )}
    </div>
  )
}
