// estado: demo
// Fatia 20 (T20.1 + T20.2), sem Claude: o uso de cada conta vem pelo `prova.ipc('perfis:usoMudou')`,
// como o main manda quando um agente da conta conta os limites (a juntada no main tem teste).
// - ao abrir: `perfis.uso()` vazio e nenhuma barra ("sem dado ainda" no balao);
// - Principal 42% / 18%: duas barras azuis, balao "Sessão 42% · zera em 2h10" e a semana;
// - Pessoal 92% / 75% visto ha 2 h: vermelha e ambar, mas em cinza (dado velho) e "visto há 2 h".
// Fotos: 1-barras, 2-balao.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const r = {}
  const MIN = 60_000
  const ate = async (condicao, vezes) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return condicao()
  }
  const barras = (conta) =>
    [...document.querySelectorAll(`[data-conta="${conta}"] .uso-cheio`)].map((b) => ({
      largura: b.style.width,
      classe: b.className.replace('uso-cheio ', ''),
    }))

  await ate(() => q('[data-conta="principal"]') && q('[data-conta="pessoal"]'), 120)
  r.usoAoAbrir = await window.lousa.perfis.uso()
  r.semBarrasAoAbrir = barras('principal').length === 0 && barras('pessoal').length === 0
  q('[data-conta="principal"]').click()
  await espera(300)
  r.balaoSemDado = q('.uso-balao')?.textContent ?? null
  q('[data-conta="principal"]').click()
  await espera(200)

  const agora = Date.now()
  const sexta = new Date(agora + 3 * 24 * 60 * MIN)
  sexta.setHours(9, 0, 0, 0)
  await prova.ipc('perfis:usoMudou', {
    perfilId: 'principal',
    cincoHoras: { usado: 42, zeraEm: agora + 130 * MIN - 1000 },
    semana: { usado: 18, zeraEm: sexta.getTime() },
    quando: agora,
  })
  await prova.ipc('perfis:usoMudou', {
    perfilId: 'pessoal',
    cincoHoras: { usado: 92, zeraEm: agora + 30 * MIN },
    semana: { usado: 75, zeraEm: sexta.getTime() },
    quando: agora - 2 * 60 * MIN,
  })
  await espera(400)
  r.principal = barras('principal')
  r.pessoal = barras('pessoal')
  r.pessoalVelho = !!q('[data-conta="pessoal"] .uso-barras.uso-velho')
  r.tituloPrincipal = q('[data-conta="principal"]').title
  await prova.foto('1-barras')

  q('[data-conta="principal"]').click()
  await espera(300)
  r.balaoPrincipal = [...document.querySelectorAll('.uso-balao > div')].map((d) => d.textContent)
  await prova.foto('2-balao')
  q('[data-conta="principal"]').click()
  await espera(200)
  q('[data-conta="pessoal"]').click()
  await espera(300)
  r.balaoPessoal = [...document.querySelectorAll('.uso-balao > div')].map((d) => d.textContent)
  r.balaoPessoalCinza = !!q('.uso-balao.uso-velho')

  const dia = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][sexta.getDay()]
  r.ok =
    r.usoAoAbrir.length === 0 &&
    r.semBarrasAoAbrir &&
    /sem dado ainda/.test(r.balaoSemDado ?? '') &&
    JSON.stringify(r.principal) ===
      JSON.stringify([
        { largura: '42%', classe: 'uso-normal' },
        { largura: '18%', classe: 'uso-normal' },
      ]) &&
    JSON.stringify(r.pessoal) ===
      JSON.stringify([
        { largura: '92%', classe: 'uso-perigo' },
        { largura: '75%', classe: 'uso-alerta' },
      ]) &&
    r.pessoalVelho &&
    r.tituloPrincipal.includes('Sessão 42% · zera em 2h10') &&
    r.balaoPrincipal[0] === 'Sessão 42% · zera em 2h10' &&
    r.balaoPrincipal[1] === `Semana 18% · zera ${dia} 09:00` &&
    r.balaoPrincipal[2] === 'visto agora' &&
    r.balaoPessoal.includes('visto há 2 h') &&
    r.balaoPessoalCinza
  return r
})()
