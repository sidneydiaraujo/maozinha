// estado: demo
// R2.7: a janela so fica na propria pagina. Tenta ir para outro arquivo local, para uma pasta de
// rede e para um site; o main recusa e a lousa continua a mesma (com o window.lousa vivo).
// Efeito no PC: nenhum (nada e aberto).
;(async () => {
  const { espera } = prova
  const r = {}
  const inicio = location.href
  const tentar = async (url) => {
    try {
      location.href = url
    } catch (e) {
      return `erro: ${String(e)}`
    }
    await espera(1500)
    return location.href === inicio && !!document.querySelector('.react-flow')
  }
  r.arquivoLocal = await tentar('file:///C:/Windows/win.ini')
  r.pastaDeRede = await tentar('file://servidor-que-nao-existe/x/index.html')
  r.site = await tentar('https://example.com/')
  // o IPC continua atendendo a tela do app
  r.ipcVivo = Array.isArray(await window.lousa.lousa.carregar().then((e) => e.quadros))
  r.ok = r.arquivoLocal === true && r.pastaDeRede === true && r.site === true && r.ipcVivo
  await prova.foto('1-ficou')
  return r
})()
