// estado: time
// R3.13 (D62), com `sem-claude sono-rapido`: o Claude falso termina no a1; parado, ele hiberna em
// ~3 s (no app de verdade, 2 h): a capa "Dormindo" fica no lugar do terminal e o estado salva
// `dormindo`. a2 e a3 (sem estado de agente) seguem acordados. "Acordar" remonta o terminal e tira o
// `dormindo`. Por fim (R4.18) o a3 sai da lousa pelo canal do botao de fechar: o ciclo esquece o
// quadro sem erro e o estado salvo fica sem ele. Efeito no PC: nenhum.
;(async () => {
  const { espera } = prova
  const { app, apoio } = prova.dados
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) => [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('')
  const ate = async (condicao, vezes = 60) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const dormindoNoEstado = async (id) => (await window.lousa.lousa.carregar()).quadros.find((x) => x.id === id)?.dormindo === true

  await ate(() => /PS .*>/.test(texto('a1')), 80)
  await window.lousa.terminais.escrever('a1', `node "${apoio}\\falso-claude.mjs" "${app}"\r`)
  r.esperou = await ate(() => !!q('[data-quadro="a1"] .selo-esperando'), 60)
  await window.lousa.terminais.escrever('a1', 's')
  r.terminou = await ate(() => !!q('[data-quadro="a1"] .selo-terminou'), 40)

  r.dormiu = await ate(() => !!q('[data-quadro="a1"] .quadro-dormindo'), 80)
  r.salvoDormindo = await dormindoNoEstado('a1')
  r.outrosAcordados = !q('[data-quadro="a2"] .quadro-dormindo') && !q('[data-quadro="a3"] .quadro-dormindo')
  r.semTerminal = !q('[data-quadro="a1"] .xterm')
  await prova.foto('1-dormindo')

  q('[data-quadro="a1"] .quadro-dormindo button')?.click()
  r.acordou = await ate(() => !q('[data-quadro="a1"] .quadro-dormindo') && /PS .*>/.test(texto('a1')), 80)
  r.salvoAcordado = !(await dormindoNoEstado('a1'))
  await espera(4000) // terminal novo sem estado de agente: nao volta a dormir
  r.seguiuAcordado = !q('[data-quadro="a1"] .quadro-dormindo')
  await prova.foto('2-acordado')

  try {
    await window.lousa.quadros.remover('a3')
    r.saiuSemErro = true
  } catch (e) {
    r.saiuSemErro = String(e)
  }
  r.saiuDoEstado = !(await window.lousa.lousa.carregar()).quadros.some((x) => x.id === 'a3')

  r.ok =
    r.esperou &&
    r.terminou &&
    r.dormiu &&
    r.salvoDormindo &&
    r.outrosAcordados &&
    r.semTerminal &&
    r.acordou &&
    r.salvoAcordado &&
    r.seguiuAcordado &&
    r.saiuSemErro === true &&
    r.saiuDoEstado
  return r
})()
