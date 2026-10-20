// O que o Ctrl+K oferece (T12.1): ir a um quadro, abrir um quadro numa pasta, abrir um arquivo.
import type { PerfilComConta, Quadro, Repo } from '../../../shared/model'
import { pontuar } from '../../../shared/pontuar'

export type ItemPaleta =
  | { tipo: 'quadro'; chave: string; titulo: string; detalhe: string; quadroId: string }
  | { tipo: 'pasta'; chave: string; titulo: string; detalhe: string; repoId: string }
  | { tipo: 'arquivo'; chave: string; titulo: string; detalhe: string; repoId: string; relativo: string }
  | { tipo: 'mensagem'; chave: string; titulo: string; detalhe: string; texto: string }

const MAXIMO_LOCAIS = 12

/** Quadros (ir ate ele) e pastas (novo quadro nela), filtrados e na ordem da pontuacao. */
export function itensLocais(
  repos: Repo[],
  quadros: Quadro[],
  perfis: Pick<PerfilComConta, 'id' | 'nome'>[],
  consulta: string,
): ItemPaleta[] {
  const nomeRepo = new Map(repos.map((r) => [r.id, r.nome]))
  const nomeConta = new Map(perfis.map((p) => [p.id, p.nome]))
  const doQuadro = quadros.map(
    (q): ItemPaleta => ({
      tipo: 'quadro',
      chave: `q:${q.id}`,
      titulo: `${nomeRepo.get(q.repoId) ?? '?'} · ${q.titulo}`,
      detalhe: `Ir ao quadro · ${nomeConta.get(q.perfilId) ?? q.perfilId}`,
      quadroId: q.id,
    }),
  )
  const daPasta = [...repos].reverse().map(
    (r): ItemPaleta => ({
      tipo: 'pasta',
      chave: `p:${r.id}`,
      titulo: `Novo quadro em ${r.nome}`,
      detalhe: r.caminho,
      repoId: r.id,
    }),
  )
  return [...doQuadro, ...daPasta]
    .map((item, ordem) => ({ item, ordem, nota: pontuar(consulta, `${item.titulo} ${item.detalhe}`) }))
    .filter((x): x is { item: ItemPaleta; ordem: number; nota: number } => x.nota !== null)
    .sort((a, b) => b.nota - a.nota || a.ordem - b.ordem)
    .slice(0, MAXIMO_LOCAIS)
    .map((x) => x.item)
}

/** Arquivo achado pelo main vira item: nome em destaque, pasta e caminho embaixo. */
export function itemDeArquivo(achado: { repoId: string; relativo: string }, repos: Repo[]): ItemPaleta {
  const partes = achado.relativo.split('/')
  const nome = partes.pop() ?? achado.relativo
  const repo = repos.find((r) => r.id === achado.repoId)?.nome ?? '?'
  return {
    tipo: 'arquivo',
    chave: `a:${achado.repoId}:${achado.relativo}`,
    titulo: nome,
    detalhe: [repo, ...partes].join(' / '),
    repoId: achado.repoId,
    relativo: achado.relativo,
  }
}

const MAXIMO_MENSAGENS = 5

/** Mensagens prontas (T25.2): "Mandar: <frase>", filtradas pela consulta (tambem por "mandar"). */
export function itensDeMensagem(mensagens: string[], consulta: string): ItemPaleta[] {
  return mensagens
    .map((texto, ordem) => ({ texto, ordem, nota: pontuar(consulta, `mandar mensagem ${texto}`) }))
    .filter((x): x is { texto: string; ordem: number; nota: number } => x.nota !== null)
    .sort((a, b) => b.nota - a.nota || a.ordem - b.ordem)
    .slice(0, MAXIMO_MENSAGENS)
    .map(
      ({ texto }): ItemPaleta => ({
        tipo: 'mensagem',
        chave: `m:${texto}`,
        titulo: `Mandar: ${texto}`,
        detalhe: 'Aos quadros selecionados ou ao último em que você clicou',
        texto,
      }),
    )
}
