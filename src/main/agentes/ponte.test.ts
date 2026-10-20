import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { PainelAgente } from '../../shared/model'
import { caminhoServe, ESPERA_MS, linhaDeStatus, PonteAgentes, type DiscoPonte } from './ponte'

const PASTA = 'C:\\Users\\x\\AppData\\Roaming\\lousa-ia\\agentes'
const JSON_CLAUDE = JSON.stringify({
  model: { id: 'claude-opus-5-5', display_name: 'Opus 5.5' },
  context_window: { used_percentage: 10, context_window_size: 1_000_000 },
})

/** Disco em memoria + vigia que o teste dispara + relogio que o teste avanca. */
function montar(inicial: Record<string, string> = {}) {
  const arquivos = new Map(Object.entries(inicial).map(([n, t]) => [join(PASTA, n), Buffer.from(t)]))
  let aoMudar: ((nome: string) => void) | null = null
  let pendentes: { fn: () => void; ms: number; vivo: boolean }[] = []
  const recebidos: { quadroId: string; painel: PainelAgente }[] = []
  const disco: DiscoPonte = {
    criarPasta: () => undefined,
    escrever: (c, t) => void arquivos.set(c, Buffer.from(t)),
    ler: (c) => {
      const b = arquivos.get(c)
      if (!b) throw new Error('ENOENT')
      return b
    },
    apagar: (c) => void arquivos.delete(c),
    listar: () => [...arquivos.keys()].map((c) => c.slice(PASTA.length + 1)),
    vigiar: (_p, cb) => {
      aoMudar = cb
      return () => (aoMudar = null)
    },
  }
  const ponte = new PonteAgentes({
    pasta: PASTA,
    disco,
    agora: () => 1000,
    emitir: (quadroId, painel) => recebidos.push({ quadroId, painel }),
    adiar: (fn, ms) => {
      const p = { fn, ms, vivo: true }
      pendentes.push(p)
      return () => (p.vivo = false)
    },
  })
  const claudeGrava = (quadroId: string, texto: string): void => {
    arquivos.set(join(PASTA, `${quadroId}.json`), Buffer.from(texto))
    aoMudar?.(`${quadroId}.json`)
  }
  const passarTempo = (): void => {
    const agora = pendentes
    pendentes = []
    for (const p of agora) if (p.vivo) p.fn()
  }
  return { ponte, arquivos, recebidos, claudeGrava, passarTempo, vigiando: () => aoMudar !== null, pendentes: () => pendentes }
}

describe('PonteAgentes', () => {
  it('preparar grava o settings com a linha de status e devolve o caminho', () => {
    const { ponte, arquivos } = montar()
    const settings = ponte.preparar('q1')
    expect(settings).toBe(join(PASTA, 'q1.settings.json'))
    expect(JSON.parse(arquivos.get(join(PASTA, 'q1.settings.json'))!.toString())).toEqual({
      statusLine: { type: 'command', command: 'findstr "^" > "C:/Users/x/AppData/Roaming/lousa-ia/agentes/q1.json"' },
    })
  })

  it('id fora do formato nao vira nome de arquivo', () => {
    const { ponte, arquivos } = montar()
    expect(ponte.preparar('..\\..\\x')).toBeNull()
    expect(ponte.preparar('a b')).toBeNull()
    expect(arquivos.size).toBe(0)
  })

  it('o Claude grava: 250 ms depois do ultimo aviso le uma vez, avisa e guarda o ultimo', () => {
    const { ponte, recebidos, claudeGrava, passarTempo, pendentes } = montar()
    ponte.iniciar([])
    claudeGrava('q1', '{"model":')
    claudeGrava('q1', JSON_CLAUDE)
    expect(pendentes().map((p) => p.ms)).toEqual([ESPERA_MS, ESPERA_MS])
    passarTempo()
    expect(recebidos).toHaveLength(1)
    expect(recebidos[0]?.quadroId).toBe('q1')
    expect(recebidos[0]?.painel.modelo?.nome).toBe('Opus 5.5')
    expect(ponte.ultimo('q1')?.contexto).toEqual({ usado: 10, tamanho: 1_000_000 })
    expect(ponte.ultimo('q2')).toBeNull()
  })

  it('JSON quebrado ou arquivo que sumiu: nada e avisado; settings e nome estranho sao ignorados', () => {
    const { ponte, recebidos, claudeGrava, passarTempo, arquivos } = montar()
    ponte.iniciar([])
    claudeGrava('q1', 'nao e json')
    passarTempo()
    claudeGrava('q2', JSON_CLAUDE)
    arquivos.delete(join(PASTA, 'q2.json'))
    passarTempo()
    claudeGrava('q1.settings', JSON_CLAUDE) // o proprio settings mudando
    passarTempo()
    expect(recebidos).toEqual([])
  })

  it('esquecer apaga os dois arquivos, o ultimo painel e a leitura pendente', () => {
    const { ponte, recebidos, claudeGrava, passarTempo, arquivos } = montar()
    ponte.iniciar([])
    ponte.preparar('q1')
    claudeGrava('q1', JSON_CLAUDE)
    passarTempo()
    claudeGrava('q1', JSON_CLAUDE)
    ponte.esquecer('q1')
    passarTempo()
    expect(recebidos).toHaveLength(1)
    expect(ponte.ultimo('q1')).toBeNull()
    expect(arquivos.size).toBe(0)
  })

  it('ao iniciar, apaga so os arquivos de quadros que nao existem mais', () => {
    const { ponte, arquivos, vigiando } = montar({
      'q1.json': '{}',
      'q1.settings.json': '{}',
      'velho.json': '{}',
      'velho.settings.json': '{}',
      'leia-me.txt': 'x',
    })
    ponte.iniciar(['q1'])
    expect([...arquivos.keys()].map((c) => c.slice(PASTA.length + 1)).sort()).toEqual([
      'leia-me.txt',
      'q1.json',
      'q1.settings.json',
    ])
    expect(vigiando()).toBe(true)
    ponte.parar()
    expect(vigiando()).toBe(false)
  })
})

describe('linhaDeStatus e caminhoServe', () => {
  it('barra normal e aspas duplas, que o bash, o cmd e o PowerShell entendem', () => {
    expect(linhaDeStatus('C:\\a b\\q1.json').command).toBe('findstr "^" > "C:/a b/q1.json"')
  })

  it('caminho com $, crase, %, ! ou aspas fica sem painel', () => {
    expect(caminhoServe('C:\\Users\\Maria Jose\\AppData')).toBe(true)
    for (const ruim of ['C:\\Users\\a$b', 'C:\\x`y', 'C:\\%TEMP%', 'C:\\oi!', 'C:\\"x"']) {
      expect(caminhoServe(ruim), ruim).toBe(false)
    }
  })
})
