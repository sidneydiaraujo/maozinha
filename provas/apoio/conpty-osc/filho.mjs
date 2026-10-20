// Simula o Claude na prova do ConPTY (pai.mjs): pergunta OSC 7501 e mostra o que chega na entrada.
process.stdin.setRawMode(true)
process.stdin.resume()
let recebido = ''
process.stdin.on('data', (d) => { recebido += d.toString('latin1') })
process.stdout.write('\x1b]7501;?\x07')
setTimeout(() => {
  process.stdout.write('\x1b]7501;state=working:app=claude-code:msg=' + Buffer.from('lendo').toString('base64') + '\x07')
  process.stdout.write('\x1b]7501;state=blocked:app=claude-code:kind=permission\x07')
  process.stdout.write('\x1b]0;Titulo teste\x07')
  process.stdout.write('\x07')
  process.stdout.write('RECEBIDO=' + JSON.stringify(recebido) + '\r\n')
  setTimeout(() => process.exit(0), 300)
}, 1500)
