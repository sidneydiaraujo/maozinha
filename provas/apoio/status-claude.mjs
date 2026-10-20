// Prova da T17.0 (D24): a linha de status (statusLine) do Claude Code como ponte para a Lousa.
//   medir <pasta>  : qual comando grava o stdin num arquivo mais rapido (findstr, PowerShell,
//                    Electron como Node), 15 vezes cada, com um JSON de exemplo. Sem Claude.
//   claude <pasta> : ABRE UM CLAUDE DE VERDADE (conta Pessoal, ~/.claude-pessoal) na <pasta> com
//                    `--settings`, sem mandar mensagem; conta quantas vezes a linha de status
//                    rodou em 25 s, mostra os campos que chegaram (nunca os valores de texto) e
//                    confere que nada mudou na pasta da conta. Pede o ok do Sidney.
// uso: set ELECTRON_RUN_AS_NODE=1
//      node_modules\electron\dist\electron.exe provas\apoio\status-claude.mjs <medir|claude> <pasta>
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const RAIZ = resolve(AQUI, '..', '..')
const [modo, pastaArg] = process.argv.slice(2)
const pasta = pastaArg && resolve(pastaArg)
if (!['medir', 'claude'].includes(modo) || !pasta || !existsSync(pasta)) {
  console.log('uso: status-claude.mjs <medir|claude> <pasta-de-teste>')
  process.exit(2)
}

const EXEMPLO = JSON.stringify({
  model: { id: 'claude-opus-5-5', display_name: 'Opus' },
  effort: { level: 'high' },
  context_window: { used_percentage: 42, context_window_size: 200000 },
  rate_limits: { five_hour: { used_percentage: 12, resets_at: 1792500000 }, seven_day: { used_percentage: 30, resets_at: 1793000000 } },
})
const ELECTRON = join(RAIZ, 'node_modules', 'electron', 'dist', 'electron.exe')
const GRAVAR_JS = join(pasta, 'gravar.cjs')
writeFileSync(GRAVAR_JS, "const f=require('fs');let d='';process.stdin.on('data',c=>d+=c).on('end',()=>f.writeFileSync(process.argv[2],d))")

/** Os comandos candidatos, como o Claude os rodaria (texto de uma linha de comando). */
const comandos = (saida) => ({
  findstr: `cmd /d /c findstr "^" > "${saida}"`,
  powershell: `powershell -NoProfile -NonInteractive -Command "[IO.File]::WriteAllText('${saida}', [Console]::In.ReadToEnd())"`,
  electron: `cmd /d /c "set ELECTRON_RUN_AS_NODE=1&& "${ELECTRON}" "${GRAVAR_JS}" "${saida}""`,
})

function medir() {
  const r = {}
  for (const [nome, comando] of Object.entries(comandos(join(pasta, 'medida.json')))) {
    const tempos = []
    let certo = 0
    for (let i = 0; i < 15; i++) {
      const inicio = performance.now()
      spawnSync(comando, { input: EXEMPLO, shell: true, windowsHide: true })
      tempos.push(performance.now() - inicio)
      if (readFileSync(join(pasta, 'medida.json'), 'utf8').trim() === EXEMPLO) certo++
    }
    tempos.sort((a, b) => a - b)
    r[nome] = { mediana_ms: Math.round(tempos[7]), pior_ms: Math.round(tempos[14]), certos: `${certo}/15` }
  }
  return r
}

// Ambiente do zero, como o montarAmbiente da Lousa: lista permitida + so CLAUDE_CONFIG_DIR.
const PERMITIDAS = ['SystemRoot', 'windir', 'ComSpec', 'PATHEXT', 'PATH', 'Path', 'TEMP', 'TMP', 'USERPROFILE',
  'USERNAME', 'APPDATA', 'LOCALAPPDATA', 'HOMEDRIVE', 'HOMEPATH', 'ProgramData', 'ProgramFiles',
  'ProgramFiles(x86)', 'CommonProgramFiles', 'NUMBER_OF_PROCESSORS', 'PROCESSOR_ARCHITECTURE', 'OS']

/** Data de modificacao de cada arquivo da raiz da pasta da conta (sem ler nenhum). */
function retratoDaConta(conta) {
  return Object.fromEntries(readdirSync(conta).map((n) => [n, statSync(join(conta, n)).mtimeMs]))
}

/** Campos que chegaram, com o tipo (nunca os valores de texto: podem ter caminho ou conta). */
function formato(valor) {
  if (Array.isArray(valor)) return 'lista'
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, formato(v)]))
  return typeof valor === 'number' ? valor : typeof valor
}

async function claude() {
  const require = createRequire(join(RAIZ, 'package.json'))
  const pty = require('node-pty')
  const conta = join(homedir(), '.claude-pessoal')
  const saida = join(pasta, 'painel.json')
  const contador = join(pasta, 'vezes.txt')
  // Cada vez que roda: grava o JSON e soma um ponto no contador. No Windows o Claude roda a
  // linha de status pelo Git Bash: nada de `cmd /d /c` (o bash troca /d e /c por caminhos) e
  // caminho com barra normal, que o bash e o cmd entendem.
  const barra = (p) => p.replace(/\\/g, '/')
  const comando = `findstr "^" > "${barra(saida)}" && echo . >> "${barra(contador)}"`
  const settings = join(pasta, 'lousa.settings.json')
  writeFileSync(settings, JSON.stringify({ statusLine: { type: 'command', command: comando } }))
  // Nenhuma conta do PC tem statusLine propria, e a pasta da conta nao se toca: a concorrente
  // fica nas configuracoes do PROJETO (a pasta de teste). O `--settings` tem de ganhar dela.
  const concorrente = join(pasta, 'concorrente.txt')
  mkdirSync(join(pasta, '.claude'), { recursive: true })
  writeFileSync(
    join(pasta, '.claude', 'settings.json'),
    JSON.stringify({ statusLine: { type: 'command', command: `echo . >> "${barra(concorrente)}"` } }),
  )
  const antes = retratoDaConta(conta)
  const env = Object.fromEntries(PERMITIDAS.filter((k) => process.env[k]).map((k) => [k, process.env[k]]))
  env.CLAUDE_CONFIG_DIR = conta
  const filho = pty.spawn(join(homedir(), '.local', 'bin', 'claude.exe'), ['--settings', settings], {
    cols: 120, rows: 40, cwd: pasta, env,
  })
  let tela = ''
  filho.onData((d) => (tela += d))
  const espera = (ms) => new Promise((r) => setTimeout(r, ms))
  await espera(6000)
  // pasta nova: a seta da confianca comeca em "No, exit" (T16.0); desce ate o "Yes"
  if (/trust/i.test(tela)) {
    filho.write('\x1b[B')
    await espera(800)
    filho.write('\r')
  }
  const inicio = Date.now()
  const marcas = []
  let vistas = 0
  while (Date.now() - inicio < 25000) {
    await espera(500)
    const n = existsSync(contador) ? readFileSync(contador, 'utf8').split('\n').length - 1 : 0
    if (n > vistas) marcas.push(Math.round((Date.now() - inicio) / 100) / 10)
    vistas = n
  }
  filho.write('\x03')
  await espera(400)
  filho.write('\x03')
  await espera(1500)
  try {
    filho.kill()
  } catch {
    // ja saiu
  }
  // SAIDA_TEXTO=<arquivo>: guarda a tela sem cores (e-mail mascarado) para entender uma falha
  if (process.env.SAIDA_TEXTO) {
    const SEQ = new RegExp(`${'\x1b'}\\[[0-9;?<>=]*[ -/]*[@-~]|${'\x1b'}\\][^${'\x07'}]*${'\x07'}|${'\x1b'}[@-_]`, 'g')
    const limpa = tela.replace(SEQ, '').replace(/[\w.+-]+@([\w-]+\.)+\w+/g, (e) => `***@${e.split('@')[1]}`)
    writeFileSync(process.env.SAIDA_TEXTO, limpa)
  }
  const depois = retratoDaConta(conta)
  const mudou = Object.keys({ ...antes, ...depois }).filter((n) => antes[n] !== depois[n])
  let campos
  try {
    campos = formato(JSON.parse(readFileSync(saida, 'utf8')))
  } catch {
    campos = existsSync(saida) ? 'JSON quebrado' : 'nao chegou'
  }
  return {
    vezesEm25s: vistas,
    segundosDasVezes: marcas,
    campos,
    concorrenteRodou: existsSync(concorrente),
    mudouNaPastaDaConta: mudou,
  }
}

console.log(JSON.stringify(modo === 'medir' ? medir() : await claude(), null, 2))
process.exit(0)
