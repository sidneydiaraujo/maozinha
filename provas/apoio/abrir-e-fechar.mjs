// App de verdade (sem --smoke), com uma pasta de dados de teste: abre, espera e fecha
// como o X da janela (taskkill sem /F = WM_CLOSE). Mostra janela.json e o registro do dia.
// Prova a T8.6 (registros) e a T8.7 (janela lembra tamanho e posicao). Rode 2 ou 3 vezes
// com a mesma pasta: a janela tem de voltar ao mesmo lugar.
// uso: node provas/apoio/abrir-e-fechar.mjs [pasta-de-dados] [segundos]
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const dados = resolve(process.argv[2] ?? join(RAIZ, 'provas', 'saida', 'abrir-e-fechar'))
const segundos = Number(process.argv[3] ?? 12)
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

mkdirSync(dados, { recursive: true })
const exe = join(RAIZ, 'node_modules', 'electron', 'dist', 'electron.exe')
if (!existsSync(join(RAIZ, 'out', 'main'))) {
  console.error('Rode "npx electron-vite build" antes (o app abre o que esta em out/).')
  process.exit(1)
}
const filho = spawn(exe, ['.', `--user-data-dir=${dados}`], { cwd: RAIZ, env, stdio: 'ignore' })
await espera(segundos * 1000)
execFileSync('taskkill', ['/PID', String(filho.pid)], { stdio: 'inherit' })
for (let i = 0; i < 40 && filho.exitCode === null; i++) await espera(250)
console.log('saiu com codigo:', filho.exitCode)
const janela = join(dados, 'janela.json')
console.log('janela.json:', existsSync(janela) ? readFileSync(janela, 'utf8') : '(nao existe)')
const logs = join(dados, 'logs')
for (const nome of existsSync(logs) ? readdirSync(logs) : []) {
  console.log(`--- ${nome}`)
  console.log(readFileSync(join(logs, nome), 'utf8'))
}
