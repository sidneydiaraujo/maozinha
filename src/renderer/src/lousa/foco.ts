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

// Clique num terminal do historico da lateral (D48): a lousa leva ate ele, ampliado.
const ouvintesMostrar = new Set<(quadroId: string) => void>()

export function pedirMostrar(quadroId: string): void {
  for (const ouvinte of ouvintesMostrar) ouvinte(quadroId)
}

export function aoPedirMostrar(cb: (quadroId: string) => void): () => void {
  ouvintesMostrar.add(cb)
  return () => ouvintesMostrar.delete(cb)
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

// Frase passageira no topo da lousa (ex.: "Enviado para 2 quadros" pelo Ctrl+K, T25.2).
const ouvintesAviso = new Set<(texto: string) => void>()

export function pedirAviso(texto: string): void {
  for (const ouvinte of ouvintesAviso) ouvinte(texto)
}

export function aoPedirAviso(cb: (texto: string) => void): () => void {
  ouvintesAviso.add(cb)
  return () => ouvintesAviso.delete(cb)
}

// Ctrl+K "Nova nota" (T26.2): a lousa cria a nota no centro da vista.
const ouvintesNota = new Set<() => void>()

export function pedirNovaNota(): void {
  for (const ouvinte of ouvintesNota) ouvinte()
}

export function aoPedirNovaNota(cb: () => void): () => void {
  ouvintesNota.add(cb)
  return () => ouvintesNota.delete(cb)
}

// Clique na bolinha de saida de um agente (T28.3): a lousa pede ao main um colega ja ligado.
const ouvintesColega = new Set<(quadroId: string) => void>()

export function pedirColega(quadroId: string): void {
  for (const ouvinte of ouvintesColega) ouvinte(quadroId)
}

export function aoPedirColega(cb: (quadroId: string) => void): () => void {
  ouvintesColega.add(cb)
  return () => ouvintesColega.delete(cb)
}

// Clique no rotulo de uma linha do time (T28.2): fica fora da linha, entao pede o menu dela.
export interface PedidoDeMenu {
  ligacaoId: string
  x: number
  y: number
}
const ouvintesMenuLinha = new Set<(pedido: PedidoDeMenu) => void>()

export function pedirMenuLinha(pedido: PedidoDeMenu): void {
  for (const ouvinte of ouvintesMenuLinha) ouvinte(pedido)
}

export function aoPedirMenuLinha(cb: (pedido: PedidoDeMenu) => void): () => void {
  ouvintesMenuLinha.add(cb)
  return () => ouvintesMenuLinha.delete(cb)
}

// Clique no "excluir" de uma linha do time (09/11): a lousa fecha o quadro do colega livre.
const ouvintesExcluir = new Set<(quadroId: string) => void>()

export function pedirExcluirColega(quadroId: string): void {
  for (const ouvinte of ouvintesExcluir) ouvinte(quadroId)
}

export function aoPedirExcluirColega(cb: (quadroId: string) => void): () => void {
  ouvintesExcluir.add(cb)
  return () => ouvintesExcluir.delete(cb)
}
