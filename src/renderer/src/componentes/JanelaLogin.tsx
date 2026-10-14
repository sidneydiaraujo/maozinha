import { useEffect } from 'react'
import type { PerfilComConta } from '../../../shared/model'
import { Terminal } from './Terminal'

interface Props {
  perfil: PerfilComConta
  /** Chamado quando o login termina: a tela le a conta de novo. */
  aoConcluir(): Promise<void>
  aoFechar(): void
}

const COMO_INSTALAR = {
  claude: 'Instale o Claude Code (https://claude.com/claude-code) e depois clique em "Verificar de novo".',
  codex: 'Instale o Codex com: npm i -g @openai/codex e depois clique em "Verificar de novo".',
} as const

export function JanelaLogin({ perfil, aoConcluir, aoFechar }: Props): React.JSX.Element {
  const semPrograma = perfil.conta.erro?.includes('não encontrado') ?? false

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') aoFechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [aoFechar])

  return (
    <div className="janela-fundo" role="dialog" aria-modal="true" aria-label={`Entrar na conta ${perfil.nome}`}>
      <div className="janela" style={{ '--cor': perfil.cor } as React.CSSProperties}>
        <h2 className="janela-titulo">Entrar na conta {perfil.nome}</h2>
        {semPrograma ? (
          <>
            <p className="erro">{perfil.conta.erro}</p>
            <p>{COMO_INSTALAR[perfil.provedor]}</p>
            <button className="botao-pequeno" onClick={() => void aoConcluir()}>
              Verificar de novo
            </button>
          </>
        ) : (
          <>
            <p className="apagado">O navegador vai abrir para você fazer o login. Volte aqui quando terminar.</p>
            <div className="janela-terminal">
              <Terminal
                alvo={{ tipo: 'login', perfilId: perfil.id }}
                aoSair={() => void aoConcluir().finally(aoFechar)}
              />
            </div>
          </>
        )}
        <button className="botao-pequeno" onClick={aoFechar}>
          Fechar
        </button>
      </div>
    </div>
  )
}
