// estado: demo
// Fatia 15. Sem opcao (T15.1): a Aparencia da engrenagem muda os terminais abertos na hora, sem
// reabrir: paleta Lousa -> Abyss (fundo e texto), fonte Consolas, letra 15 e entrelinha maior;
// guarda no localStorage; "Voltar ao padrao" volta tudo; a prova fica no desenho normal.
// Fotos: a-lousa, b-abyss.
// Com `webgl` (T15.2): os terminais desenham com WebGL (canvas, sem texto no HTML); derrubado o
// contexto de um, ele volta sozinho ao desenho normal e o outro segue em WebGL.
// Fotos: c-webgl, d-webgl-abyss, e-caiu.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent.replace(/\s+$/, '')).join('')
  const desenho = (id) => q(`[data-quadro="${id}"] .terminal`)?.dataset.desenho
  const opcao = (grupo, nome) =>
    [...document.querySelectorAll(`[aria-label="${grupo}"] [role="radio"]`)].find((b) => b.textContent.includes(nome))
  const voltarAoPadrao = () =>
    [...document.querySelectorAll('.aparencia button')].find((b) => b.textContent === 'Voltar ao padrão')?.click()
  const abrirAparencia = async () => {
    q('[aria-label="Contas e configurações"]').click()
    await espera(600)
    q('.aparencia summary').click()
    await espera(400)
  }

  const olhar = () => {
    const linhas = q('[data-quadro="t2"] .xterm-rows')
    const estilo = getComputedStyle(linhas)
    return {
      fundo: getComputedStyle(q('[data-quadro="t2"] .terminal')).backgroundColor,
      texto: estilo.color,
      fonte: estilo.fontFamily,
      tamanho: estilo.fontSize,
      altura: Math.round(linhas.firstElementChild.getBoundingClientRect().height * 10) / 10,
    }
  }

  async function provaNormal() {
    for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm-rows'); i++) await espera(500)
    for (let i = 0; i < 60 && !/pasta-demo>/.test(texto('t2')); i++) await espera(300)
    await espera(800)
    r.desenhos = [desenho('t1'), desenho('t2')]
    r.antes = olhar()
    await abrirAparencia()
    r.resumo = q('.aparencia summary')?.innerText.replace(/\n/g, ' ')
    await prova.foto('a-lousa')

    opcao('Cores', 'Abyss').click()
    await espera(600)
    r.abyss = olhar()
    await prova.foto('b-abyss')

    // tres cliques seguidos, sem esperar a tela: nenhum pode se perder
    opcao('Fonte', 'Consolas').click()
    q('[aria-label="Tamanho maior"]').click()
    q('[aria-label="Entrelinha maior"]').click()
    await espera(800)
    r.mudado = olhar()
    r.guardado = JSON.parse(localStorage.getItem('lousa.aparencia') ?? 'null')
    r.promptVivo = /pasta-demo>/.test(texto('t2'))

    voltarAoPadrao()
    await espera(800)
    r.depois = olhar()

    return (
      r.desenhos.every((d) => d === 'dom') &&
      r.antes.fonte.includes('Cascadia Code') &&
      r.antes.tamanho === '14px' &&
      r.abyss.fundo === 'rgb(0, 12, 24)' &&
      r.abyss.texto === 'rgb(204, 204, 204)' &&
      r.abyss.fundo !== r.antes.fundo &&
      r.mudado.fonte.startsWith('Consolas') &&
      r.mudado.tamanho === '15px' &&
      r.mudado.altura > r.abyss.altura &&
      r.guardado?.paleta === 'abyss' &&
      r.guardado?.tamanho === 15 &&
      r.promptVivo &&
      JSON.stringify(r.depois) === JSON.stringify(r.antes)
    )
  }

  async function provaWebgl() {
    for (let i = 0; i < 80 && !(desenho('t1') && desenho('t2')); i++) await espera(500)
    await espera(3000) // o prompt aparece no canvas: sem texto no HTML para esperar
    r.desenhos = [desenho('t1'), desenho('t2')]
    r.canvas = document.querySelectorAll('[data-quadro="t2"] .xterm-screen canvas').length
    r.semTextoNoHtml = !q('[data-quadro="t2"] .xterm-rows')
    await prova.foto('c-webgl')

    await abrirAparencia()
    opcao('Cores', 'Abyss').click()
    await espera(800)
    await prova.foto('d-webgl-abyss')
    voltarAoPadrao()
    q('[aria-label="Fechar"]')?.click()
    await espera(500)

    // derruba o WebGL do t2 como a placa de video faria; o addon espera 3 s antes de desistir.
    // Ha dois canvas: num que ja tem contexto 2D, pedir webgl2 so devolve null (nao cria outro).
    const contextos = [...document.querySelectorAll('[data-quadro="t2"] .xterm-screen canvas')]
      .map((c) => c.getContext('webgl2'))
      .filter(Boolean)
    r.contextosWebgl = contextos.length
    contextos[0]?.getExtension('WEBGL_lose_context')?.loseContext()
    for (let i = 0; i < 40 && desenho('t2') !== 'dom'; i++) await espera(250)
    await espera(800)
    r.depoisDaQueda = {
      t2: desenho('t2'),
      t1: desenho('t1'),
      linhas: !!q('[data-quadro="t2"] .xterm-rows'),
      prompt: /pasta-demo>/.test(texto('t2')),
    }
    await prova.foto('e-caiu')

    return (
      r.desenhos.every((d) => d === 'webgl') &&
      r.canvas >= 1 &&
      r.contextosWebgl === 1 &&
      r.semTextoNoHtml &&
      r.depoisDaQueda.t2 === 'dom' &&
      r.depoisDaQueda.t1 === 'webgl' &&
      r.depoisDaQueda.linhas &&
      r.depoisDaQueda.prompt
    )
  }

  const webgl = (prova.dados.opcoes ?? []).includes('webgl')
  r.rodada = webgl ? 'webgl' : 'normal'
  r.ok = webgl ? await provaWebgl() : await provaNormal()
  return r
})()
