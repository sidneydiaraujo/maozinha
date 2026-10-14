import { useCallback, useEffect, useState } from 'react'
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

/** O terminal de login vive no main: cada tentativa fecha o anterior e comeca limpa. */
function useLoginLimpo(perfilId: string, semPrograma: boolean, aoFechar: () => void) {
  const [tentativa, setTentativa] = useState(0)
  const [pronto, setPronto] = useState(false)

  const reiniciar = useCallback(async () => {
    setPronto(false)
    await window.lousa.terminais.fecharLogin(perfilId)
    setTentativa((n) => n + 1)
    setPronto(true)
  }, [perfilId])

  const fechar = useCallback(() => {
    void window.lousa.terminais.fecharLogin(perfilId).finally(aoFechar)
  }, [perfilId, aoFechar])

  useEffect(() => {
    if (!semPrograma) void reiniciar()
  }, [semPrograma, reiniciar])

  return { tentativa, pronto, reiniciar, fechar }
}

function AvisoContaPadrao({ nome, aoConfirmar }: { nome: string; aoConfirmar(): void }): React.JSX.Element {
  return (
    <>
      <p className="erro">
        <strong>{nome} é a conta padrão do PC.</strong> Ela é a mesma usada pelo VSCode e por qualquer terminal fora da
        Lousa: trocar o login aqui troca nesses lugares também.
      </p>
      <p className="apagado">
        Para entrar com outro e-mail sem mexer neles, use uma conta separada da Lousa (ex.: Pessoal) em vez desta.
      </p>
      <button className="botao-pequeno perigo" onClick={aoConfirmar}>
        Entendi, trocar mesmo assim
      </button>
    </>
  )
}

export function JanelaLogin({ perfil, aoConcluir, aoFechar }: Props): React.JSX.Element {
  const semPrograma = perfil.conta.erro?.includes('não encontrado') ?? false
  // A conta padrao do PC e a mesma do VSCode e de qualquer terminal fora da Lousa: trocar o login
  // dela troca tudo isso. Pede confirmacao antes de abrir o login.
  const [confirmado, setConfirmado] = useState(!(perfil.ehPadrao && perfil.conta.logado))
  const { tentativa, pronto, reiniciar, fechar } = useLoginLimpo(perfil.id, semPrograma || !confirmado, aoFechar)

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [fechar])

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
        ) : !confirmado ? (
          <AvisoContaPadrao nome={perfil.nome} aoConfirmar={() => setConfirmado(true)} />
        ) : (
          <>
            <p className="apagado">
              O navegador abre com a conta que já estiver logada no claude.ai e, se você autorizar, esta conta passa a
              ser ela. Para entrar em <strong>outra</strong> conta, não autorize: copie o link abaixo e abra numa janela
              anônima (ou saia do claude.ai antes). Quando terminar, esta janela fecha sozinha.
            </p>
            <div className="janela-terminal">
              {pronto && (
                <Terminal
                  key={tentativa}
                  alvo={{ tipo: 'login', perfilId: perfil.id }}
                  aoSair={() => void aoConcluir().finally(aoFechar)}
                />
              )}
            </div>
          </>
        )}
        <div className="janela-botoes">
          {!semPrograma && confirmado && (
            <button className="botao-pequeno" onClick={() => void reiniciar()}>
              Tentar de novo
            </button>
          )}
          <button className="botao-pequeno" onClick={fechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
