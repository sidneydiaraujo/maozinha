// R3.14: limpeza das pastas do projeto que so crescem. Em duas semanas, release/ chegou a 2,1 GB
// (todo instalador gerado) e provas/saida/ a 3,2 GB (177 rodadas). Quem chama: `npm run dist`
// (depois do instalador novo) e provas/rodar.mjs (antes da rodada nova).
// uso: node scripts/limpeza.mjs release|provas
import { readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const INSTALADORES_GUARDADOS = 2
export const RODADAS_GUARDADAS = 10

const INSTALADOR = /^.+ Setup (\d+)\.(\d+)\.(\d+)\.exe$/
const RODADA = /^.+-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})$/

/**
 * Os instaladores (e o .blockmap de cada um) alem dos `manter` de versao mais nova, qualquer que
 * seja o nome (Lousa.ia, Salazar, Maozinha). O resto da pasta (win-unpacked, SHA256.txt) fica.
 * @param {string[]} nomes
 * @returns {string[]}
 */
export function instaladoresVelhos(nomes, manter = INSTALADORES_GUARDADOS) {
  const versao = (nome) => {
    const [, a, b, c] = INSTALADOR.exec(nome) ?? []
    return [Number(a), Number(b), Number(c)]
  }
  const maisNovoPrimeiro = (x, y) => {
    const [vx, vy] = [versao(x), versao(y)]
    return vy[0] - vx[0] || vy[1] - vx[1] || vy[2] - vx[2]
  }
  const velhos = nomes.filter((n) => INSTALADOR.test(n)).sort(maisNovoPrimeiro).slice(manter)
  return velhos.flatMap((n) => [n, ...(nomes.includes(`${n}.blockmap`) ? [`${n}.blockmap`] : [])])
}

/**
 * As pastas de rodada (<cenario>-<data>) alem das `manter` mais novas; outra coisa na pasta fica.
 * @param {string[]} nomes
 * @returns {string[]}
 */
export function rodadasVelhas(nomes, manter = RODADAS_GUARDADAS) {
  const quando = (nome) => RODADA.exec(nome)?.[1] ?? ''
  return nomes
    .filter((n) => RODADA.test(n))
    .sort((a, b) => quando(b).localeCompare(quando(a)))
    .slice(manter)
}

/** Apaga cada nome dentro da pasta; o que estiver preso fica para a proxima vez. Junção e apagada sem seguir o destino. */
function apagar(pasta, nomes) {
  let apagados = 0
  for (const nome of nomes) {
    try {
      rmSync(join(pasta, nome), { recursive: true, force: true, maxRetries: 2 })
      apagados++
    } catch (e) {
      console.warn(`limpeza: ${nome} ficou (${e instanceof Error ? e.message : String(e)})`)
    }
  }
  return apagados
}

const listar = (pasta) => {
  try {
    return readdirSync(pasta)
  } catch {
    return [] // pasta ainda nao existe
  }
}

/** @param {'release' | 'provas'} qual @param {number} [manter] */
export function limpar(qual, manter) {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  if (qual === 'release') {
    const pasta = join(raiz, 'release')
    return apagar(pasta, instaladoresVelhos(listar(pasta), manter))
  }
  const pasta = join(raiz, 'provas', 'saida')
  return apagar(pasta, rodadasVelhas(listar(pasta), manter))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const qual = process.argv[2]
  if (qual !== 'release' && qual !== 'provas') {
    console.error('uso: node scripts/limpeza.mjs release|provas')
    process.exit(2)
  }
  const n = limpar(qual)
  if (n > 0) console.log(`limpeza: ${n} ${qual === 'release' ? 'arquivos de instalador antigos' : 'rodadas antigas'} apagados`)
}
