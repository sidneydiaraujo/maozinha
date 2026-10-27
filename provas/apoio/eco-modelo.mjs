// "Claude falso" da prova da troca de modelo (D48): roda como claude.exe (o node copiado com esse
// nome, para o main achar um claude.exe dentro do PowerShell do quadro). Diz "parado" pelo OSC
// 7501; a linha "trabalhe" o deixa "trabalhando" ate a linha "pare". Mostra cada linha recebida
// como "RECEBI: ..." (se a Lousa digitasse /model, apareceria aqui). Nao usa conta nem rede.
const ESC = '\x1b'
const BEL = '\x07'
const osc = (estado) => process.stdout.write(`${ESC}]7501;state=${estado}:app=claude-code${BEL}`)

process.stdin.setRawMode(true)
process.stdin.resume()
let linha = ''
process.stdin.on('data', (d) => {
  for (const c of d.toString('utf8')) {
    if (c === '\r') {
      process.stdout.write(`\r\nRECEBI: ${linha}\r\n`)
      if (linha === 'trabalhe') osc('working')
      if (linha === 'pare') osc('idle')
      linha = ''
    } else if (c === '\x03') process.exit(0)
    else linha += c
  }
})
process.stdout.write('ECO DO MODELO PRONTO\r\n')
setTimeout(() => osc('working'), 300)
setTimeout(() => osc('idle'), 900)
