// Quais pastas o main vigia (D17): a arvore pede as pastas abertas e o leitor pede a pasta
// do arquivo. Os pedidos se juntam aqui e so vao para o main quando a lista muda.

export interface PastaVigiada {
  repoId: string
  relativo: string
}

const pedidos = new Map<string, PastaVigiada[]>()
let enviada = ''
let relogio: number | null = null

/** Todas as pastas pedidas, sem repetir, em ordem fixa (a lista vira chave). */
export function unirPastas(todos: Iterable<PastaVigiada[]>): PastaVigiada[] {
  const unidas = new Map<string, PastaVigiada>()
  for (const lista of todos) for (const p of lista) unidas.set(`${p.repoId}|${p.relativo}`, p)
  return [...unidas.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, p]) => p)
}

function enviar(): void {
  relogio = null
  const pastas = unirPastas(pedidos.values())
  const chave = JSON.stringify(pastas)
  if (chave === enviada) return
  enviada = chave
  window.lousa.arquivos.vigiar(pastas).catch(() => {
    enviada = '' // o main ja registrou o erro; o proximo pedido tenta de novo
  })
}

/** `origem` troca o proprio pedido inteiro; lista vazia = nao precisa mais. */
export function vigiarPastas(origem: string, pastas: PastaVigiada[]): void {
  pedidos.set(origem, pastas)
  relogio ??= window.setTimeout(enviar, 50)
}
