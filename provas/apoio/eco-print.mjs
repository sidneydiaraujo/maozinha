// No lugar do Claude, para o cenario `print` (T16.1, T16.2): diz o que o terminal recebeu.
// ESC v (o Alt+V do Claude) -> "IMAGEM OK"; ^V cru -> "CTRL-V CRU"; colar marcado (bracketed
// paste, que o Claude pede e o xterm usa no term.paste) -> "COLADO=<texto>"; q ou ^C sai.
// uso (num terminal da Lousa): node <apoio>\eco-print.mjs
const COMECO = '\x1b[200~'
const FIM = '\x1b[201~'

process.stdout.write('\x1b[?2004h') // pede o colar marcado, como o Claude
process.stdin.setRawMode(true)
process.stdin.setEncoding('utf8')
process.stdout.write('ECO PRONTO\r\n')

const sair = () => {
  process.stdout.write('\x1b[?2004l')
  process.exit(0)
}

let resto = ''
/** Tira do comeco de `resto` um pedaco conhecido; false = falta chegar o resto do pedaco. */
function consumir() {
  if (resto.startsWith(COMECO)) {
    const fim = resto.indexOf(FIM)
    if (fim < 0) return false
    process.stdout.write(`COLADO=${resto.slice(COMECO.length, fim)}\r\n`)
    resto = resto.slice(fim + FIM.length)
  } else if (resto.startsWith('\x1bv')) {
    process.stdout.write('IMAGEM OK\r\n')
    resto = resto.slice(2)
  } else if (resto.startsWith('\x16')) {
    process.stdout.write('CTRL-V CRU\r\n')
    resto = resto.slice(1)
  } else if (resto.startsWith('\x03') || resto.startsWith('q')) {
    sair()
  } else if (resto === '\x1b' || (resto.startsWith('\x1b[') && resto.length < COMECO.length)) {
    return false
  } else {
    resto = resto.slice(1) // outra tecla: ignora
  }
  return true
}

process.stdin.on('data', (dados) => {
  resto += dados
  while (resto && consumir()) {
    // segue consumindo
  }
})
