// C8: prova, com um terminal de verdade, que uma conta nao enxerga a outra (T2.2).
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Perfil } from '../../shared/model'
import { montarAmbiente } from '../perfis/ambiente'
import { ServicoTerminais } from './servico'
import { spawnReal } from './spawnReal'

// Os marcadores sao montados por concatenacao no PowerShell: o texto do comando
// nunca contem "CFG=" inteiro, entao so a saida de verdade casa com o regex.
const SCRIPT =
  "Write-Output (('C'+'FG=') + $env:CLAUDE_CONFIG_DIR + '|GT=' + $env:GITHUB_TOKEN + '|HM=' + $env:HOME" +
  " + '|AK=' + $env:ANTHROPIC_API_KEY + '|CX=' + $env:CODEX_HOME + '|OK=' + $env:OPENAI_API_KEY + '|FIM')"
const PADRAO = /CFG=([^|]*)\|GT=([^|]*)\|HM=([^|]*)\|AK=([^|]*)\|CX=([^|]*)\|OK=([^|]*)\|FIM/

const armadilhas = {
  CLAUDE_CONFIG_DIR: 'C:\\errado',
  CODEX_HOME: 'C:\\errado',
  GITHUB_TOKEN: 'vazou',
  HOME: 'C:\\casa-falsa',
  ANTHROPIC_API_KEY: 'vazou',
  OPENAI_API_KEY: 'vazou',
}

interface Lido {
  cfg: string
  gt: string
  hm: string
  ak: string
  cx: string
  ok: string
}

/** Roda o script num terminal real com o ambiente do perfil e devolve o que ele viu. */
function enxergar(perfil: Perfil): Promise<Lido> {
  const base = { ...process.env, ...armadilhas }
  return new Promise((resolver, rejeitar) => {
    let saida = ''
    const servico = new ServicoTerminais(spawnReal, {
      aoDados: (_id, dados) => {
        saida += dados
      },
      // No ConPTY parte da saida chega depois do evento de saida.
      aoSair: () =>
        setTimeout(() => {
          const m = PADRAO.exec(saida)
          if (!m) return rejeitar(new Error(`marcador nao encontrado na saida: ${JSON.stringify(saida)}`))
          const [, cfg = '', gt = '', hm = '', ak = '', cx = '', ok = ''] = m
          servico.fecharTodos()
          resolver({ cfg, gt, hm, ak, cx, ok })
        }, 500),
    })
    servico.abrir({
      terminalId: `iso:${perfil.id}`,
      cwd: process.cwd(),
      env: montarAmbiente(perfil, base),
      cols: 300,
      rows: 24,
      shell: { arquivo: 'powershell.exe', args: ['-NoLogo', '-NoProfile', '-Command', SCRIPT] },
    })
  })
}

const temp = (nome: string): string => mkdtempSync(join(tmpdir(), `lousa-${nome}-`))
const perfil = (id: string, provedor: Perfil['provedor'], ehPadrao: boolean, configDir: string): Perfil => ({
  id,
  provedor,
  nome: id,
  cor: '#000000',
  configDir,
  ehPadrao,
  raizes: [],
})

describe.runIf(process.platform === 'win32')('isolamento entre contas (terminal real)', () => {
  const pastaPessoal = temp('pessoal')
  const pastaCodex = temp('codex')
  const casos: Array<[Perfil, { cfg: string; cx: string }]> = [
    [perfil('principal', 'claude', true, 'C:\\qualquer'), { cfg: '', cx: '' }],
    [perfil('pessoal', 'claude', false, pastaPessoal), { cfg: pastaPessoal, cx: '' }],
    [perfil('cx:padrao', 'codex', true, 'C:\\qualquer'), { cfg: '', cx: '' }],
    [perfil('cx:trabalho', 'codex', false, pastaCodex), { cfg: '', cx: pastaCodex }],
  ]

  it.each(casos)('%s so enxerga a propria conta e nenhum segredo', async (p, esperado) => {
    const lido = await enxergar(p)
    expect(lido.cfg).toBe(esperado.cfg)
    expect(lido.cx).toBe(esperado.cx)
    expect([lido.gt, lido.hm, lido.ak, lido.ok]).toEqual(['', '', '', ''])
  }, 30_000)
})
