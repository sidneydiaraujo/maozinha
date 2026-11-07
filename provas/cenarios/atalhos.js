// estado: demo
// R2.11: a tela so manda ids. (1) Junção dentro da pasta que leva para fora dela: o leitor recusa
// ler e listar; a que continua dentro segue valendo. (2) "adicionar pasta" com ficha inventada ou
// com um caminho no lugar da ficha e recusado (so o seletor do Windows, no main, da ficha).
// Efeito no PC: cria duas junções dentro da pasta-demo da propria rodada (provas/saida).
;(async () => {
  const { espera } = prova
  const { pastaDemo } = prova.dados
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) => [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent).join('')
  const erroDe = async (promessa) => {
    try {
      await promessa
      return 'aceitou'
    } catch (e) {
      return String(e?.message ?? e).replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
    }
  }
  for (let i = 0; i < 80 && !/PS .*>/.test(texto('t1')); i++) await espera(300)

  // a junção "fora" aponta para a pasta da rodada (onde fica o dados.json); "dentro", para docs
  const fora = `${pastaDemo}\\..`
  await window.lousa.terminais.escrever(
    't1',
    `New-Item -ItemType Junction -Path '${pastaDemo}\\fora' -Target '${fora}' | Out-Null; ` +
      `New-Item -ItemType Junction -Path '${pastaDemo}\\dentro' -Target '${pastaDemo}\\docs' | Out-Null; ` +
      `('JUN' + 'COES-OK')\r`,
  )
  for (let i = 0; i < 40 && !texto('t1').includes('JUNCOES-OK'); i++) await espera(250)
  r.juncoesCriadas = texto('t1').includes('JUNCOES-OK')

  r.lerFora = await erroDe(window.lousa.arquivos.ler('rd', 'fora/dados.json'))
  r.listarFora = await erroDe(window.lousa.arquivos.listar('rd', 'fora'))
  const dentro = await window.lousa.arquivos.listar('rd', 'dentro').catch((e) => String(e))
  r.listarDentro = Array.isArray(dentro) ? dentro.map((i) => i.nome) : dentro
  r.lerDentro = await window.lousa.arquivos
    .ler('rd', 'dentro/notas.md')
    .then((c) => c.tipo)
    .catch((e) => String(e))

  r.fichaInventada = await erroDe(window.lousa.repos.adicionar('ficha-inventada', 'principal'))
  r.caminhoNoLugar = await erroDe(window.lousa.repos.adicionar(pastaDemo, 'principal'))
  r.reposDepois = (await window.lousa.lousa.carregar()).repos.length

  r.ok =
    r.juncoesCriadas &&
    /fora da pasta/.test(r.lerFora) &&
    /fora da pasta/.test(r.listarFora) &&
    Array.isArray(dentro) &&
    r.listarDentro.includes('notas.md') &&
    r.lerDentro === 'texto' &&
    /Escolha a pasta de novo/.test(r.fichaInventada) &&
    /Escolha a pasta de novo/.test(r.caminhoNoLugar) &&
    r.reposDepois === 1
  void q
  return r
})()
