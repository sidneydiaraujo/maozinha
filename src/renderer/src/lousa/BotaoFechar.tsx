import { useEffect, useState } from 'react'

interface Props {
  rotulo: string
  aoFechar(): void
}

/**
 * O × do quadro pergunta antes de fechar: fechar encerra o terminal e a conversa some da lousa,
 * e um clique errado no cabecalho fazia isso sem aviso. Sem window.confirm: no Electron, depois
 * dele o teclado nao volta para o terminal. Esc cancela.
 */
export function BotaoFechar({ rotulo, aoFechar }: Props): React.JSX.Element {
  const [perguntando, setPerguntando] = useState(false)
  useEffect(() => {
    if (!perguntando) return
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setPerguntando(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [perguntando])

  return (
    <span className="fechar-caixa">
      <button
        className="botao-fechar botao-acao botao-acao-fechar nodrag"
        title="Fechar o quadro"
        aria-label={`Fechar ${rotulo}`}
        aria-expanded={perguntando}
        onClick={() => setPerguntando((p) => !p)}
      >
        ×
      </button>
      {perguntando && (
        <span className="fechar-pergunta nodrag" role="dialog" aria-label="Fechar o quadro">
          <span>Tem certeza que deseja fechar?</span>
          <small className="apagado">O terminal deste quadro será encerrado.</small>
          <span className="fechar-botoes">
            <button className="botao-pequeno botao-perigo" onClick={aoFechar}>
              Fechar
            </button>
            <button className="botao-pequeno" autoFocus onClick={() => setPerguntando(false)}>
              Cancelar
            </button>
          </span>
        </span>
      )}
    </span>
  )
}
