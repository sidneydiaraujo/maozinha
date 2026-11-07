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

/**
 * Anda numa pasta da lista em largura (a raiz primeiro), pulando git, dependencias e builds, ate
 * `teto` itens visitados. `aoArquivo` recebe cada arquivo; devolver false para a caminhada.
 */
function percorrer(repoId: string, listar: Listar, teto: number, aoArquivo: (relativo: string, nome: string) => boolean): void {
  const fila = ['']
  let visitas = 0
  while (fila.length > 0 && visitas < teto) {
    const pasta = fila.shift() as string
    for (const item of listarOuNada(listar, repoId, pasta)) {
      if (++visitas > teto) return // pasta enorme: o teto vale dentro dela tambem
      const relativo = pasta ? `${pasta}/${item.nome}` : item.nome
      if (!item.pasta) {
        if (!aoArquivo(relativo, item.nome)) return
      } else if (entraNaBusca(item.nome)) fila.push(relativo)
    }
  }
}

/** Uma pasta da lista: os arquivos que combinam, com nota. */
function andarNoRepo(repoId: string, texto: string, listar: Listar, teto: number): Nota[] {
  const achados: Nota[] = []
  percorrer(repoId, listar, teto, (relativo, nome) => {
    const nota = notaDe(texto, nome, relativo)
    if (nota !== null) achados.push({ repoId, relativo, nota })
    return true
  })
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

/**
 * R1.6: o arquivo que o agente citou e nao existe a partir da pasta do quadro ("ESTADO.md" quando
 * ele esta em docs/, "main/x.ts" quando o quadro e a raiz). Procura quem termina com esse caminho,
 * em largura e com o mesmo teto da busca; devolve o relativo so se houver exatamente um.
 */
export function acharUnicoPeloFim(repoId: string, citado: string, listar: Listar, teto = PADRAO.visitas): string | null {
  const fim = citado
    .replace(/\\/g, '/')
    .replace(/^(\.\/)+/, '')
    .toLowerCase()
  if (!fim || fim.startsWith('../')) return null
  const achados: string[] = []
  percorrer(repoId, listar, teto, (relativo) => {
    const baixo = relativo.toLowerCase()
    if (baixo === fim || baixo.endsWith(`/${fim}`)) achados.push(relativo)
    return achados.length < 2 // dois candidatos: nao adivinha
  })
  return achados.length === 1 ? (achados[0] ?? null) : null
}
