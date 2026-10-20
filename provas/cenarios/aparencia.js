// estado: demo
// Fatia 15 (T15.1): a Aparencia da engrenagem muda os terminais abertos na hora, sem reabrir:
// paleta Lousa -> Abyss (fundo e texto), fonte Consolas, letra 15 e entrelinha maior; guarda no
// localStorage; "Voltar ao padrao" volta tudo. Fotos: a-lousa, b-abyss.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const texto = (id) =>
    [...document.querySelectorAll(`[data-quadro="${id}"] .xterm-rows > div`)].map((d) => d.textContent.replace(/\s+$/, '')).join('')
  for (let i = 0; i < 80 && !q('[data-quadro="t2"] .xterm-rows'); i++) await espera(500)
  for (let i = 0; i < 60 && !/pasta-demo>/.test(texto('t2')); i++) await espera(300)
  await espera(800)

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
  const opcao = (grupo, nome) =>
    [...document.querySelectorAll(`[aria-label="${grupo}"] [role="radio"]`)].find((b) => b.textContent.includes(nome))

  r.antes = olhar()
  q('[aria-label="Contas e configurações"]').click()
  await espera(600)
  q('.aparencia summary').click()
  await espera(400)
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

  const voltar = [...document.querySelectorAll('.aparencia button')].find((b) => b.textContent === 'Voltar ao padrão')
  voltar?.click()
  await espera(800)
  r.depois = olhar()

  r.ok =
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
  return r
})()
