// estado: casa
// D17: tempo da tecla ate o eco e atraso da tela, com a pasta do usuario aberta na arvore
// (so leitura) e o t2 fazendo o papel de um Claude: 1,3 MB de saida e depois pingando.
// Opcao `acumular`: antes de medir, chegam 10 mil arquivos mudados como lotes do vigia
// (o que 30 min da pasta do usuario davam na versao antiga).
// Referencia (19/10/2026, com acumular): antes 86 ms de mediana e 20,9 s de tela travada
// em ~35 s; depois 20 ms e nenhuma travada.
;(async () => {
  const { espera } = prova
  const r = {}
  const saida = { t1: '', t2: '' }
  const bytes = { t1: 0, t2: 0 }
  const desligaDados = window.lousa.terminais.aoDados((id, d) => {
    if (saida[id] === undefined) return
    saida[id] = (saida[id] + d).slice(-4000)
    bytes[id] += d.length
  })
  const ESC = String.fromCharCode(27)
  const BEL = String.fromCharCode(7)
  const CSI = new RegExp(ESC + '\\[[0-9;?]*[A-Za-z]', 'g')
  const OSC = new RegExp(ESC + '\\][^' + BEL + ']*' + BEL, 'g')
  const limpo = (t) => t.replace(CSI, '').replace(OSC, '')
  const pronto = (id) => /pasta-demo>/.test(limpo(saida[id]))
  for (let i = 0; i < 100 && !(pronto('t1') && pronto('t2')); i++) await espera(300)
  r.prompts = pronto('t1') && pronto('t2')

  if (prova.dados.opcoes.includes('acumular')) {
    for (let i = 0; i < 50; i++) {
      const caminhos = Array.from({ length: 200 }, (_, k) => `AppData/Local/Temp/sim/${i}-${k}.tmp`)
      await prova.ipc('arquivos:mudou', { repoId: 'home', caminhos })
      await espera(75)
    }
  }
  let lotes = 0
  const desligaVigia = window.lousa.arquivos.aoMudar(() => lotes++)
  await window.lousa.terminais.escrever('t2', "1..1300 | % { 'y' * 1000 }; while ($true) { 'z' * 60; Start-Sleep -Milliseconds 5 }\r")
  await espera(15000)

  // atraso da tela: um relogio de 20 ms que deveria bater sempre na hora
  let pior = 0
  let soma = 0
  let batidas = 0
  let previsto = performance.now() + 20
  const relogio = setInterval(() => {
    const agora = performance.now()
    const atraso = Math.max(0, agora - previsto)
    pior = Math.max(pior, atraso)
    soma += atraso
    batidas++
    previsto = agora + 20
  }, 20)
  const longas = []
  const observador = new PerformanceObserver((l) => l.getEntries().forEach((e) => longas.push(e.duration)))
  observador.observe({ type: 'longtask' })

  // eco: tecla -> main -> PowerShell -> main -> tela
  const latencias = []
  let esperando = null
  const desligaEco = window.lousa.terminais.aoDados((id, d) => {
    if (id !== 't1' || !esperando || !d.includes(esperando.c)) return
    latencias.push(performance.now() - esperando.t)
    esperando = null
  })
  const letras = 'qwertyuiopasdfghjklzxcvbnm'
  for (let i = 0; i < 60; i++) {
    esperando = { c: letras[i % letras.length], t: performance.now() }
    await window.lousa.terminais.escrever('t1', esperando.c)
    for (let k = 0; k < 200 && esperando; k++) await espera(5)
    if (esperando) latencias.push(1000)
    esperando = null
    await espera(300)
  }
  clearInterval(relogio)
  observador.disconnect()
  desligaEco()
  desligaVigia()
  desligaDados()
  await window.lousa.terminais.escrever('t2', '\x03')

  latencias.sort((a, b) => a - b)
  const quantil = (q) => Math.round(latencias[Math.min(latencias.length - 1, Math.floor(q * latencias.length))])
  r.eco_ms = { mediana: quantil(0.5), p90: quantil(0.9), pior: Math.round(latencias.at(-1)) }
  r.tela_atraso_ms = { medio: +(soma / Math.max(1, batidas)).toFixed(1), pior: Math.round(pior) }
  r.tela_travada = { vezes: longas.length, total_ms: Math.round(longas.reduce((a, b) => a + b, 0)) }
  r.lotes_do_vigia_durante_a_medida = lotes
  r.bytes_recebidos = bytes
  return r
})()
