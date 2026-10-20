// Custo de guardar o historico do terminal a cada pedaco de saida (D17).
// Antes: (buffer + dados).slice(-limite) copiava o historico inteiro a cada pedaco.
// Depois: src/main/terminais/historico.ts guarda pedacos e so junta de vez em quando.
// uso: node provas/apoio/medir-historico.mjs
const PEDACOS = 20_000
const pedaco = 'y'.repeat(120)

function copiarSempre(limite) {
  let buffer = 'x'.repeat(limite)
  for (let i = 0; i < PEDACOS; i++) buffer = (buffer + pedaco + i).slice(-limite)
  return buffer.length
}

function emPedacos(limite) {
  let pedacos = ['x'.repeat(limite)]
  let tamanho = limite
  for (let i = 0; i < PEDACOS; i++) {
    const dados = pedaco + i
    pedacos.push(dados)
    tamanho += dados.length
    if (tamanho > limite * 2) {
      const texto = pedacos.join('').slice(-limite)
      pedacos = [texto]
      tamanho = texto.length
    }
  }
  return pedacos.join('').slice(-limite).length
}

for (const limite of [200_000, 1_000_000]) {
  for (const [nome, jeito] of [['copiar sempre', copiarSempre], ['em pedacos', emPedacos]]) {
    const inicio = performance.now()
    jeito(limite)
    const ms = performance.now() - inicio
    console.log(`${limite / 1000} KB, ${nome}: ${((ms / PEDACOS) * 1000).toFixed(1)} us por pedaco`)
  }
}
