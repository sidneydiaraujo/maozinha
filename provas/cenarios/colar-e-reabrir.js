// estado: demo
// Fatia 8, complemento: botao direito sem selecao cola; copiar texto vazio deixa a area de
// transferencia vazia (o caso em que o Ctrl+V segue para o programa); `exit` mostra
// "Terminal encerrado" e Reabrir traz um prompt novo. Foto: reaberto.
// Efeito no PC: usa a area de transferencia e devolve o TEXTO que estava nela (imagem se perde).
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent.replace(/\s+$/, '')).join('')
  for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm-rows'); i++) await espera(500)
  for (let i = 0; i < 60 && !/pasta-demo>/.test(texto('t2')); i++) await espera(300)
  await espera(800)
  const original = await window.lousa.app.colar()

  // o roteiro dispara o evento da tela: o botao direito injetado pelo main nao gera contextmenu
  await window.lousa.app.copiar('echo direito-ok')
  const tela = q('[data-quadro="t2"] .xterm-screen')
  const c = tela.getBoundingClientRect()
  const evento = { bubbles: true, cancelable: true, button: 2, clientX: c.left + 50, clientY: c.top + 50 }
  tela.dispatchEvent(new MouseEvent('contextmenu', evento))
  await espera(1200)
  r.colarDireito = texto('t2').split('echo direito-ok').length - 1

  await window.lousa.app.copiar('')
  r.areaVazia = JSON.stringify(await window.lousa.app.colar())
  if (original) await window.lousa.app.copiar(original)

  await window.lousa.terminais.escrever('t2', '\r')
  await espera(800)
  await window.lousa.terminais.escrever('t2', 'exit\r')
  for (let i = 0; i < 40 && !q('[data-quadro="t2"] .quadro-encerrado'); i++) await espera(250)
  r.encerrado = !!q('[data-quadro="t2"] .quadro-encerrado')
  q('[data-quadro="t2"] .quadro-encerrado button').click()
  for (let i = 0; i < 60 && !(/pasta-demo>/.test(texto('t2')) && !q('[data-quadro="t2"] .quadro-encerrado')); i++) await espera(300)
  r.reabriu = !q('[data-quadro="t2"] .quadro-encerrado') && /pasta-demo>/.test(texto('t2'))
  await prova.foto('reaberto')
  return r
})()
