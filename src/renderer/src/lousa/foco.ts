// Pedido de "enquadra este quadro" (T8.2): vem da barra de cima ou do clique na notificacao do
// Windows; quem atende e a lousa, que tem a vista do React Flow.
const ouvintes = new Set<(quadroId: string) => void>()

export function pedirFoco(quadroId: string): void {
  for (const ouvinte of ouvintes) ouvinte(quadroId)
}

export function aoPedirFoco(cb: (quadroId: string) => void): () => void {
  ouvintes.add(cb)
  return () => ouvintes.delete(cb)
}
