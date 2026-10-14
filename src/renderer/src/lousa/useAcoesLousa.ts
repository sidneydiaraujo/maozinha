import { useMemo, type Dispatch, type SetStateAction } from 'react'
import type { EstadoTela, TipoQuadro } from '../../../shared/model'
import type { AcoesLousa } from './nos'

/** As acoes dos botoes da lousa: chamam o main e, se deu certo, atualizam o estado da tela. */
export function useAcoesLousa(
  setEstado: Dispatch<SetStateAction<EstadoTela | null>>,
  setErro: (mensagem: string | null) => void,
): AcoesLousa {
  return useMemo<AcoesLousa>(() => {
    const falhou = (e: unknown): void => setErro(e instanceof Error ? e.message : String(e))
    const alterar = (mudar: (e: EstadoTela) => EstadoTela): void => setEstado((e) => (e ? mudar(e) : e))
    const tentar = (chamada: Promise<unknown>, aoDarCerto: () => void): void => {
      setErro(null)
      chamada.then(aoDarCerto).catch(falhou)
    }
    return {
      criarQuadro: (repoId: string, tipo: TipoQuadro, perfilId?: string) => {
        setErro(null)
        window.lousa.quadros
          .criar(repoId, tipo, perfilId)
          .then((q) => alterar((e) => ({ ...e, quadros: [...e.quadros, q] })))
          .catch(falhou)
      },
      removerQuadro: (quadroId: string) =>
        tentar(window.lousa.quadros.remover(quadroId), () =>
          alterar((e) => ({ ...e, quadros: e.quadros.filter((q) => q.id !== quadroId) })),
        ),
      mudarPerfilPadrao: (repoId: string, perfilId: string) => {
        setErro(null)
        window.lousa.repos
          .mudarPerfilPadrao(repoId, perfilId)
          .then((novo) => alterar((e) => ({ ...e, repos: e.repos.map((r) => (r.id === novo.id ? novo : r)) })))
          .catch(falhou)
      },
      removerRepo: (repoId: string) =>
        tentar(window.lousa.repos.remover(repoId), () =>
          alterar((e) => ({
            ...e,
            repos: e.repos.filter((r) => r.id !== repoId),
            quadros: e.quadros.filter((q) => q.repoId !== repoId),
          })),
        ),
    }
  }, [setEstado, setErro])
}
