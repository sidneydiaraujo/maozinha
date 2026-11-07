// estado: casa
// R2.10: agente na pasta do usuario enxerga as pastas das contas. O Novo quadro avisa (nao bloqueia)
// ao marcar a pasta do usuario e nao avisa na pasta de um projeto; o main responde pelo id.
// Nao abre agente de verdade: so confere o aviso e que o terminal comum ali nao ganha o sinal.
// Efeito no PC: nenhum.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const todos = (s) => [...document.querySelectorAll(s)]
  const r = {}
  const ate = async (condicao, vezes = 40) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const marcar = (nome) => todos('.pasta-escolha').find((e) => e.querySelector('strong')?.textContent === nome)?.click()
  await ate(() => q('[data-quadro="t2"]'), 80)

  r.ipc = { casa: await window.lousa.repos.pastaAmpla('home'), projeto: await window.lousa.repos.pastaAmpla('rd') }

  todos('button').find((e) => e.textContent.includes('+ Novo quadro'))?.click()
  await ate(() => q('.novo-quadro'))
  marcar('casa')
  r.avisoNaCasa = (await ate(() => q('.novo-aviso-ampla'), 20)) ? q('.novo-aviso-ampla').textContent : null
  r.botoesLigados = todos('.novo-botoes button').every((b) => !b.disabled)
  await prova.foto('1-aviso')
  marcar('pasta-demo')
  await espera(800)
  r.semAvisoNoProjeto = !q('.novo-aviso-ampla')
  await prova.foto('2-projeto')

  // terminal comum na pasta do usuario: o aviso e so para agente
  marcar('casa')
  await espera(500)
  const antes = todos('[data-quadro]').length
  todos('.novo-botoes button').find((e) => e.textContent.includes('Abrir terminal'))?.click()
  await ate(() => todos('[data-quadro]').length > antes)
  await espera(800)
  r.terminalSemSinal = !q('.quadro-pasta-ampla')

  r.ok =
    r.ipc.casa === true &&
    r.ipc.projeto === false &&
    /pasta de usuário/.test(r.avisoNaCasa ?? '') &&
    r.botoesLigados &&
    r.semAvisoNoProjeto &&
    r.terminalSemSinal
  return r
})()
