// Lateral do app (D48): abas "Pastas" (arvore, T7.3) e "Historico" (terminais da sessao).
// As duas ficam montadas; a escondida continua acompanhando.
import { useState } from 'react'
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import { Explorador, type Selecao } from '../explorador/Explorador'
import { AbasLateral, type AbaLateral } from './AbasLateral'
import { Historico } from './Historico'

interface Props {
  repos: Repo[]
  quadros: Quadro[]
  perfis: PerfilComConta[]
  selecionado: Selecao | null
  aviso: string | null
  aoAbrir(repoId: string, relativo: string): void
}

export function Lateral(p: Props): React.JSX.Element {
  const [aba, setAba] = useState<AbaLateral>('pastas')
  const abas = <AbasLateral aba={aba} aoTrocar={setAba} />
  return (
    <>
      <Explorador {...p} abas={abas} oculto={aba !== 'pastas'} />
      <Historico quadros={p.quadros} repos={p.repos} perfis={p.perfis} abas={abas} oculto={aba !== 'historico'} />
    </>
  )
}
