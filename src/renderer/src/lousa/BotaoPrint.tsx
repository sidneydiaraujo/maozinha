// Botao 📎 "Colar print" no cabecalho do agente (T16.1): o mesmo que Ctrl+V com um print copiado.
// O main so diz se ha imagem; quem cola e o proprio Claude, ao receber o Alt+V (ESC v).
import { useEffect, useState } from 'react'
import { ALT_V } from '../componentes/teclas'

const AVISO_MS = 3000

export function BotaoPrint({ quadroId }: { quadroId: string }): React.JSX.Element {
  const [semPrint, setSemPrint] = useState(false)
  useEffect(() => {
    if (!semPrint) return
    const relogio = setTimeout(() => setSemPrint(false), AVISO_MS)
    return () => clearTimeout(relogio)
  }, [semPrint])

  const colar = async (): Promise<void> => {
    if (await window.lousa.app.temImagem()) await window.lousa.terminais.escrever(quadroId, ALT_V)
    else setSemPrint(true)
  }

  return (
    <span className="botao-print-caixa">
      <button
        className="botao-ampliar botao-print nodrag"
        title="Colar print no agente (o mesmo que Ctrl+V com um print copiado)"
        aria-label="Colar print"
        onClick={() => void colar().catch(() => setSemPrint(true))}
      >
        📎
      </button>
      {semPrint && (
        <span className="aviso-print" role="status">
          Copie um print primeiro (Win+Shift+S)
        </span>
      )}
    </span>
  )
}
