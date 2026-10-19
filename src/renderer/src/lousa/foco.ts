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

// Ctrl+K "Novo quadro em <pasta>" (T12.1): a lousa abre a janelinha com a pasta marcada.
const ouvintesNovo = new Set<(repoId: string) => void>()

export function pedirNovoQuadro(repoId: string): void {
  for (const ouvinte of ouvintesNovo) ouvinte(repoId)
}

export function aoPedirNovoQuadro(cb: (repoId: string) => void): () => void {
  ouvintesNovo.add(cb)
  return () => ouvintesNovo.delete(cb)
}
