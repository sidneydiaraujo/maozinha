// "Claude falso" da prova do time (T29.1): roda como claude.exe (o node copiado com esse nome,
// para o main achar um claude.exe dentro do PowerShell do quadro), diz "parado" pelo OSC 7501 e
// mostra cada linha que recebe como "RECEBI: ...". Nao usa conta nem rede.
const ESC = '\x1b'
const BEL = '\x07'
process.stdin.setRawMode(true)
process.stdin.resume()
let linha = ''
process.stdin.on('data', (d) => {
  for (const c of d.toString('utf8')) {
    if (c === '\r') {
      process.stdout.write(`\r\nRECEBI: ${linha}\r\n`)
      linha = ''
    } else if (c === '\x03') process.exit(0)
    else linha += c
  }
})
process.stdout.write('ECO DO TIME PRONTO\r\n')
setTimeout(() => process.stdout.write(`${ESC}]7501;state=working:app=claude-code${BEL}`), 300)
setTimeout(() => process.stdout.write(`${ESC}]7501;state=idle:app=claude-code${BEL}`), 900)
