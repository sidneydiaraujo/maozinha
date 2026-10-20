// Prova da T16.0 (D23): como o `claude.exe` de verdade recebe um print por um ConPTY do node-pty.
// ABRE UM CLAUDE DE VERDADE (conta Pessoal, ~/.claude-pessoal) numa pasta de teste vazia. Nao
// manda mensagem nenhuma: so cola na caixa e apaga. Pede o ok do Sidney (dado em 19/10/2026).
// Usa a area de transferencia: guarda o TEXTO que estava nela e devolve no fim.
// Passos: imagem na area -> ESC v (o Alt+V do xterm) -> Ctrl+V cru (\x16) -> caminho do .png
// colado (bracketed paste, como o xterm cola) -> o mesmo caminho digitado letra a letra.
// uso (o node-pty do projeto e o do Electron):
//   set ELECTRON_RUN_AS_NODE=1
//   node_modules\electron\dist\electron.exe provas\apoio\print-claude.mjs <pasta-de-teste> <imagem.png>
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(resolve(AQUI, '..', '..'), 'package.json'))
const pty = require('node-pty')

const [pasta, imagem] = process.argv.slice(2).map((p) => p && resolve(p))
if (!pasta || !imagem || !existsSync(pasta) || !existsSync(imagem)) {
  console.log('uso: print-claude.mjs <pasta-de-teste> <imagem.png>')
  process.exit(2)
}

// Outro programa as vezes segura a area de transferencia por alguns segundos (visto em 19/10):
// cada comando tenta ate 10 vezes, com 1 s entre elas.
async function ps(comando) {
  for (let tentativa = 1; ; tentativa++) {
    try {
      return execFileSync('powershell.exe', ['-NoProfile', '-STA', '-Command', comando], { encoding: 'utf8' })
    } catch (erro) {
      if (tentativa >= 10) throw erro
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}
// o texto vai e volta em base64: acento nao se perde na saida do PowerShell
const textoAntes = (
  await ps('$t = Get-Clipboard -Raw; if ($t) { [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($t)) }')
).trim()
const aspas = (p) => p.replace(/'/g, "''")
await ps(
  'Add-Type -AssemblyName System.Windows.Forms, System.Drawing; ' +
    `[System.Windows.Forms.Clipboard]::SetImage([System.Drawing.Image]::FromFile('${aspas(imagem)}'))`,
)

// Ambiente do zero, como o montarAmbiente da Lousa: lista permitida + so CLAUDE_CONFIG_DIR.
const PERMITIDAS = ['SystemRoot', 'windir', 'ComSpec', 'PATHEXT', 'PATH', 'Path', 'TEMP', 'TMP', 'USERPROFILE',
  'USERNAME', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH', 'ProgramData', 'ProgramFiles',
  'ProgramFiles(x86)', 'CommonProgramFiles', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS']
const env = Object.fromEntries(PERMITIDAS.filter((k) => process.env[k]).map((k) => [k, process.env[k]]))
env.CLAUDE_CONFIG_DIR = join(homedir(), '.claude-pessoal')
env.TERM = 'xterm-256color'
env.COLORTERM = 'truecolor'

const claude = join(homedir(), '.local', 'bin', 'claude.exe')
const filho = pty.spawn(claude, [], { cols: 120, rows: 40, cwd: pasta, env })
let saida = ''
filho.onData((d) => (saida += d))

// tira as sequencias de cor e cursor (CSI, OSC e ESC soltos) para achar o texto da tela
const ESC = '\x1b'
const BEL = '\x07'
const SEQUENCIAS = new RegExp(`${ESC}\\[[0-9;?<>=]*[ -/]*[@-~]|${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)|${ESC}[@-_]`, 'g')
const limpo = () => saida.replace(SEQUENCIAS, '')
const espera = (ms) => new Promise((r) => setTimeout(r, ms))
// O ConPTY desenha "[Image#2]" sem o espaco (pula a coluna com o cursor): conta pelo numero
const anexos = () => new Set([...limpo().matchAll(/\[Image ?#(\d+)\]/g)].map((m) => m[1])).size
async function quieto(ms = 1500, prazo = 30000) {
  const fim = Date.now() + prazo
  let tamanho = -1
  while (Date.now() < fim && tamanho !== saida.length) {
    tamanho = saida.length
    await espera(ms)
  }
}

const r = { versao: null, confiou: false, passos: {} }
await quieto(2500, 40000)
// Pasta nova: o Claude pergunta se confia nela, com a seta em "No, exit". Leva a seta ao "Yes".
const setaNoSim = () => /❯\s*(?:\d\.\s*)?Yes/.test(limpo().slice(-400))
if (/trust/i.test(limpo())) {
  for (const tecla of ['\x1b[B', '\x1b[A', '\x1b[A']) {
    if (setaNoSim()) break
    filho.write(tecla)
    await espera(800)
  }
  r.confiou = setaNoSim()
  if (!r.confiou) {
    filho.kill()
    throw new Error('a seta nao chegou no "Yes" da confianca: nada foi escolhido')
  }
  filho.write('\r')
  await quieto(2000, 30000)
}
r.versao = /Claude Code v?([\d.]+)/.exec(limpo())?.[1] ?? null

// Colar um caminho mostra "Pasting…" e o anexo chega depois de uns 3 s: o passo espera 6 s.
async function passo(nome, dados, ms = 2500) {
  const antes = anexos()
  filho.write(dados)
  await espera(ms)
  await quieto(1000, 10000)
  r.passos[nome] = { anexosNovos: anexos() - antes, ultimo: (limpo().match(/\[Image ?#\d+\][^\r\n]{0,40}/g) ?? []).at(-1) ?? null }
}

await passo('altV (ESC v)', '\x1bv', 6000)
await passo('ctrlV cru (\\x16)', '\x16', 6000)
await passo('caminho colado', `\x1b[200~"${imagem}"\x1b[201~`, 6000)
await passo('caminho digitado', `"${imagem}" `, 6000)

// apaga a caixa e sai sem mandar nada
filho.write('\x15')
await espera(300)
filho.write('\x03')
await espera(400)
filho.write('\x03')
await espera(1500)
try {
  filho.kill()
} catch {
  // ja saiu
}
// SAIDA_TEXTO=<arquivo>: guarda o texto da tela (e-mail mascarado) para entender uma falha
if (process.env.SAIDA_TEXTO) {
  writeFileSync(process.env.SAIDA_TEXTO, limpo().replace(/[\w.+-]+@([\w-]+\.)+\w+/g, (e) => `***@${e.split('@')[1]}`))
}
await ps(
  textoAntes
    ? `Set-Clipboard -Value ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${textoAntes}')))`
    : 'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear()',
)
console.log(JSON.stringify(r, null, 2))
process.exit(0)
