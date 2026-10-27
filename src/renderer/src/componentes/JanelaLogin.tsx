import { useCallback, useEffect, useRef, useState } from 'react'
import type { PerfilComConta, StatusConta } from '../../../shared/model'
import { Animacao, OutraConta, TEXTOS } from './PassosLogin'
import '../estilos/login.css'
import { useLogin } from './useLogin'

interface Props {
  perfil: PerfilComConta
  /** O login terminou (dando certo ou nao): a conta lida de novo. */
  aoConcluir(conta: StatusConta): void
  /** Aviso para o e-mail que entrou (ex.: mesmo e-mail de outra conta). */
  conferirEmail(email: string): string | undefined
  aoFechar(): void
}

const COMO_INSTALAR = {
  claude: 'Instale o Claude Code (https://claude.com/claude-code) e depois clique em "Verificar de novo".',
  codex: 'Instale o Codex com: npm i -g @openai/codex e depois clique em "Verificar de novo".',
} as const

/** Deu certo e nao ha aviso: a janela fecha sozinha depois de mostrar a conta. */
const FECHAR_SOZINHA_MS = 2500

function AvisoContaPadrao({ nome, aoConfirmar }: { nome: string; aoConfirmar(): void }): React.JSX.Element {
  return (
    <>
      <p className="erro">
        <strong>{nome} é a conta padrão do PC.</strong> Ela é a mesma usada pelo VSCode e por qualquer terminal fora do
        Mãozinha: trocar o login aqui troca nesses lugares também.
      </p>
      <p className="apagado">
        Para entrar com outro e-mail sem mexer neles, use uma conta separada da Mãozinha (ex.: Pessoal) em vez desta.
      </p>
      <button className="botao-pequeno perigo" onClick={aoConfirmar}>
        Entendi, trocar mesmo assim
      </button>
    </>
  )
}

function Andamento({ login, aviso }: { login: ReturnType<typeof useLogin>; aviso?: string }): React.JSX.Element {
  const texto = TEXTOS[login.fase]
  return (
    <div className={`login-andamento login-fase-${login.fase}`} aria-live="polite">
      <Animacao fase={login.fase} />
      <p className="login-titulo">{texto.titulo}</p>
      {login.fase === 'pronto' && login.conta ? (
        <p className="login-email">
          {login.conta.email ?? 'Logado'}
          {login.conta.plano && <span className="etiqueta">{login.conta.plano}</span>}
        </p>
      ) : (
        <p className="apagado">{texto.sub}</p>
      )}
      {aviso && (
        <p className="aviso-conta" role="status">
          {aviso}
        </p>
      )}
      {login.fase === 'navegador' && <OutraConta link={login.link} aoEnviarCodigo={login.enviarCodigo} />}
      {login.fase === 'falhou' && login.detalhe && (
        <details className="login-detalhe">
          <summary>Ver detalhes</summary>
          <pre>{login.detalhe}</pre>
        </details>
      )}
    </div>
  )
}

function SemPrograma({ perfil, aoConcluir }: Pick<Props, 'perfil' | 'aoConcluir'>): React.JSX.Element {
  return (
    <>
      <p className="erro">{perfil.conta.erro}</p>
      <p>{COMO_INSTALAR[perfil.provedor]}</p>
      <button
        className="botao-pequeno"
        onClick={() => void window.lousa.perfis.atualizarConta(perfil.id).then(aoConcluir)}
      >
        Verificar de novo
      </button>
    </>
  )
}

function Botoes(p: { pronto: boolean; podeTentar: boolean; aoTentar(): void; aoFechar(): void }): React.JSX.Element {
  return (
    <div className="janela-botoes">
      {p.podeTentar && !p.pronto && (
        <button className="botao-pequeno" onClick={p.aoTentar}>
          Tentar de novo
        </button>
      )}
      <button className="botao-pequeno" onClick={p.aoFechar}>
        {p.pronto ? 'Concluir' : 'Fechar'}
      </button>
    </div>
  )
}

/** Aviso sobre o e-mail que acabou de entrar (ex.: o mesmo de outra conta). */
function avisoDoLogin(login: ReturnType<typeof useLogin>, conferir: Props['conferirEmail']): string | undefined {
  const email = login.fase === 'pronto' ? login.conta?.email : null
  return email ? conferir(email) : undefined
}

/** Fecha pelo Esc e, quando deu certo sem aviso, sozinha depois de mostrar a conta. */
function useFechamento(fechar: () => void, fecharSozinha: boolean): void {
  useEffect(() => {
    if (!fecharSozinha) return
    const relogio = setTimeout(fechar, FECHAR_SOZINHA_MS)
    return () => clearTimeout(relogio)
  }, [fecharSozinha, fechar])

  useEffect(() => {
    const tecla = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [fechar])
}

/** Login sem terminal na tela (T6.4): fases animadas, so "Tentar de novo" e "Fechar". */
export function JanelaLogin({ perfil, aoConcluir, conferirEmail, aoFechar }: Props): React.JSX.Element {
  const semPrograma = perfil.conta.erro?.includes('não encontrado') ?? false
  // A conta padrao do PC e a mesma do VSCode e de qualquer terminal fora da Lousa: trocar o login
  // dela troca tudo isso. Pede confirmacao antes de abrir o login.
  const [confirmado, setConfirmado] = useState(!(perfil.ehPadrao && perfil.conta.logado))
  const login = useLogin(perfil.id, !semPrograma && confirmado, aoConcluir)
  const aviso = avisoDoLogin(login, conferirEmail)
  const aoFecharAtual = useRef(aoFechar)
  aoFecharAtual.current = aoFechar

  const fechar = useCallback(() => {
    void window.lousa.terminais.fecharLogin(perfil.id).finally(() => aoFecharAtual.current())
  }, [perfil.id])
  useFechamento(fechar, login.fase === 'pronto' && !aviso)

  const emAndamento = !semPrograma && confirmado
  return (
    <div className="janela-fundo" role="dialog" aria-modal="true" aria-label={`Entrar na conta ${perfil.nome}`}>
      <div className="janela janela-login" style={{ '--cor': perfil.cor } as React.CSSProperties}>
        <h2 className="janela-titulo">Entrar na conta {perfil.nome}</h2>
        {semPrograma ? (
          <SemPrograma perfil={perfil} aoConcluir={aoConcluir} />
        ) : !confirmado ? (
          <AvisoContaPadrao nome={perfil.nome} aoConfirmar={() => setConfirmado(true)} />
        ) : (
          <Andamento login={login} aviso={aviso} />
        )}
        <Botoes
          pronto={login.fase === 'pronto'}
          podeTentar={emAndamento}
          aoTentar={login.tentarDeNovo}
          aoFechar={fechar}
        />
      </div>
    </div>
  )
}
