// Linhas visiveis da arvore (T7.3): as pastas abertas entram em cascata, como no VSCode.
import type { ItemArquivo, Repo } from '../../../shared/model'

/** Filhos lidos de uma pasta; ausente = ainda nao lida. */
export type Filhos = ReadonlyMap<string, ItemArquivo[] | 'carregando' | { erro: string }>

export interface Linha {
  repoId: string
  relativo: string // '' na raiz
  nome: string
  pasta: boolean
  nivel: number // 0 = a pasta do repo
  aberta: boolean
  estado?: 'carregando' | 'vazia' | string // so em linhas de aviso
}

export const chavePasta = (repoId: string, relativo: string): string => `${repoId}|${relativo}`

export const juntar = (pai: string, nome: string): string => (pai === '' ? nome : `${pai}/${nome}`)

/** Pasta onde o arquivo mora ('' se esta na raiz). */
export function pastaDe(relativo: string): string {
  const i = relativo.lastIndexOf('/')
  return i < 0 ? '' : relativo.slice(0, i)
}

interface Lidas {
  filhos: Filhos
  abertas: ReadonlySet<string>
}

function filhosDe(repoId: string, relativo: string, nivel: number, lidas: Lidas): Linha[] {
  const { filhos, abertas } = lidas
  const lidos = filhos.get(chavePasta(repoId, relativo))
  const aviso = (estado: string): Linha[] => [
    { repoId, relativo: juntar(relativo, '…'), nome: '', pasta: false, nivel, aberta: false, estado },
  ]
  if (lidos === undefined || lidos === 'carregando') return aviso('carregando')
  if (!Array.isArray(lidos)) return aviso(lidos.erro)
  if (lidos.length === 0) return aviso('vazia')
  return lidos.flatMap((item) => {
    const rel = juntar(relativo, item.nome)
    const aberta = item.pasta && abertas.has(chavePasta(repoId, rel))
    const linha: Linha = { repoId, relativo: rel, nome: item.nome, pasta: item.pasta, nivel, aberta }
    return aberta ? [linha, ...filhosDe(repoId, rel, nivel + 1, lidas)] : [linha]
  })
}

export function linhasVisiveis(repos: Repo[], filhos: Filhos, abertas: ReadonlySet<string>): Linha[] {
  return repos.flatMap((repo) => {
    const aberta = abertas.has(chavePasta(repo.id, ''))
    const raiz: Linha = { repoId: repo.id, relativo: '', nome: repo.nome, pasta: true, nivel: 0, aberta }
    return aberta ? [raiz, ...filhosDe(repo.id, '', 1, { filhos, abertas })] : [raiz]
  })
}
