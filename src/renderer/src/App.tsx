import { useEffect, useState } from 'react'
import type { AppInfo } from '../../shared/ipc'

export function App(): React.JSX.Element {
  const [info, setInfo] = useState<AppInfo | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    window.lousa
      .appInfo()
      .then(setInfo)
      .catch((e: unknown) => setErro(e instanceof Error ? e.message : String(e)))
  }, [])

  return (
    <main className="esqueleto">
      <h1>Lousa.ia</h1>
      {info && (
        <p>
          versão {info.version} · Electron {info.electron} · {info.platform}
        </p>
      )}
      {erro && <p role="alert">Falha ao falar com o processo principal: {erro}</p>}
      <p className="dica">Esqueleto pronto. O plano de construção está em docs/ESTADO.md.</p>
    </main>
  )
}
