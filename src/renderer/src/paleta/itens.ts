// O que o Ctrl+K oferece (T12.1): ir a um quadro, abrir um quadro numa pasta, abrir um arquivo.
import type { PerfilComConta, Quadro, Repo, VistaSalva } from '../../../shared/model'
import { pontuar } from '../../../shared/pontuar'
import type { PedidoVista } from '../lousa/vistas'

export type ItemPaleta =
  | { tipo: 'quadro'; chave: string; titulo: string; detalhe: string; quadroId: string }
  | { tipo: 'pasta'; chave: string; titulo: string; detalhe: string; repoId: string }
  | { tipo: 'arquivo'; chave: string; titulo: string; detalhe: string; repoId: string; relativo: string }
  | { tipo: 'mensagem'; chave: string; titulo: string; detalhe: string; texto: string }
  | { tipo: 'novaNota'; chave: string; titulo: string; detalhe: string }
  | { tipo: 'vista'; chave: string; titulo: string; detalhe: string; pedido: PedidoVista }

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

/** Acoes da lousa no Ctrl+K: "Nova nota" (T26.2). So aparecem quando a consulta casa. */
export function itensDeAcao(consulta: string): ItemPaleta[] {
  const acoes: ItemPaleta[] = [
    { tipo: 'novaNota', chave: 'acao:nota', titulo: 'Nova nota', detalhe: 'Texto solto na lousa (markdown)' },
  ]
  if (consulta.trim() === '') return []
  return acoes.filter((a) => pontuar(consulta, `${a.titulo} ${a.detalhe}`) !== null)
}

/**
 * Vistas salvas (T27.2): "Vista: <nome>" volta a ela; "Apagar vista: <nome>" so aparece quando a
 * consulta casa; com texto que nao e o nome de uma vista, "Guardar vista atual como <texto>".
 */
export function itensDeVista(vistas: Pick<VistaSalva, 'id' | 'nome'>[], consulta: string): ItemPaleta[] {
  const ir = vistas.map(
    (v): ItemPaleta => ({ tipo: 'vista', chave: `v:${v.id}`, titulo: `Vista: ${v.nome}`, detalhe: 'Volta a câmera e o lugar dos quadros', pedido: { tipo: 'ir', vistaId: v.id } }),
  )
  const apagar = vistas.map(
    (v): ItemPaleta => ({ tipo: 'vista', chave: `va:${v.id}`, titulo: `Apagar vista: ${v.nome}`, detalhe: 'Só a vista; nenhum quadro muda', pedido: { tipo: 'apagar', vistaId: v.id } }),
  )
  const nome = consulta.trim()
  const casam = (i: ItemPaleta): boolean => pontuar(consulta, `vista ${i.titulo}`) !== null
  const achados = nome === '' ? ir : [...ir.filter(casam), ...apagar.filter(casam)]
  const jaExiste = vistas.some((v) => v.nome.toLowerCase() === nome.toLowerCase())
  const guardar: ItemPaleta[] =
    nome === '' || jaExiste
      ? []
      : [{ tipo: 'vista', chave: 'vg', titulo: `Guardar vista atual como "${nome}"`, detalhe: 'Câmera e lugar de cada quadro e nota', pedido: { tipo: 'guardar', nome } }]
  return [...achados.slice(0, 8), ...guardar]
}
