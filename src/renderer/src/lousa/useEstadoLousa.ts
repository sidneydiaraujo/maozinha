// Estado da lousa na tela (saiu do Lousa.tsx no R4.23): carrega do main, guarda as acoes dos quadros
// (fechar, trocar de conta, papel, ＋ ao lado, kanban), os avisos que somem sozinhos e avisa a lateral.
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { EstadoTela, Ligacao, Quadro, Repo } from '../../../shared/model'
import { mensagemDe } from '../componentes/erro'
import { semQuadro, textoDoFim } from './copia'
import { aoPedirExcluirColega } from './foco'
import { comContaTrocada } from './linhas'
import type { AcoesLousa } from './nos'
import { comQuadroNovo } from './useNovoQuadro'

/** O quadro "nesta pasta, fora do time" (A20) nasce logo embaixo de quem o abriu. */
const FOLGA_AO_LADO = 40

type AoMudarPastas = (repos: Repo[], quadros: Quadro[], ligacoes: Ligacao[]) => void

type ExtrasEstado = Pick<AcoesLousa, 'abrirArquivo' | 'ampliar'> & { aoMudarPastas: AoMudarPastas }

export function useEstadoLousa(versao: number, extras: ExtrasEstado) {
  const { abrirArquivo, ampliar } = extras
  const [estado, setEstado] = useState<EstadoTela | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    let ativo = true
    window.lousa.lousa
      .carregar()
      .then((e) => ativo && setEstado(e))
      .catch((e: unknown) => ativo && setErro(e instanceof Error ? e.message : String(e)))
    return () => {
      ativo = false
    }
  }, [versao])
  useAvisarPastas(estado, extras.aoMudarPastas)
  // erro de uma acao some sozinho (ou no clique); o de carregar a lousa fica
  const [falha, setFalha] = useAvisoPassageiro()
  const falhou = useCallback((e: unknown) => setFalha(mensagemDe(e)), [setFalha])
  const [aviso, setAviso] = useAvisoPassageiro()
  const acoes = useMemo<AcoesLousa>(
    () => ({
      removerQuadro: (quadroId) => {
        window.lousa.quadros
          .remover(quadroId)
          .then((fim) => {
            setEstado((e) => e && semQuadro(e, quadroId, fim))
            setAviso(textoDoFim(fim))
          })
          .catch(falhou)
      },
      // Erro aqui aparece no menu da conta (quem chamou), nao no topo da lousa.
      trocarConta: async (quadroId, perfilId) => {
        const novo = await window.lousa.quadros.trocarConta(quadroId, perfilId)
        setEstado((e) => e && comContaTrocada(e, novo))
      },
      abrirArquivo,
      ampliar,
      definirPapel: async (quadroId, papel) => {
        const novo = await window.lousa.quadros.definirPapel(quadroId, papel)
        setEstado((e) => e && comContaTrocada(e, novo))
      },
      abrirAoLado: async (quadro, tipo) => {
        const posicao = { x: quadro.caixa.x, y: quadro.caixa.y + quadro.caixa.altura + FOLGA_AO_LADO }
        const criado = await window.lousa.quadros.criar(quadro.repoId, tipo, quadro.perfilId, {
          posicao,
          separado: false,
          // o quadro livre segue o kanban do projeto como o quadro de onde saiu (A22)
          ...(quadro.kanban === undefined ? {} : { kanban: quadro.kanban }),
        })
        setEstado((e) => e && comQuadroNovo(e, criado.quadro, null))
      },
      ligarKanban: async (quadroId, ligado) => {
        const quando = await window.lousa.agentes.ajustar(quadroId, { kanban: ligado })
        // o ＋ e o botao leem o quadro da tela: ele fica sabendo da escolha (A24)
        setEstado(
          (e) => e && { ...e, quadros: e.quadros.map((q) => (q.id === quadroId ? { ...q, kanban: ligado } : q)) },
        )
        return quando
      },
    }),
    [falhou, abrirArquivo, ampliar, setAviso],
  )
  const tirarPasta = useCallback(
    async (repoId: string) => {
      const fim = await window.lousa.repos.remover(repoId)
      setEstado((e) =>
        e
          ? { ...e, repos: e.repos.filter((r) => r.id !== repoId), quadros: e.quadros.filter((q) => q.repoId !== repoId) }
          : e,
      )
      setAviso(textoDoFim(fim))
    },
    [setAviso],
  )
  // "excluir" na linha de um colega livre (09/11): fecha como o × do quadro
  useEffect(() => aoPedirExcluirColega((id) => acoes.removerQuadro(id)), [acoes])
  return { estado, setEstado, erro: erro ?? falha, limparErro: () => setFalha(null), aviso, setAviso, falhou, acoes, tirarPasta }
}

/** Frase que some sozinha depois de alguns segundos (ex.: o que aconteceu com a copia, D18). */
function useAvisoPassageiro(): [string | null, (texto: string | null) => void] {
  const [aviso, setAviso] = useState<string | null>(null)
  useEffect(() => {
    if (!aviso) return
    const t = window.setTimeout(() => setAviso(null), 10000)
    return () => window.clearTimeout(t)
  }, [aviso])
  return [aviso, setAviso]
}

/** A lateral (T7.3) acompanha as pastas e os quadros da lousa. */
function useAvisarPastas(estado: EstadoTela | null, aoMudarPastas: AoMudarPastas): void {
  const repos = estado?.repos
  const quadros = estado?.quadros
  const ligacoes = estado?.ligacoes
  useEffect(() => {
    if (repos && quadros) aoMudarPastas(repos, quadros, ligacoes ?? [])
  }, [repos, quadros, ligacoes, aoMudarPastas])
}
