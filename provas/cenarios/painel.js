// estado: agente
// Fatia 17 (T17.2), COM CLAUDE DE VERDADE (conta Pessoal, pede o ok do Sidney): o agente a1
// abre com `--settings` (arquivo da Lousa em <dados>\agentes), a linha de status grava o JSON,
// o main le e manda `agentes:painel` com modelo, esforco, contexto e limites; o
// `agentes.ultimoPainel` devolve o mesmo para a tela remontada. Nao manda mensagem nenhuma:
// so aceita a confianca da pasta de teste (a seta comeca em "No, exit") e sai com Ctrl+C.
// Foto: agente.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('\n')
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const recebidos = []
  const parar = window.lousa.agentes.aoPainel((quadroId, painel) => recebidos.push({ quadroId, painel }))

  await ate(() => q('[data-quadro="a1"] .xterm-rows'), 200)
  r.abriuComSettings = await ate(() => /--settings\s*'[^']*a1\.settings\.json'/.test(texto('a1').replace(/\n/g, '')), 80)
  // pasta nova: o Claude pergunta se confia nela; leva a seta ao "Yes" e confirma
  r.perguntouConfianca = await ate(() => /trust/i.test(texto('a1')), 120)
  if (r.perguntouConfianca) {
    await window.lousa.terminais.escrever('a1', '\x1b[B')
    await espera(800)
    r.setaNoSim = /❯\s*(\d\.\s*)?Yes/.test(texto('a1'))
    if (r.setaNoSim) await window.lousa.terminais.escrever('a1', '\r')
  }
  r.chegou = await ate(() => recebidos.some((x) => x.quadroId === 'a1'), 160)
  await prova.foto('agente')

  const painel = recebidos.find((x) => x.quadroId === 'a1')?.painel ?? null
  r.painel = painel && {
    modelo: painel.modelo?.nome ?? null,
    esforco: painel.esforco,
    contexto: painel.contexto,
    tamanhoDoContexto: painel.contexto?.tamanho ?? null,
    cincoHoras: painel.limites?.cincoHoras ?? null,
    semana: painel.limites?.semana ?? null,
  }
  const guardado = await window.lousa.agentes.ultimoPainel('a1')
  r.ultimoIgual = JSON.stringify(guardado) === JSON.stringify(recebidos.filter((x) => x.quadroId === 'a1').at(-1)?.painel)
  r.outroQuadroNada = (await window.lousa.agentes.ultimoPainel('zz')) === null

  // sai do Claude sem mandar nada, e do PowerShell
  await window.lousa.terminais.escrever('a1', '\x03')
  await espera(500)
  await window.lousa.terminais.escrever('a1', '\x03')
  await espera(2500)
  await window.lousa.terminais.escrever('a1', 'exit\r')
  await espera(1500)
  parar()

  r.ok =
    r.abriuComSettings &&
    r.chegou &&
    !!r.painel?.modelo &&
    !!r.painel?.esforco &&
    r.painel?.cincoHoras !== null &&
    r.painel?.semana !== null &&
    r.ultimoIgual &&
    r.outroQuadroNada
  return r
})()
