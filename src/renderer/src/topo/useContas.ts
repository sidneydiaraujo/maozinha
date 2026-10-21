// Contas da barra de cima e do painel da engrenagem (T7.2): uma lista so, lida uma vez.
import { useCallback, useEffect, useState } from 'react'
import type { GitDaConta, PerfilComConta, Provedor, StatusConta } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'

export interface Contas {
  perfis: PerfilComConta[] | null // null = lendo
  erro: string | null
  renomear(perfil: PerfilComConta, nome: string): Promise<void>
  atualizar(perfil: PerfilComConta): Promise<void>
  /** C1, D42: lanca a mensagem do main ("E-mail inválido") para o formulario mostrar. */
  definirGit(perfil: PerfilComConta, git: GitDaConta | null): Promise<void>
  entrou(perfil: PerfilComConta, conta: StatusConta): void
  /** T1.8: lanca a mensagem do main ("Nome reservado"…) para a janela mostrar. */
  criar(provedor: Provedor, nome: string): Promise<void>
}

/** Duas contas com o mesmo e-mail quase sempre e o login ter caido na conta errada do navegador. */
export function avisoDeEmail(perfil: PerfilComConta, todos: PerfilComConta[]): string | undefined {
  const email = perfil.conta.email?.toLowerCase()
  if (!email) return undefined
  const outra = todos.find((p) => p.id !== perfil.id && p.conta.email?.toLowerCase() === email)
  return outra
    ? `Mesmo e-mail da conta ${outra.nome}. Se não era para ser, entre de novo numa janela anônima.`
    : undefined
}

/** `aoMudar` avisa a lousa que algo das contas mudou (nome, login, conta nova). */
export function useContas(aoMudar: () => void): Contas {
  const [perfis, setPerfis] = useState<PerfilComConta[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    window.lousa.perfis
      .listar()
      .then((lista) => ativo && setPerfis(lista))
      .catch((e: unknown) => ativo && setErro(mensagemDe(e)))
    return () => {
      ativo = false
    }
  }, [])

  const trocar = useCallback((nova: PerfilComConta) => {
    setPerfis((atual) => atual?.map((p) => (p.id === nova.id ? nova : p)) ?? null)
  }, [])

  const renomear = useCallback(
    async (perfil: PerfilComConta, nome: string) => {
      trocar(await window.lousa.perfis.renomear(perfil.id, nome))
      aoMudar()
    },
    [trocar, aoMudar],
  )

  const atualizar = useCallback(
    async (perfil: PerfilComConta) => trocar({ ...perfil, conta: await window.lousa.perfis.atualizarConta(perfil.id) }),
    [trocar],
  )

  const definirGit = useCallback(
    async (perfil: PerfilComConta, git: GitDaConta | null) => trocar(await window.lousa.perfis.definirGit(perfil.id, git)),
    [trocar],
  )

  const entrou = useCallback(
    (perfil: PerfilComConta, conta: StatusConta) => {
      trocar({ ...perfil, conta })
      aoMudar()
    },
    [trocar, aoMudar],
  )

  const criar = useCallback(
    async (provedor: Provedor, nome: string) => {
      const nova = await window.lousa.perfis.criar(provedor, nome)
      setPerfis((atual) => [...(atual ?? []), nova])
      aoMudar()
    },
    [aoMudar],
  )

  return { perfis, erro, renomear, atualizar, definirGit, entrou, criar }
}
