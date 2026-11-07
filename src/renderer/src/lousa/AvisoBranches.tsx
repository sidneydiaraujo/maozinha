// R3.16: branches `lousa/*` de copias que ja se foram, ja juntadas na pasta original. A faixa aparece
// uma vez por abertura do app, uma pasta por vez; "Apagar" manda so o id da pasta (o main recalcula
// e usa `git branch -d`, que recusa o que nao foi juntado). "Agora não" esconde ate a proxima abertura.
import { useEffect, useState } from 'react'
import type { BranchesDaPasta } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import '../estilos/aviso-branches.css'

const MOSTRADAS = 3

function descrever(b: string[]): string {
  const resto = b.length - MOSTRADAS
  return b.slice(0, MOSTRADAS).join(', ') + (resto > 0 ? ` e mais ${resto}` : '')
}

export function AvisoBranches(): React.JSX.Element | null {
  const [lista, setLista] = useState<BranchesDaPasta[]>([])
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    let valendo = true
    window.lousa.copias
      .branchesJuntadas()
      .then((l) => valendo && setLista(l))
      .catch(() => undefined) // sem git ou erro: sem faixa
    return () => {
      valendo = false
    }
  }, [])

  const atual = lista[0]
  if (!atual) return null
  const proxima = (): void => {
    setErro(null)
    setLista((l) => l.slice(1))
  }
  const apagar = (): void => {
    setOcupado(true)
    window.lousa.copias
      .apagarBranches(atual.repoId)
      .then(proxima)
      .catch((e: unknown) => setErro(mensagemDe(e)))
      .finally(() => setOcupado(false))
  }
  const n = atual.branches.length
  return (
    <div className="aviso-branches" role="status">
      <span>
        {n === 1 ? '1 branch de cópia antiga já juntada' : `${n} branches de cópias antigas já juntadas`} em{' '}
        <strong>{atual.nome}</strong>: <code>{descrever(atual.branches)}</code>
      </span>
      <button className="botao-pequeno botao-principal" disabled={ocupado} onClick={apagar}>
        Apagar
      </button>
      <button className="botao-pequeno" disabled={ocupado} onClick={proxima}>
        Agora não
      </button>
      {erro && (
        <span className="erro" role="alert">
          {erro}
        </span>
      )}
    </div>
  )
}
