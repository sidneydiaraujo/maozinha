// estado: agente
// Investigacao (T29.1): o que o claude.exe manda pelo OSC 7501 ao abrir e ao sair ("No, exit"
// na confianca da pasta). Grava a saida crua e o estado que o main repassa. Sem mensagem.
;(async () => {
  const { espera } = prova
  const r = { sequencias: [], estados: [] }
  const ESC = String.fromCharCode(27)
  const BEL = String.fromCharCode(7)
  let cru = ''
  window.lousa.terminais.aoDados((id, dados) => {
    if (id === 'a1') cru += dados
  })
  window.lousa.terminais.aoEstado((id, aviso) => {
    if (id === 'a1') r.estados.push({ quando: Date.now(), ...aviso })
  })
  const texto = () => [...document.querySelectorAll('[data-quadro="a1"] .xterm-rows > div')].map((d) => d.textContent).join('\n')
  const ate = async (c, vezes) => {
    for (let i = 0; i < vezes && !c(); i++) await espera(250)
    return c()
  }
  r.perguntou = await ate(() => /trust/i.test(texto()), 160)
  await espera(1500)
  r.marca = r.estados.length
  await window.lousa.terminais.escrever('a1', '\r')
  r.voltouAoPowerShell = await ate(() => /PS [^\n]*>\s*$/.test(texto().trimEnd() + ' '), 120)
  await espera(2000)
  const padrao = new RegExp(`${ESC}\\]7501;([^${BEL}${ESC}]*)`, 'g')
  for (let m = padrao.exec(cru); m; m = padrao.exec(cru)) r.sequencias.push(m[1])
  r.ok = true
  return r
})()
