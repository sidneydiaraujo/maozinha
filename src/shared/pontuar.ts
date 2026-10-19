// Quanto um texto combina com o que foi digitado no Ctrl+K (T12.1). Puro, sem import:
// usado pela tela (quadros e pastas) e pelo main (nomes de arquivo).

const semAcento = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

/**
 * null = nao combina. Maior = melhor: trecho inteiro no comeco > trecho inteiro > letras na ordem
 * (como o Ctrl+P do VSCode: "ldm" acha "leia.md"). Sem diferenciar maiuscula nem acento.
 */
export function pontuar(consulta: string, texto: string): number | null {
  const c = semAcento(consulta.trim())
  if (c === '') return 0
  const t = semAcento(texto)
  const pos = t.indexOf(c)
  if (pos === 0) return 300 - t.length / 100
  if (pos > 0) return 200 - pos - t.length / 100
  let i = 0
  let saltos = 0
  for (const letra of t) {
    if (i < c.length && letra === c[i]) i++
    else if (i > 0 && i < c.length) saltos++
  }
  // letras muito espalhadas ("api" em "app · terminal") nao contam: no maximo 2 saltos por letra
  return i === c.length && saltos <= 2 * c.length ? 100 - saltos - t.length / 100 : null
}
