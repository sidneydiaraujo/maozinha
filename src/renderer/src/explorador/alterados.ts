// Arquivos que os terminais mexeram (T7.3). Como a marca do chat do VSCode: um giro
// enquanto o arquivo esta sendo escrito, depois uma marca que sobe para as pastas.

/** chave `${repoId}|${relativo}` -> quando mudou (ms) */
export type Alterados = ReadonlyMap<string, number>

export const ESCREVENDO_MS = 4_000
export const VALIDADE_MS = 30 * 60_000

export type Marca = 'escrevendo' | 'alterado' | null

export const chave = (repoId: string, relativo: string): string => `${repoId}|${relativo}`

export function anotar(atual: Alterados, repoId: string, caminhos: string[], agora: number): Map<string, number> {
  const novo = new Map(atual)
  for (const c of caminhos) novo.set(chave(repoId, c), agora)
  return novo
}

function marcaDe(quando: number | undefined, agora: number): Marca {
  if (quando === undefined) return null
  const idade = agora - quando
  if (idade < ESCREVENDO_MS) return 'escrevendo'
  return idade < VALIDADE_MS ? 'alterado' : null
}

export function marcaDoArquivo(alterados: Alterados, repoId: string, relativo: string, agora: number): Marca {
  return marcaDe(alterados.get(chave(repoId, relativo)), agora)
}

/** A pasta herda a marca mais recente de qualquer arquivo dentro dela ('' = o repo inteiro). */
export function marcaDaPasta(alterados: Alterados, repoId: string, relativo: string, agora: number): Marca {
  const prefixo = relativo === '' ? `${repoId}|` : `${repoId}|${relativo}/`
  let maisRecente: number | undefined
  for (const [k, quando] of alterados) {
    if (k.startsWith(prefixo) && (maisRecente === undefined || quando > maisRecente)) maisRecente = quando
  }
  return marcaDe(maisRecente, agora)
}

export interface Recente {
  repoId: string
  relativo: string
  quando: number
}

/** Os mais novos primeiro, so os que ainda valem. */
export function recentes(alterados: Alterados, agora: number, limite = 8): Recente[] {
  return [...alterados]
    .filter(([, quando]) => agora - quando < VALIDADE_MS)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([k, quando]) => {
      const i = k.indexOf('|')
      return { repoId: k.slice(0, i), relativo: k.slice(i + 1), quando }
    })
}

/** Tira o que ja venceu, para o mapa nao crescer o dia todo. */
export function limpar(alterados: Alterados, agora: number): Map<string, number> {
  return new Map([...alterados].filter(([, quando]) => agora - quando < VALIDADE_MS))
}

export function haQuanto(quando: number, agora: number): string {
  const s = Math.max(0, Math.floor((agora - quando) / 1000))
  if (s < 10) return 'agora'
  if (s < 60) return `há ${s} s`
  return `há ${Math.floor(s / 60)} min`
}
