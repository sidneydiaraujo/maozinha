// Formato do estado salvo e a leitura item a item (R1.2). Antes, um unico item fora do formato
// (um quadro com sessao estranha, uma ligacao de uma versao futura) isolava o arquivo inteiro e a
// lousa abria vazia. Agora o item ruim sai sozinho e o resto fica.
import { z } from 'zod'
import { ESFORCOS, MODELOS, type EstadoSalvo } from '../../shared/model'
import { FORMATO_SESSAO } from '../quadros/sessoes'

const Caixa = z.object({ x: z.number(), y: z.number(), largura: z.number(), altura: z.number() })
const Viewport = z.object({ x: z.number(), y: z.number(), zoom: z.number() })

const Perfil = z.object({
  nome: z.string().optional(),
  cor: z.string().optional(),
  raizes: z.array(z.string()).optional(),
  provedor: z.enum(['claude', 'codex']).optional(),
  criada: z.boolean().optional(),
  git: z
    .object({ nome: z.string().nullable(), email: z.string().nullable(), githubProprio: z.boolean() })
    .optional()
    .catch(undefined),
})

const Repo = z.object({
  id: z.string(),
  nome: z.string(),
  caminho: z.string(),
  perfilPadraoId: z.string(),
  copia: z.object({ origemId: z.string(), branch: z.string(), apelido: z.string() }).optional(),
})

const Quadro = z.object({
  id: z.string(),
  repoId: z.string(),
  perfilId: z.string(),
  tipo: z.enum(['terminal', 'agente']),
  titulo: z.string(),
  caixa: Caixa,
  sessaoId: z.string().regex(FORMATO_SESSAO).optional(),
  // valor desconhecido (versao futura do CLI) vira "sem escolha", sem estragar o estado
  modelo: z.enum(MODELOS).optional().catch(undefined),
  esforco: z.enum(ESFORCOS).optional().catch(undefined),
  papel: z.string().max(40).optional(),
  kanban: z.boolean().optional(),
  dormindo: z.boolean().optional(),
})

const Nota = z.object({ id: z.string(), texto: z.string().max(20000), caixa: Caixa })

const Vista = z.object({ id: z.string(), nome: z.string(), viewport: Viewport, caixas: z.record(z.string(), Caixa) })

const Ligacao = z.object({
  id: z.string(),
  de: z.string(),
  para: z.string(),
  modo: z.enum(['automatico', 'perguntar']),
  pausada: z.boolean().optional(),
  pedida: z.boolean().optional(),
})

/** O formato inteiro: o `salvar` confere com ele antes de gravar. */
export const SchemaEstado = z.object({
  versao: z.literal(2),
  perfis: z.record(z.string(), Perfil),
  repos: z.array(Repo),
  quadros: z.array(Quadro),
  viewport: Viewport,
  ultimoPerfilId: z.string().nullable(),
  notas: z.array(Nota).optional(),
  vistas: z.array(Vista).optional(),
  ligacoes: z.array(Ligacao).optional(),
})

export interface Leitura {
  estado: EstadoSalvo
  /** "quadros[3]", "ligacoes[0]": o que saiu (para o registro, sem conteudo). */
  descartados: string[]
}

const VIEWPORT_PADRAO = { x: 0, y: 0, zoom: 1 }

function itens<T>(nome: string, bruto: unknown, schema: z.ZodType<T>, descartados: string[]): T[] {
  if (bruto === undefined) return []
  if (!Array.isArray(bruto)) {
    descartados.push(nome)
    return []
  }
  return bruto.flatMap((item, i) => {
    const lido = schema.safeParse(item)
    if (lido.success) return [lido.data]
    descartados.push(`${nome}[${i}]`)
    return []
  })
}

function perfisDe(bruto: unknown, descartados: string[]): EstadoSalvo['perfis'] {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) {
    if (bruto !== undefined) descartados.push('perfis')
    return {}
  }
  const perfis: EstadoSalvo['perfis'] = {}
  for (const [id, valor] of Object.entries(bruto)) {
    const lido = Perfil.safeParse(valor)
    if (lido.success) perfis[id] = lido.data
    else descartados.push(`perfis.${id}`)
  }
  return perfis
}

/**
 * Linha de um quadro que saiu tambem sai: nada liga ao vazio. Quadro de pasta que sumiu fica (o app
 * ja convive com isso desde a migracao da v1).
 */
function semPontasSoltas(estado: EstadoSalvo, descartados: string[]): EstadoSalvo {
  const ids = new Set(estado.quadros.map((q) => q.id))
  const ligacoes = estado.ligacoes?.filter(
    (l, i) => (ids.has(l.de) && ids.has(l.para)) || !descartados.push(`ligacoes[${i}] sem quadro`),
  )
  return ligacoes ? { ...estado, ligacoes } : estado
}

/** null = nem e um estado (sem versao 2): o armazem guarda o arquivo e comeca do zero. */
export function lerTolerante(bruto: unknown): Leitura | null {
  if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return null
  const b = bruto as Record<string, unknown>
  if (b.versao !== 2) return null
  const descartados: string[] = []
  const viewport = Viewport.safeParse(b.viewport)
  if (!viewport.success) descartados.push('viewport')
  const ultimo = z.string().nullable().safeParse(b.ultimoPerfilId ?? null)
  const estado: EstadoSalvo = {
    versao: 2,
    perfis: perfisDe(b.perfis, descartados),
    repos: itens('repos', b.repos, Repo, descartados),
    quadros: itens('quadros', b.quadros, Quadro, descartados),
    viewport: viewport.success ? viewport.data : VIEWPORT_PADRAO,
    ultimoPerfilId: ultimo.success ? ultimo.data : null,
    ...(b.notas !== undefined ? { notas: itens('notas', b.notas, Nota, descartados) } : {}),
    ...(b.vistas !== undefined ? { vistas: itens('vistas', b.vistas, Vista, descartados) } : {}),
    ...(b.ligacoes !== undefined ? { ligacoes: itens('ligacoes', b.ligacoes, Ligacao, descartados) } : {}),
  }
  return { estado: semPontasSoltas(estado, descartados), descartados }
}
