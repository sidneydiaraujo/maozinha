// Estados de teste (o estado.json de uma pasta de dados separada). Nunca o estado real.
// demo: dois terminais comuns na pasta de exemplo (contas Principal e Pessoal, sem login).
// casa: a pasta do usuario salva (aberta na arvore, so leitura) + dois terminais, como no D17.

const caixa = (x, largura) => ({ x, y: 40, largura, altura: 380 })

const terminal = (id, repoId, perfilId, x, largura) => ({
  id,
  repoId,
  perfilId,
  tipo: 'terminal',
  titulo: `Terminal ${id.slice(1)}`,
  caixa: caixa(x, largura),
})

const repo = (id, nome, caminho) => ({ id, nome, caminho, perfilPadraoId: 'principal' })

export const ESTADOS = ['demo', 'casa']

/** `pastas` = { pastaDemo, casa }: caminhos absolutos montados pelo rodar.mjs. */
export function estadoDe(nome, pastas) {
  const demo = repo('rd', 'pasta-demo', pastas.pastaDemo)
  const base = { versao: 2, perfis: {}, viewport: { x: 0, y: 0, zoom: 0.8 }, ultimoPerfilId: 'principal' }
  if (nome === 'casa') {
    return {
      ...base,
      repos: [repo('home', 'casa', pastas.casa), demo],
      quadros: [terminal('t1', 'rd', 'principal', 40, 620), terminal('t2', 'rd', 'principal', 680, 520)],
    }
  }
  if (nome !== 'demo') throw new Error(`estado desconhecido: ${nome} (use ${ESTADOS.join(' ou ')})`)
  return {
    ...base,
    repos: [demo],
    quadros: [terminal('t1', 'rd', 'principal', 40, 620), terminal('t2', 'rd', 'pessoal', 680, 520)],
  }
}
