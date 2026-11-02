// Fila de prontos (A26): agentes que terminaram o trabalho e o Sidney ainda nao foi ver. Num time,
// so o lider (quem nao recebe trabalho de ninguem) entra, e so quando ninguem do time trabalha mais.
// Funcoes puras.
import type { Ligacao, Quadro, Repo } from '../../../shared/model'
import { timeDe } from '../../../shared/time'
import type { MapaAtencao } from '../lousa/atencao'

export interface ItemPronto {
  quadroId: string
  /** O papel no time, senao o titulo ("Claude 3"). */
  nome: string
  /** A pasta (o projeto); numa copia, a pasta original. */
  projeto: string
  /** Agentes no time alem do lider; 0 = sozinho. */
  colegas: number
  quando: number
}

export interface DadosProntos {
  quadros: Quadro[]
  repos: Repo[]
  ligacoes: Ligacao[]
}

function projetoDe(repos: Repo[], repoId: string): string {
  const repo = repos.find((r) => r.id === repoId)
  if (!repo) return ''
  const origem = repo.copia ? repos.find((r) => r.id === repo.copia?.origemId) : undefined
  return (origem ?? repo).nome
}

/** Os prontos na ordem em que terminaram (o mais antigo primeiro); empate, a ordem da lousa. */
export function filaDeProntos(mapa: MapaAtencao, dados: DadosProntos): ItemPronto[] {
  const ids = new Set(dados.quadros.map((q) => q.id))
  const ligacoes = dados.ligacoes.filter((l) => ids.has(l.de) && ids.has(l.para))
  const itens: ItemPronto[] = []
  for (const q of dados.quadros) {
    const a = mapa.get(q.id)
    if (!a || a.visto || a.aviso.estado !== 'terminou') continue
    if (ligacoes.some((l) => l.para === q.id)) continue // membro: quem avisa e o lider
    const time = timeDe(ligacoes, q.id)
    if (time.some((id) => mapa.get(id)?.aviso.estado === 'trabalhando')) continue // o time segue
    itens.push({
      quadroId: q.id,
      nome: q.papel || q.titulo,
      projeto: projetoDe(dados.repos, q.repoId),
      colegas: time.length - 1,
      quando: a.quando,
    })
  }
  return itens.sort((x, y) => x.quando - y.quando)
}

/** "agora", "há 5 min", "há 2 h". */
export function haQuanto(quando: number, agora: number): string {
  const minutos = Math.floor(Math.max(0, agora - quando) / 60_000)
  if (minutos < 1) return 'agora'
  if (minutos < 60) return `há ${minutos} min`
  return `há ${Math.floor(minutos / 60)} h`
}

/** Texto do botao: "1 pronto", "3 prontos". */
export const textoDosProntos = (n: number): string => `${n} ${n === 1 ? 'pronto' : 'prontos'}`
