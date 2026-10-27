// Investigacao da troca de modelo (aceite 0.4.0: "o botao nao troca para nenhum modelo").
// ABRE UM CLAUDE DE VERDADE (conta Pessoal, ~/.claude-pessoal) numa <pasta> ja confiada, sem
// mandar mensagem ao modelo: digita so `/model <alias>` como a Lousa digita (texto, pausa de
// 150 ms, Enter) e mostra os estados do OSC 7501 que chegaram e o fim da tela. Confere se o
// settings.json da conta mudou (o /model pode gravar o padrao) e devolve o texto de antes.
// uso: set ELECTRON_RUN_AS_NODE=1
//      node_modules\electron\dist\electron.exe provas\apoio\modelo-claude.mjs <pasta> <alias> [pausa-ms]
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

const [pastaArg, alias = 'sonnet', pausaArg = '150'] = process.argv.slice(2)
const pasta = pastaArg && resolve(pastaArg)
if (!pasta || !existsSync(pasta)) {
  console.log('uso: modelo-claude.mjs <pasta-confiada> <alias> [pausa-ms]')
  process.exit(2)
}
const pty = createRequire(import.meta.url)('node-pty')
const conta = join(homedir(), '.claude-pessoal')
const settings = join(conta, 'settings.json')
const antes = existsSync(settings) ? readFileSync(settings, 'utf8') : null
const exe = join(homedir(), '.local', 'bin', 'claude.exe')

// ambiente minimo, como o montarAmbiente (nunca o process.env inteiro)
const env = { CLAUDE_CONFIG_DIR: conta }
for (const k of ['SystemRoot', 'SYSTEMROOT', 'PATH', 'Path', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA', 'TEMP', 'TMP', 'HOMEDRIVE', 'HOMEPATH', 'USERNAME', 'COMPUTERNAME', 'PATHEXT', 'ComSpec']) {
  if (process.env[k]) env[k] = process.env[k]
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))
// com new RegExp: a regra no-control-regex barra o ESC literal (como em terminais/status.ts)
const ESC = '\x1b'
const BEL = '\x07'
const OSC_7501 = new RegExp(`${ESC}\\]7501;([^${BEL}${ESC}]*)`, 'g')
const SEM_OSC = new RegExp(`${ESC}\\][^${BEL}]*(${BEL}|${ESC}\\\\)`, 'g')
const SEM_CSI = new RegExp(`${ESC}\\[[0-9;?]*[ -/]*[@-~]`, 'g')
const SEM_CHARSET = new RegExp(`${ESC}[()][0-9A-B]`, 'g')
let saida = ''
const estados = []
// alias "--painel": nao digita nada; so diz se a linha de status rodou (a mesma da Lousa, D24)
// nos primeiros 15 s. Numa pasta nova o Claude fica na pergunta de confianca: Ctrl+C sai sem confiar.
const soPainel = alias === '--painel'
const arquivoPainel = join(process.env.TEMP, `lousa-modelo-painel-${process.pid}.json`)
const arquivoSettings = join(process.env.TEMP, `lousa-modelo-painel-${process.pid}.settings.json`)
writeFileSync(arquivoSettings, JSON.stringify({ statusLine: { type: 'command', command: `findstr "^" > "${arquivoPainel.replace(/\\/g, '/')}"` } }))
const args = soPainel ? ['--settings', arquivoSettings] : []
const p = pty.spawn(exe, args, { name: 'xterm-256color', cols: 120, rows: 40, cwd: pasta, env })
const inicio = Date.now()
// a mesma resposta da Lousa (terminais/status.ts, respostaEmTeclas): teclas no win32-input-mode
const resposta = [...'\x1b]7501;?\x07']
  .map((c) => `\x1b[0;0;${c.charCodeAt(0)};1;0;1_\x1b[0;0;${c.charCodeAt(0)};0;0;1_`)
  .join('')
p.onData((d) => {
  saida += d
  for (const m of d.matchAll(OSC_7501)) {
    estados.push(`${((Date.now() - inicio) / 1000).toFixed(1)}s ${m[1]}`)
    if (m[1].startsWith('?')) p.write(resposta)
  }
})

const limpo = (s) =>
  s
    .replace(SEM_OSC, '')
    .replace(SEM_CSI, '')
    .replace(SEM_CHARSET, '')
    .replace(/\r/g, '')
const fim = (n) => limpo(saida).split('\n').filter((l) => l.trim()).slice(-n).join('\n')

await esperar(soPainel ? 15000 : 12000)
console.log('--- estados ate ficar pronto:', estados.join(' | ') || '(nenhum)')
console.log('--- tela antes:\n' + fim(8))
if (soPainel) {
  console.log('--- linha de status rodou:', existsSync(arquivoPainel) ? `sim (${readFileSync(arquivoPainel, 'utf8').length} bytes)` : 'nao')
  p.write('\x03')
  await esperar(500)
  p.write('\x03')
  await esperar(1500)
  try {
    p.kill()
  } catch {
    /* ja saiu */
  }
  process.exit(0)
}
const marca = saida.length
p.write(alias.startsWith('/') ? alias : `/model ${alias}`)
await esperar(Number(pausaArg))
p.write('\r')
await esperar(6000)
console.log('--- estados depois:', estados.join(' | ') || '(nenhum)')
console.log('--- tela depois do /model:\n' + limpo(saida.slice(marca)).split('\n').filter((l) => l.trim()).slice(-25).join('\n'))
p.write('\x03')
await esperar(500)
p.write('\x03')
await esperar(1500)
try {
  p.kill()
} catch {
  /* ja saiu */
}
const depois = existsSync(settings) ? readFileSync(settings, 'utf8') : null
if (depois !== antes) {
  console.log('--- settings.json MUDOU; diferenca de campos:', JSON.stringify({ antes: antes && JSON.parse(antes).model, depois: depois && JSON.parse(depois).model }))
  if (antes !== null) writeFileSync(settings, antes)
  console.log('--- settings.json devolvido ao texto de antes')
} else console.log('--- settings.json igual')
process.exit(0)
