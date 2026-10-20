// Prova do ConPTY (T8.1, D16): o que chega a um programa quando o terminal responde a
// pergunta OSC 7501. Abre `filho.mjs` (que pergunta e mostra o que recebeu) num ConPTY
// do node-pty e responde de um jeito:
//   bruto = ESC ] 7501 ; ? BEL     st = o mesmo com ESC \     win32 = em teclas win32-input-mode
// Resultado de 18/10/2026: bruto e st somem no console; win32 chega inteiro.
// uso (o node-pty do projeto e o do Electron, entao roda com o Electron como Node):
//   set ELECTRON_RUN_AS_NODE=1
//   node_modules\electron\dist\electron.exe provas\apoio\conpty-osc\pai.mjs win32
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const AQUI = dirname(fileURLToPath(import.meta.url))
const require = createRequire(join(resolve(AQUI, '..', '..', '..'), 'package.json'))
const pty = require('node-pty')

const modo = process.argv[2] ?? 'win32'
const ESC = '\x1b'
const PERGUNTA = `${ESC}]7501;?`
const bruto = modo === 'st' ? `${PERGUNTA}${ESC}\\` : `${PERGUNTA}\x07`
// win32-input-mode: cada caractere vira tecla descendo e subindo (ESC [ Vk;Sc;Uc;Kd;Cs;Rc _)
const emTeclas = (s) =>
  [...s].map((c) => `${ESC}[0;0;${c.charCodeAt(0)};1;0;1_${ESC}[0;0;${c.charCodeAt(0)};0;0;1_`).join('')
const resposta = modo === 'win32' ? emTeclas(`${PERGUNTA}\x07`) : bruto

// o filho roda no node.exe comum: o electron.exe e programa de janela e nao escreve no console
const filho = pty.spawn('node.exe', [join(AQUI, 'filho.mjs')], { cols: 100, rows: 30, cwd: AQUI, env: process.env })
let saida = ''
let respondeu = false
filho.onData((d) => {
  saida += d
  if (!respondeu && saida.includes(PERGUNTA)) {
    respondeu = true
    filho.write(`${resposta}abc`)
  }
})
filho.onExit(() =>
  setTimeout(() => {
    const recebido = /RECEBIDO=[^\r]*/.exec(saida)
    console.log(modo, '| respondeu:', respondeu, '|', recebido ? recebido[0] : 'sem RECEBIDO')
    process.exit(0)
  }, 500),
)
