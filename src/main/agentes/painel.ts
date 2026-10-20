// Leitor do JSON que o Claude Code entrega a linha de status (statusLine) de cada agente
// (T17.1, D24). Formato visto no claude.exe 2.1.304 (T17.0). Fica so com modelo, esforco,
// contexto e limites de uso; o resto (caminhos, sessao, custo) e descartado e nunca registrado.
// Funcoes puras, sem Electron.
import { z } from 'zod'
import type { Esforco, Limite, PainelAgente } from '../../shared/model'

export const MAIOR_JSON = 64 * 1024
const ESFORCOS = ['low', 'medium', 'high', 'xhigh', 'max'] as const satisfies readonly Esforco[]

const Numero = z.number().finite()
const LimiteBruto = z.object({ used_percentage: Numero, resets_at: Numero.nullish() })

// Cada campo que falta ou vem estranho vira null sozinho, sem derrubar os outros; campo novo do
// Claude e ignorado (z.object descarta o que nao conhece).
const Bruto = z.object({
  model: z
    .object({ id: z.string().min(1).max(200), display_name: z.string().max(200).optional() })
    .nullish()
    .catch(null),
  effort: z.object({ level: z.enum(ESFORCOS) }).nullish().catch(null),
  context_window: z
    .object({ used_percentage: Numero, context_window_size: Numero.positive() })
    .nullish()
    .catch(null),
  rate_limits: z
    .object({ five_hour: LimiteBruto.nullish().catch(null), seven_day: LimiteBruto.nullish().catch(null) })
    .nullish()
    .catch(null),
})

const porcento = (n: number): number => Math.min(100, Math.max(0, n))

/** `resets_at` vem em segundos (T17.0); se um dia vier em ms, fica como esta. */
const emMs = (instante: number): number => (instante < 1e11 ? instante * 1000 : instante)

function limite(bruto: z.infer<typeof LimiteBruto> | null | undefined): Limite | null {
  if (!bruto) return null
  return { usado: porcento(bruto.used_percentage), zeraEm: bruto.resets_at == null ? null : emMs(bruto.resets_at) }
}

/** Texto -> objeto JSON; null se nao for JSON, nao for objeto ou passar de 64 KB. */
function objetoDe(json: string): object | null {
  if (json.length > MAIOR_JSON) return null
  try {
    const dado: unknown = JSON.parse(json)
    return dado && typeof dado === 'object' && !Array.isArray(dado) ? dado : null
  } catch {
    return null
  }
}

/** JSON da linha de status -> painel; null se nao for JSON, nao for objeto ou passar de 64 KB. */
export function lerPainel(json: string, agora: number): PainelAgente | null {
  const lido = Bruto.safeParse(objetoDe(json))
  if (!lido.success) return null
  const { model, effort, context_window: contexto, rate_limits: limites } = lido.data
  return {
    modelo: model ? { id: model.id, nome: model.display_name || model.id } : null,
    esforco: effort?.level ?? null,
    contexto: contexto ? { usado: porcento(contexto.used_percentage), tamanho: contexto.context_window_size } : null,
    limites: limites ? { cincoHoras: limite(limites.five_hour), semana: limite(limites.seven_day) } : null,
    quando: agora,
  }
}

/**
 * Bytes do arquivo -> texto. O `findstr ... >` grava UTF-8 pelo Git Bash; se um dia o Claude
 * rodar a linha pelo PowerShell 5.1, o `>` grava UTF-16 com BOM (T17.0).
 */
export function textoDoArquivo(bytes: Buffer): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return bytes.subarray(2).toString('utf16le').trim()
  if (bytes[0] === 0xfe && bytes[1] === 0xff && bytes.length % 2 === 0) {
    return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le').trim()
  }
  const semBom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes
  return semBom.toString('utf8').trim()
}
