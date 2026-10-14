// Aplica o layout que a tela mandou (posicao, tamanho, zoom) ao estado salvo (T3.5).
// A tela e nao confiavel: so valores validos e so ids que existem.
import { z } from 'zod'
import type { EstadoSalvo } from '../../shared/model'

const Numero = z.number().finite()
const Caixa = z.object({
  x: Numero,
  y: Numero,
  largura: Numero.min(50),
  altura: Numero.min(50),
})
const Item = z.object({ id: z.string().min(1), caixa: Caixa })

export const SchemaLayout = z.object({
  quadros: z.array(Item).max(5000),
  viewport: z.object({ x: Numero, y: Numero, zoom: Numero.min(0.05).max(4) }),
})

export type Layout = z.infer<typeof SchemaLayout>

/** Devolve um estado novo; ids desconhecidos sao ignorados. */
export function aplicarLayout(estado: EstadoSalvo, layout: Layout): EstadoSalvo {
  const quadros = new Map(layout.quadros.map((q) => [q.id, q.caixa]))
  return {
    ...estado,
    quadros: estado.quadros.map((q) => ({ ...q, caixa: quadros.get(q.id) ?? q.caixa })),
    viewport: layout.viewport,
  }
}
