// estado: demo
// Fatia 16 (T16.1 + T16.2), com o `apoio/eco-print.mjs` no lugar do Claude no terminal t2:
// - Ctrl+V com um print na area de transferencia manda o Alt+V (ESC v) -> "IMAGEM OK";
// - com texto, cola o texto marcado (bracketed paste) -> "COLADO=...";
// - vazia, segue o ^V cru -> "CTRL-V CRU";
// - arquivo arrastado por cima: borda tracejada; soltar um arquivo sem caminho no disco nao
//   cola nada; arquivo solto na lousa nao abre no lugar da Lousa;
// - quadro de terminal nao tem o 📎 (so o de agente).
// Foto: arrastando. O 📎 e o arrastar do Explorador ficam no aceite (itens 44 e 45).
// Efeito no PC: usa a area de transferencia e devolve o TEXTO que estava nela (imagem se perde).
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent.replace(/\s+$/, '')).join('\n')
  const conta = (s) => texto('t2').split(s).length - 1
  const focar = (id) => q(`[data-quadro="${id}"] .xterm-helper-textarea`).focus()
  const ctrlV = () =>
    prova.eventos([
      { type: 'keyDown', keyCode: 'V', modifiers: ['control'] },
      { type: 'keyUp', keyCode: 'V', modifiers: ['control'] },
    ])
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }

  for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm-rows'); i++) await espera(500)
  await ate(() => /pasta-demo>/.test(texto('t2')), 60)
  await espera(800)
  const original = await window.lousa.app.colar()
  await window.lousa.terminais.escrever('t2', `node "${prova.dados.apoio}\\eco-print.mjs"\r`)
  r.ecoPronto = await ate(() => conta('ECO PRONTO') > 0)

  // 1. um print: Alt+V
  await prova.imagemNaArea()
  r.temImagem = await window.lousa.app.temImagem()
  focar('t2')
  await ctrlV()
  r.imagem = await ate(() => conta('IMAGEM OK') > 0, 20)

  // 2. texto: cola marcado
  await window.lousa.app.copiar('ola-print')
  r.temImagemComTexto = await window.lousa.app.temImagem()
  focar('t2')
  await ctrlV()
  r.texto = await ate(() => conta('COLADO=ola-print') > 0, 20)

  // 3. nada: ^V cru segue para o programa
  await window.lousa.app.copiar('')
  r.temImagemVazia = await window.lousa.app.temImagem()
  focar('t2')
  await ctrlV()
  r.cru = await ate(() => conta('CTRL-V CRU') > 0, 20)
  r.imagemSoUmaVez = conta('IMAGEM OK') === 1

  // 4. arrastar: o File criado aqui nao tem caminho no disco (so o do Explorador tem)
  const el = q('[data-quadro="t2"] .terminal')
  const arrasto = () => {
    const dt = new DataTransfer()
    dt.items.add(new File(['x'], 'print.png', { type: 'image/png' }))
    return dt
  }
  el.dispatchEvent(new DragEvent('dragover', { dataTransfer: arrasto(), bubbles: true, cancelable: true }))
  r.borda = el.classList.contains('soltando')
  await prova.foto('arrastando')
  el.dispatchEvent(new DragEvent('drop', { dataTransfer: arrasto(), bubbles: true, cancelable: true }))
  r.bordaSumiu = !el.classList.contains('soltando')
  await espera(800)
  r.semCaminhoNaoCola = conta('COLADO=') === 1
  const naLousa = new DragEvent('drop', { dataTransfer: arrasto(), bubbles: true, cancelable: true })
  q('.react-flow__pane').dispatchEvent(naLousa)
  r.naLousaNaoAbre = naLousa.defaultPrevented

  // 5. terminal comum nao tem o 📎
  r.semClipeNoTerminal = !q('[data-quadro="t2"] .botao-print')

  await window.lousa.terminais.escrever('t2', 'q')
  if (original) await window.lousa.app.copiar(original)
  r.ok =
    r.ecoPronto &&
    r.temImagem &&
    r.imagem &&
    r.texto &&
    !r.temImagemVazia &&
    r.cru &&
    r.imagemSoUmaVez &&
    r.borda &&
    r.bordaSumiu &&
    r.semCaminhoNaoCola &&
    r.naLousaNaoAbre &&
    r.semClipeNoTerminal
  return r
})()
