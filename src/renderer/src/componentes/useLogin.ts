import { useCallback, useEffect, useRef, useState } from 'react'
import type { StatusConta } from '../../../shared/model'
import { extrairLink, ultimasLinhas, viuNavegador } from './login'

/** abrindo -> navegador -> conferindo -> pronto | falhou. */
export type FaseLogin = 'abrindo' | 'navegador' | 'conferindo' | 'pronto' | 'falhou'

export interface EstadoLogin {
  fase: FaseLogin
  link: string | null
  conta: StatusConta | null
  detalhe: string
}

// Largo para o link de login caber quase inteiro numa linha (o terminal nao aparece).
const COLUNAS = 500
const LINHAS = 40
const LIMITE_SAIDA = 50_000
const INICIAL: EstadoLogin = { fase: 'abrindo', link: null, conta: null, detalhe: '' }

/**
 * Roda o login da conta num terminal escondido (T6.4). Cada tentativa fecha o terminal de
 * login anterior e comeca limpa; o fim vem do codigo de saida (`exit $LASTEXITCODE`).
 */
export function useLogin(perfilId: string, ativo: boolean, aoConcluir: (conta: StatusConta) => void) {
  const [estado, setEstado] = useState<EstadoLogin>(INICIAL)
  const [tentativa, setTentativa] = useState(0)
  const saida = useRef('')
  const aoConcluirAtual = useRef(aoConcluir)
  aoConcluirAtual.current = aoConcluir
  const terminalId = `login:${perfilId}`

  useEffect(() => {
    if (!ativo) return
    let vivo = true
    saida.current = ''
    setEstado(INICIAL)
    const cancelarDados = window.lousa.terminais.aoDados((id, dados) => {
      if (!vivo || id !== terminalId) return
      saida.current = (saida.current + dados).slice(-LIMITE_SAIDA)
      const link = extrairLink(saida.current)
      const abriu = viuNavegador(saida.current)
      setEstado((e) => (e.fase === 'abrindo' && abriu ? { ...e, fase: 'navegador', link } : link ? { ...e, link } : e))
    })
    const cancelarSaida = window.lousa.terminais.aoSair((id, codigo) => {
      if (!vivo || id !== terminalId) return
      setEstado((e) => ({ ...e, fase: 'conferindo' }))
      window.lousa.perfis
        .atualizarConta(perfilId)
        .then((conta) => {
          if (!vivo) return
          const deuCerto = codigo === 0 && conta.logado
          setEstado((e) => ({
            ...e,
            conta,
            fase: deuCerto ? 'pronto' : 'falhou',
            detalhe: ultimasLinhas(saida.current),
          }))
          aoConcluirAtual.current(conta)
        })
        .catch((e: unknown) => {
          if (vivo) setEstado((s) => ({ ...s, fase: 'falhou', detalhe: e instanceof Error ? e.message : String(e) }))
        })
    })
    window.lousa.terminais
      .fecharLogin(perfilId)
      .then(() => window.lousa.terminais.abrir({ tipo: 'login', perfilId }, COLUNAS, LINHAS))
      .catch((e: unknown) => {
        if (vivo) setEstado((s) => ({ ...s, fase: 'falhou', detalhe: e instanceof Error ? e.message : String(e) }))
      })
    return () => {
      vivo = false
      cancelarDados()
      cancelarSaida()
    }
  }, [ativo, perfilId, terminalId, tentativa])

  const enviarCodigo = useCallback(
    (codigo: string) => void window.lousa.terminais.escrever(terminalId, `${codigo.trim()}\r`),
    [terminalId],
  )
  const tentarDeNovo = useCallback(() => setTentativa((n) => n + 1), [])
  return { ...estado, enviarCodigo, tentarDeNovo }
}
