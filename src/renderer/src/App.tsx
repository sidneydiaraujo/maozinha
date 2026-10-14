import { useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'
import { BarraContas } from './componentes/BarraContas'

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

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
      <BarraContas rodape={rodape} />
      <main className="area-lousa">
        {erro && <p role="alert">Falha ao falar com o processo principal: {erro}</p>}
        <p className="apagado">A lousa chega na fatia 3</p>
      </main>
    </div>
  )
}
