// R3.13 (D62): agente hibernado. O main fechou o claude.exe parado ha 2 h; no lugar do terminal fica
// esta capa. Acordar remonta o terminal: o main abre de novo e o Claude retoma a mesma conversa.
import { useEffect, useState } from 'react'
import type { Quadro } from '../../../shared/model'

/** Dormindo agora? Comeca do salvo (o app aberto de novo nao acorda ninguem) e escuta o main. */
export function useDormindo(quadro: Quadro): { dormindo: boolean; acordar(): void } {
  const [dormindo, setDormindo] = useState(!!quadro.dormindo)
  useEffect(
    () =>
      window.lousa.agentes.aoDormir((id) => {
        if (id === quadro.id) setDormindo(true)
      }),
    [quadro.id],
  )
  return { dormindo, acordar: () => setDormindo(false) }
}

export function CapaDormindo({ aoAcordar }: { aoAcordar(): void }): React.JSX.Element {
  return (
    <div className="quadro-dormindo nodrag" role="status">
      <span className="quadro-dormindo-icone" aria-hidden="true">
        💤
      </span>
      <strong>Dormindo</strong>
      <span>Parado há mais de 2 horas: o agente fechou para liberar memória. A conversa continua de onde parou.</span>
      <button className="botao-pequeno botao-principal" onClick={aoAcordar}>
        Acordar
      </button>
    </div>
  )
}
