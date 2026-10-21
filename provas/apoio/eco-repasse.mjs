// "Claude falso" da prova do repasse (T30.1): roda como claude.exe (o node copiado com esse nome),
// diz "parado" pelo OSC 7501 e mostra cada linha recebida como "RECEBI: ...". Cada linha recebida
// vira uma vez de trabalho (trabalhando -> parado). "ciclos N texto" faz N vezes seguidas
// trabalhando -> terminou, com o texto na mensagem (como o `msg=` do Claude), sem ninguem digitar.
// Nao usa conta nem rede.
const ESC = '\x1b'
const BEL = '\x07'
const osc = (corpo) => process.stdout.write(`${ESC}]7501;${corpo}:app=claude-code${BEL}`)
const msg = (texto) => Buffer.from(texto, 'utf8').toString('base64')

function ciclos(n, texto, i = 0) {
  if (i >= n) return
  osc('state=working')
  setTimeout(() => osc(`state=done:msg=${msg(`${texto} ${i + 1}`)}`), 300)
  setTimeout(() => ciclos(n, texto, i + 1), 2500)
}

let recebidas = 0

function recebeu(linha) {
  // numeradas: o cenario conta pela ultima, mesmo com as antigas fora da tela
  process.stdout.write(`\r\nRECEBI ${++recebidas}: ${linha}\r\n`)
  const pedido = /^ciclos (\d+) (.*)$/.exec(linha)
  if (pedido) return ciclos(Number(pedido[1]), pedido[2])
  osc('state=working')
  setTimeout(() => osc('state=idle'), 600)
}

process.stdin.setRawMode(true)
process.stdin.resume()
let linha = ''
process.stdin.on('data', (d) => {
  for (const c of d.toString('utf8')) {
    if (c === '\r') {
      recebeu(linha)
      linha = ''
    } else if (c === '\x03') process.exit(0)
    else linha += c
  }
})
process.stdout.write('ECO DO REPASSE PRONTO\r\n')
setTimeout(() => osc('state=idle'), 500)
