import { useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'
import { BarraContas } from './componentes/BarraContas'
import { Lousa } from './lousa/Lousa'

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [versaoLousa, setVersaoLousa] = useState(0)
  const [versaoPastas, setVersaoPastas] = useState(0)
  const [pedido, setPedido] = useState<{ perfilId: string; vez: number } | null>(null)

  useEffect(() => {
    window.lousa
      .appInfo()
      .then(setInfo)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)))
  }, [])

  // O `npm run smoke` procura "Electron <versao>" neste rodape: mantenha o texto.
  const rodape = info ? `v${info.version} · Electron ${info.electron}` : ''
  return (
    <div className="app">
      <BarraContas
        rodape={rodape}
        versaoPastas={versaoPastas}
        aoMudar={() => setVersaoLousa((v) => v + 1)}
        aoAbrir={(perfilId) => setPedido((p) => ({ perfilId, vez: (p?.vez ?? 0) + 1 }))}
      />
      <main className="area-lousa">
        {erro && <p role="alert">Falha ao falar com o processo principal: {erro}</p>}
        <Lousa versao={versaoLousa} pedido={pedido} aoMudarPastas={() => setVersaoPastas((v) => v + 1)} />
      </main>
    </div>
  )
}
