// Roda um comando sem ELECTRON_RUN_AS_NODE. Aberto de dentro do VS Code, essa
// variavel vem ligada e faz o Electron rodar como Node puro: o app fecha na hora.
import { spawn } from 'node:child_process'

const partes = process.argv.slice(2)
if (partes.length === 0) {
  process.stderr.write('uso: node scripts/sem-run-as-node.mjs <comando> [args...]\n')
  process.exit(2)
}

const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const filho = spawn(partes.join(' '), { env, stdio: 'inherit', shell: true })
filho.on('exit', (codigo, sinal) => process.exit(codigo ?? (sinal ? 1 : 0)))
