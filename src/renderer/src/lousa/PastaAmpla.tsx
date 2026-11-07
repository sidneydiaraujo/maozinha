// R2.10: a pasta e a do usuario (ou acima dela)? Um agente ali enxerga tudo, inclusive as pastas das
// contas. Quem responde e o main (a tela nao sabe qual e a pasta do usuario); a resposta fica guardada
// por pasta, porque cada quadro pergunta ao montar.
import { useEffect, useState } from 'react'

const respostas = new Map<string, Promise<boolean>>()

function perguntar(repoId: string): Promise<boolean> {
  let resposta = respostas.get(repoId)
  if (!resposta) {
    resposta = window.lousa.repos.pastaAmpla(repoId).catch(() => false)
    respostas.set(repoId, resposta)
  }
  return resposta
}

/** Enquanto o main nao respondeu (ou sem pasta), nao avisa. */
function usePastaAmpla(repoId: string | null): boolean {
  const [resposta, setResposta] = useState<{ repoId: string; sim: boolean } | null>(null)
  useEffect(() => {
    if (!repoId) return
    let valendo = true
    void perguntar(repoId).then((sim) => valendo && setResposta({ repoId, sim }))
    return () => {
      valendo = false
    }
  }, [repoId])
  return resposta?.repoId === repoId && resposta.sim
}

const AVISO =
  'Esta é a sua pasta de usuário (ou acima dela): um agente aqui enxerga tudo, inclusive as pastas das contas. Prefira a pasta de um projeto.'

/** No Novo quadro, logo abaixo das pastas. */
export function AvisoPastaAmpla({ repoId }: { repoId: string | null }): React.JSX.Element | null {
  if (!usePastaAmpla(repoId)) return null
  return (
    <p className="novo-aviso-ampla" role="note">
      ⚠ {AVISO}
    </p>
  )
}

/** No cabecalho do agente, ao lado do nome da pasta. */
export function SinalPastaAmpla({ repoId }: { repoId: string | null }): React.JSX.Element | null {
  if (!usePastaAmpla(repoId)) return null
  return (
    <span className="quadro-pasta-ampla" title={AVISO} aria-label={AVISO}>
      {' '}
      ⚠
    </span>
  )
}
