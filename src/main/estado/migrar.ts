// Versao 1 do estado (lousa com molduras de repo) para a 2 (lousa livre, D13).
// O quadro guardava a posicao relativa a moldura: soma a posicao da moldura e
// descarta a moldura. Nada se perde.
import { z } from 'zod'

const Caixa = z.object({ x: z.number(), y: z.number(), largura: z.number(), altura: z.number() })

const RepoV1 = z.object({
  id: z.string(),
  nome: z.string(),
  caminho: z.string(),
  perfilPadraoId: z.string(),
  caixa: Caixa,
})

const QuadroV1 = z.looseObject({ repoId: z.string(), caixa: Caixa })

const EstadoV1 = z.looseObject({
  versao: z.literal(1),
  repos: z.array(RepoV1),
  quadros: z.array(QuadroV1),
})

/** Devolve o JSON migrado para a versao 2; qualquer outra coisa volta como veio. */
export function migrar(bruto: unknown): unknown {
  const v1 = EstadoV1.safeParse(bruto)
  if (!v1.success) return bruto
  const molduras = new Map(v1.data.repos.map((r) => [r.id, r.caixa]))
  return {
    ...v1.data,
    versao: 2,
    repos: v1.data.repos.map((r) => ({ id: r.id, nome: r.nome, caminho: r.caminho, perfilPadraoId: r.perfilPadraoId })),
    quadros: v1.data.quadros.map((q) => {
      const m = molduras.get(q.repoId)
      return m ? { ...q, caixa: { ...q.caixa, x: q.caixa.x + m.x, y: q.caixa.y + m.y } } : q
    }),
  }
}
