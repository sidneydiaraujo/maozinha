import { describe, expect, it } from 'vitest'
import { lerPainel, MAIOR_JSON, textoDoArquivo } from './painel'

const AGORA = 1_792_470_000_000

// O formato que chegou na T17.0 (claude.exe 2.1.304), com valores inventados
const COMPLETO = {
  session_id: 'abc',
  transcript_path: 'C:\\Users\\x\\.claude\\projects\\p\\abc.jsonl',
  cwd: 'C:\\repo',
  scratchpad_dir: 'C:\\tmp',
  effort: { level: 'high' },
  model: { id: 'claude-opus-5-5', display_name: 'Opus 5.5' },
  workspace: { current_dir: 'C:\\repo', project_dir: 'C:\\repo', added_dirs: [] },
  version: '2.1.304',
  output_style: { name: 'default' },
  cost: { total_cost_usd: 0.42, total_duration_ms: 10300 },
  context_window: {
    total_input_tokens: 620000,
    context_window_size: 1_000_000,
    used_percentage: 62,
    remaining_percentage: 38,
    current_usage: { input_tokens: 1 },
  },
  exceeds_200k_tokens: true,
  fast_mode: false,
  thinking: { enabled: true },
  rate_limits: {
    five_hour: { used_percentage: 24, resets_at: 1_792_475_400 },
    seven_day: { used_percentage: 31, resets_at: 1_792_735_200 },
  },
}

describe('lerPainel', () => {
  it('o exemplo completo: fica so com modelo, esforco, contexto e limites (resets_at vira ms)', () => {
    expect(lerPainel(JSON.stringify(COMPLETO), AGORA)).toEqual({
      modelo: { id: 'claude-opus-5-5', nome: 'Opus 5.5' },
      esforco: 'high',
      contexto: { usado: 62, tamanho: 1_000_000 },
      limites: {
        cincoHoras: { usado: 24, zeraEm: 1_792_475_400_000 },
        semana: { usado: 31, zeraEm: 1_792_735_200_000 },
      },
      quando: AGORA,
    })
  })

  it('nada de caminho, sessao ou custo no painel', () => {
    const texto = JSON.stringify(lerPainel(JSON.stringify(COMPLETO), AGORA))
    expect(texto).not.toMatch(/repo|abc|jsonl|0\.42|tmp/)
  })

  it('sem rate_limits (conta sem plano): limites null, o resto fica', () => {
    const { rate_limits: _fora, ...semLimites } = COMPLETO
    const painel = lerPainel(JSON.stringify(semLimites), AGORA)
    expect(painel?.limites).toBeNull()
    expect(painel?.modelo?.id).toBe('claude-opus-5-5')
  })

  it('antes da 1a mensagem o contexto usado vem null: contexto null', () => {
    const antes = { ...COMPLETO, context_window: { context_window_size: 1_000_000, used_percentage: null } }
    expect(lerPainel(JSON.stringify(antes), AGORA)?.contexto).toBeNull()
  })

  it('campo novo e ignorado; campo estranho vira null so ele', () => {
    const estranho = { ...COMPLETO, campo_novo: { x: 1 }, effort: { level: 'ultra' }, model: { id: 42 } }
    const painel = lerPainel(JSON.stringify(estranho), AGORA)
    expect(painel?.esforco).toBeNull()
    expect(painel?.modelo).toBeNull()
    expect(painel?.contexto).toEqual({ usado: 62, tamanho: 1_000_000 })
  })

  it('um limite sem resets_at ou fora de 0-100', () => {
    const limites = { five_hour: { used_percentage: 120 }, seven_day: { used_percentage: -3, resets_at: null } }
    expect(lerPainel(JSON.stringify({ rate_limits: limites }), AGORA)?.limites).toEqual({
      cincoHoras: { usado: 100, zeraEm: null },
      semana: { usado: 0, zeraEm: null },
    })
  })

  it('resets_at que ja vem em ms fica como esta; modelo sem nome usa o id', () => {
    const painel = lerPainel(
      JSON.stringify({ model: { id: 'sonnet' }, rate_limits: { five_hour: { used_percentage: 1, resets_at: AGORA } } }),
      AGORA,
    )
    expect(painel?.limites?.cincoHoras?.zeraEm).toBe(AGORA)
    expect(painel?.modelo).toEqual({ id: 'sonnet', nome: 'sonnet' })
  })

  it('JSON quebrado, que nao e objeto ou acima de 64 KB: null', () => {
    expect(lerPainel('{"model":', AGORA)).toBeNull()
    expect(lerPainel('', AGORA)).toBeNull()
    expect(lerPainel('42', AGORA)).toBeNull()
    expect(lerPainel('[]', AGORA)).toBeNull()
    expect(lerPainel('null', AGORA)).toBeNull()
    expect(lerPainel(JSON.stringify({ ...COMPLETO, enche: 'x'.repeat(MAIOR_JSON) }), AGORA)).toBeNull()
  })
})

describe('textoDoArquivo', () => {
  it('UTF-8 com ou sem BOM e UTF-16 com BOM (o > do PowerShell 5.1)', () => {
    expect(textoDoArquivo(Buffer.from('{"a":1}\r\n'))).toBe('{"a":1}')
    expect(textoDoArquivo(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('{"a":1}')]))).toBe('{"a":1}')
    expect(textoDoArquivo(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('{"a":1}', 'utf16le')]))).toBe('{"a":1}')
    const be = Buffer.from(Buffer.from('{"a":1}', 'utf16le')).swap16()
    expect(textoDoArquivo(Buffer.concat([Buffer.from([0xfe, 0xff]), be]))).toBe('{"a":1}')
  })
})
