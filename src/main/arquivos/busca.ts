// Busca de arquivo pelo nome nas pastas da lista (Ctrl+K, T12.1). Anda pelas pastas em largura
// (a raiz primeiro), pula git, dependencias e builds, e para num teto de itens visitados:
// a pasta do usuario inteira (C:\Users\...) nao trava o main.
import type { ItemArquivo, Repo } from '../../shared/model'
import { pontuar } from '../../shared/pontuar'
import { entraNaBusca } from './regras'

export interface AchadoArquivo {
  repoId: string
  relativo: string
}

export interface LimitesBusca {
  visitas: number
  resultados: number
}

const PADRAO: LimitesBusca = { visitas: 20_000, resultados: 30 }

type Listar = (repoId: string, relativo: string) => ItemArquivo[]
type Nota = AchadoArquivo & { nota: number }

/** O nome do arquivo pesa mais que a pasta dele; null = nao combina. */
function notaDe(texto: string, nome: string, relativo: string): number | null {
  const peloNome = pontuar(texto, nome)
  if (peloNome !== null) return peloNome + 50
  return pontuar(texto, relativo)
}

function listarOuNada(listar: Listar, repoId: string, relativo: string): ItemArquivo[] {
  try {
    return listar(repoId, relativo)
  } catch {
    return [] // sem permissao ou sumiu: segue com o resto
  }
}

/** Uma pasta da lista, em largura, ate `teto` itens visitados. */
function andarNoRepo(repoId: string, texto: string, listar: Listar, teto: number): Nota[] {
  const achados: Nota[] = []
  const fila = ['']
  let visitas = 0
  while (fila.length > 0 && visitas < teto) {
    const pasta = fila.shift() as string
    for (const item of listarOuNada(listar, repoId, pasta)) {
      if (++visitas > teto) break // pasta enorme: o teto vale dentro dela tambem
      const relativo = pasta ? `${pasta}/${item.nome}` : item.nome
      if (item.pasta) {
        if (entraNaBusca(item.nome)) fila.push(relativo)
        continue
      }
      const nota = notaDe(texto, item.nome, relativo)
      if (nota !== null) achados.push({ repoId, relativo, nota })
    }
  }
  return achados
}

/** Arquivos (nunca pastas) cujo caminho combina, dos melhores para os piores. */
export function buscarArquivos(repos: Repo[], texto: string, listar: Listar, limites = PADRAO): AchadoArquivo[] {
  if (texto.trim().length < 2 || repos.length === 0) return []
  const teto = Math.max(1, Math.floor(limites.visitas / repos.length))
  return repos
    .flatMap((r) => andarNoRepo(r.id, texto, listar, teto))
    .sort((a, b) => b.nota - a.nota)
    .slice(0, limites.resultados)
    .map(({ repoId, relativo }) => ({ repoId, relativo }))
}
