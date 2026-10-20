// estado: demo
// D17: a arvore e o leitor continuam vivos com o vigia so das pastas abertas.
// Arquivo criado pelo terminal aparece (raiz e subpasta), o leitor recarrega com a pasta
// FECHADA na arvore, apagado some, e nao existe mais "Alterados agora". Foto: leitor.
;(async () => {
  const { espera } = prova
  const q = (s) => document.querySelector(s)
  const linha = (rel) => q(`.arvore-linha[title="${rel}"]`)
  const ate = async (condicao, vezes = 20) => {
    for (let i = 0; i < vezes && !condicao(); i++) await espera(250)
    return !!condicao()
  }
  const r = {}
  let saida = ''
  const desliga = window.lousa.terminais.aoDados((id, d) => {
    if (id === 't1') saida = (saida + d).slice(-4000)
  })
  const CSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;?]*[A-Za-z]', 'g')
  const limpo = (t) => t.replace(CSI, '')
  await ate(() => /pasta-demo>/.test(limpo(saida)), 100)
  await ate(() => linha('docs'), 40)

  r.antesDeCriar = !!linha('criado-agora.txt')
  await window.lousa.terminais.escrever('t1', "Set-Content criado-agora.txt 'oi'\r")
  r.apareceu = await ate(() => linha('criado-agora.txt'))

  linha('docs').click()
  await ate(() => linha('docs/notas.md'))
  await window.lousa.terminais.escrever('t1', "Set-Content docs\\outro.md '# outro'\r")
  r.apareceuNaSubpasta = await ate(() => linha('docs/outro.md'))

  linha('docs/notas.md').click()
  await ate(() => q('.leitor'))
  linha('docs').click()
  await espera(600)
  r.docsFechada = !linha('docs/notas.md')
  await window.lousa.terminais.escrever('t1', "Add-Content docs\\notas.md 'linha-nova-do-vigia'\r")
  r.leitorRecarregou = await ate(() => (q('.leitor')?.textContent ?? '').includes('linha-nova-do-vigia'))
  r.seloAtualizado = !!q('.leitor-atualizado')
  await prova.foto('leitor')

  await window.lousa.terminais.escrever('t1', 'Remove-Item criado-agora.txt, docs\\outro.md\r')
  r.sumiu = await ate(() => !linha('criado-agora.txt'))
  r.semAlteradosAgora = !q('.recentes') && !q('.marca')
  desliga()
  return r
})()
