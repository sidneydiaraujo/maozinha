// Roda um cenario de prova na janela real da Lousa, escondida (ver provas/README.md).
// uso: node provas/rodar.mjs <cenario> [--sem-build] [opcoes do cenario, ex.: acumular]
// Cada rodada usa uma pasta de dados nova e uma copia nova da pasta de exemplo, em
// provas/saida/<cenario>-<data>/: o estado real e a pasta-demo original nunca mudam.
import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { estadoDe, prepararPastas } from './estados.mjs'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '..')
const PRAZO_MS = 12 * 60_000

const [nome, ...resto] = process.argv.slice(2)
const cenarios = readdirSync(join(AQUI, 'cenarios')).map((a) => a.replace(/\.js$/, ''))
if (!nome || !cenarios.includes(nome)) {
  console.error(`uso: node provas/rodar.mjs <cenario> [--sem-build] [opcoes]\ncenarios: ${cenarios.join(', ')}`)
  process.exit(2)
}

const arquivo = join(AQUI, 'cenarios', `${nome}.js`)
const tipoDeEstado = /^\/\/ estado: (\w+)/m.exec(readFileSync(arquivo, 'utf8'))?.[1] ?? 'demo'
const carimbo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const saida = join(AQUI, 'saida', `${nome}-${carimbo}`)
const dados = join(saida, 'dados')
const pastaDemo = join(saida, 'pasta-demo')

// a pasta de exemplo guarda .git e node_modules com outro nome (o git nao aceita guardar os dois)
cpSync(join(AQUI, 'pasta-demo'), pastaDemo, { recursive: true })
renameSync(join(pastaDemo, '_git'), join(pastaDemo, '.git'))
renameSync(join(pastaDemo, '_node_modules'), join(pastaDemo, 'node_modules'))

mkdirSync(dados, { recursive: true })
const extras = prepararPastas(tipoDeEstado, saida)
const estado = estadoDe(tipoDeEstado, { pastaDemo, casa: homedir(), ...extras })
writeFileSync(join(dados, 'estado.json'), JSON.stringify(estado, null, 2))
const opcoes = resto.filter((o) => o !== '--sem-build')
writeFileSync(join(saida, 'dados.json'), JSON.stringify({ pastaDemo, ...extras, apoio: join(AQUI, 'apoio'), opcoes }))

const rodar = (comando) => spawnSync(comando, { cwd: RAIZ, stdio: 'inherit', shell: true, timeout: PRAZO_MS })
if (!resto.includes('--sem-build') && rodar('npx electron-vite build').status !== 0) process.exit(1)

console.log(`\ncenario ${nome} (estado ${tipoDeEstado}) -> ${saida}`)
const smoke = rodar(
  `node scripts/sem-run-as-node.mjs npx electron . --smoke "--user-data-dir=${dados}" "--cenario=${arquivo}" "--saida=${saida}"`,
)
const resultado = join(saida, 'resultado.json')
console.log(`\n--- resultado (${resultado})`)
console.log(existsSync(resultado) ? readFileSync(resultado, 'utf8') : '(sem resultado: veja o log acima)')
const fotos = readdirSync(saida).filter((a) => a.endsWith('.png'))
if (fotos.length > 0) console.log(`fotos: ${fotos.join(', ')}`)
process.exit(smoke.status ?? 1)
