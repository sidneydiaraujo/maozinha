import { useCallback, useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'
import type { Quadro, Repo } from '../../shared/model'
import { mensagemDe } from './componentes/erro'
import { Lateral } from './lateral/Lateral'
import { Leitor } from './leitor/Leitor'
import { useArquivoAberto } from './leitor/useArquivoAberto'
import { useContarCompactar } from './lousa/useContarCompactar'
import { pedirFoco, pedirNovaNota, pedirNovoQuadro } from './lousa/foco'
import { Lousa } from './lousa/Lousa'
import { mandarAosAlvos } from './lousa/mandar'
import { pedirVista } from './lousa/vistas'
import { Paleta } from './paleta/Paleta'
import { usePaleta } from './paleta/usePaleta'
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
  const paleta = usePaleta()
  useContarCompactar(setErro)

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

  // O `npm run smoke` procura "Sidi v<versao>" na tela: fica no canto da barra de cima (D45).
  // O Electron continua por baixo; a versao dele fica na dica do mouse.
  const versao = info ? `Sidi v${info.version}` : ''
  const motor = info ? `Feito sobre o Electron ${info.electron}` : ''
  return (
    <div className="app">
      <BarraTopo contas={contas} versao={versao} motor={motor} quadros={pastas.quadros} />
      <div className="app-corpo">
        <Lateral
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
      {paleta.aberta && (
        <Paleta
          repos={pastas.repos}
          quadros={pastas.quadros}
          perfis={contas.perfis ?? []}
          aoFechar={paleta.fechar}
          aoEscolher={(item) => {
            paleta.fechar()
            if (item.tipo === 'quadro') pedirFoco(item.quadroId)
            else if (item.tipo === 'pasta') pedirNovoQuadro(item.repoId)
            else if (item.tipo === 'mensagem') void mandarAosAlvos(item.texto)
            else if (item.tipo === 'novaNota') pedirNovaNota()
            else if (item.tipo === 'vista') pedirVista(item.pedido)
            else abrir(item.repoId, item.relativo)
          }}
        />
      )}
    </div>
  )
}
