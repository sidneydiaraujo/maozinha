import { useCallback, useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'
import type { Quadro, Repo } from '../../shared/model'
import { mensagemDe } from './componentes/erro'
import { Explorador } from './explorador/Explorador'
import { Leitor } from './leitor/Leitor'
import { useArquivoAberto } from './leitor/useArquivoAberto'
import { pedirFoco } from './lousa/foco'
import { Lousa } from './lousa/Lousa'
import { BarraTopo } from './topo/BarraTopo'
import { useContas } from './topo/useContas'

interface Pastas {
  repos: Repo[]
  quadros: Quadro[]
}

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [versaoLousa, setVersaoLousa] = useState(0)
  const [pastas, setPastas] = useState<Pastas>({ repos: [], quadros: [] })
  const contas = useContas(useCallback(() => setVersaoLousa((v) => v + 1), []))
  const arquivo = useArquivoAberto()
  const { aberto, fechar, abrir: abrirArquivo, avisar } = arquivo

  useEffect(() => {
    window.lousa
      .appInfo()
      .then(setInfo)
      .catch((e: unknown) => setErro(mensagemDe(e)))
  }, [])

  // clique na notificacao do Windows (T8.1): a lousa enquadra o quadro
  useEffect(() => window.lousa.quadros.aoFocar(pedirFoco), [])

  // pasta tirada da lista: o leitor de um arquivo dela fecha
  useEffect(() => {
    if (aberto && !pastas.repos.some((r) => r.id === aberto.repoId)) fechar()
  }, [aberto, pastas.repos, fechar])

  const aoMudarPastas = useCallback((repos: Repo[], quadros: Quadro[]) => setPastas({ repos, quadros }), [])
  const abrir = useCallback((repoId: string, relativo: string) => void abrirArquivo(repoId, relativo), [abrirArquivo])

  // O `npm run smoke` procura "Electron <versao>" na tela: fica no canto da barra de cima.
  const versao = info ? `v${info.version} · Electron ${info.electron}` : ''
  return (
    <div className="app">
      <BarraTopo contas={contas} versao={versao} quadros={pastas.quadros} />
      <div className="app-corpo">
        <Explorador
          repos={pastas.repos}
          quadros={pastas.quadros}
          perfis={contas.perfis ?? []}
          selecionado={aberto}
          aviso={arquivo.aviso}
          aoAbrir={abrir}
        />
        {aberto && (
          <Leitor
            key={`${aberto.repoId}|${aberto.relativo}`}
            arquivo={aberto}
            repoNome={pastas.repos.find((r) => r.id === aberto.repoId)?.nome ?? ''}
            aoFechar={fechar}
            aoAbrir={abrir}
            aoAvisar={avisar}
          />
        )}
        <main className="area-lousa">
          {erro && <p role="alert">Falha ao falar com o processo principal: {erro}</p>}
          <Lousa versao={versaoLousa} aoMudarPastas={aoMudarPastas} aoAbrirArquivo={abrir} />
        </main>
      </div>
    </div>
  )
}
