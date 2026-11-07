// "Claude falso" para a prova da Fatia 8: fala o Program Status Protocol (OSC 7501) igual ao
// claude.exe 2.1.295+ e espera uma tecla para seguir. Nao usa conta nem rede.
const ESC = '\x1b'
const BEL = '\x07'
const b64 = (s) => Buffer.from(s, 'utf8').toString('base64')
const status = (corpo) => process.stdout.write(`${ESC}]7501;${corpo}${BEL}`)
const pasta = process.argv[2] || process.cwd()

process.stdin.setRawMode(true)
process.stdin.resume()
let recebido = ''
let fase = 'pergunta'
process.stdin.on('data', (d) => {
  recebido += d.toString('latin1')
  if (fase === 'esperando' && /s/i.test(d.toString('latin1'))) {
    fase = 'fim'
    status('state=working:app=claude-code')
    process.stdout.write('Editando src/app.ts...\r\n')
    setTimeout(() => {
      status(`state=done:app=claude-code:msg=${b64('Pronto: src/app.ts atualizado')}`)
      process.stdout.write('FIM do agente falso\r\n')
      setTimeout(() => process.exit(0), 400)
    }, 1200)
  }
})

status('?')
setTimeout(() => {
  const ok = recebido.includes(`${ESC}]7501;?`)
  process.stdout.write(`${ok ? 'RESPOSTA OK' : `SEM RESPOSTA ${JSON.stringify(recebido)}`}\r\n`)
  if (!ok) process.exit(1)
  status('state=working:app=claude-code')
  status('state=working:app=claude-code:id=subagente-1')
  process.stdout.write('Lendo docs/notas.md e https://example.com/guia.\r\n')
  process.stdout.write(`Arquivo: ${pasta}\\src\\app.ts:2\r\n`)
  // R1.6: nome solto que mora em docs/ (abre) e arquivo que nao existe (nao vira link)
  process.stdout.write('Solto: notas.md; falta: sumiu.md\r\n')
  setTimeout(() => {
    fase = 'esperando'
    status(`state=blocked:app=claude-code:kind=permission:msg=${b64('Editar src/app.ts')}`)
    process.stdout.write('Posso editar src/app.ts? (s/n)\r\n')
  }, 1500)
}, 1200)
