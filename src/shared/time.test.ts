import { describe, expect, it } from 'vitest'
import type { Ligacao, Quadro, Repo } from './model'
import {
  limparPapel,
  ligacoesValidas,
  mesmaPasta,
  nomeNoTime,
  podeLigar,
  raizDoRepo,
  textoDoTime,
  timeDe,
  type DadosTime,
} from './time'

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, repoId: string, perfilId = 'pessoal'): Quadro => ({
  id, repoId, perfilId, tipo: 'agente', titulo: id, caixa,
})
const linha = (de: string, para: string): Ligacao => ({ id: `${de}-${para}`, de, para, modo: 'automatico' })

const repos: Repo[] = [
  { id: 'app', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'pessoal' },
  { id: 'app-c1', nome: 'c1', caminho: 'C:\\app.copias\\c1', perfilPadraoId: 'pessoal',
    copia: { origemId: 'app', branch: 'lousa/c1', apelido: 'c1' } },
  { id: 'site', nome: 'site', caminho: 'C:\\site', perfilPadraoId: 'empresa' },
]

function dados(quadros: Quadro[], ligacoes: Ligacao[] = []): DadosTime {
  return { quadros, repos, ligacoes, provedores: { pessoal: 'claude', empresa: 'claude', gpt: 'codex' } }
}

describe('podeLigar', () => {
  it('liga dois agentes da mesma conta, mesmo em repos diferentes', () => {
    expect(podeLigar(dados([agente('a', 'app'), agente('b', 'site')]), 'a', 'b')).toEqual({ ok: true })
  })

  it('liga contas diferentes no mesmo repo e entre a original e uma copia dela', () => {
    const d = dados([agente('a', 'app'), agente('b', 'app', 'empresa'), agente('c', 'app-c1', 'empresa')])
    expect(podeLigar(d, 'a', 'b').ok).toBe(true)
    expect(podeLigar(d, 'a', 'c').ok).toBe(true)
  })

  it('recusa contas diferentes em repos diferentes', () => {
    const d = dados([agente('a', 'app'), agente('b', 'site', 'empresa')])
    expect(podeLigar(d, 'a', 'b')).toEqual({ ok: false, motivo: 'contas' })
  })

  it('recusa ligar a ele mesmo, repetida e inversa', () => {
    const d = dados([agente('a', 'app'), agente('b', 'app')], [linha('a', 'b')])
    expect(podeLigar(d, 'a', 'a')).toEqual({ ok: false, motivo: 'mesmoQuadro' })
    expect(podeLigar(d, 'a', 'b')).toEqual({ ok: false, motivo: 'repetida' })
    expect(podeLigar(d, 'b', 'a')).toEqual({ ok: false, motivo: 'repetida' })
  })

  it('recusa ciclo de 3; ramo que nao fecha circulo passa', () => {
    const d = dados([agente('a', 'app'), agente('b', 'app'), agente('c', 'app'), agente('d', 'app')], [
      linha('a', 'b'),
      linha('b', 'c'),
    ])
    expect(podeLigar(d, 'c', 'a')).toEqual({ ok: false, motivo: 'ciclo' })
    expect(podeLigar(d, 'a', 'c').ok).toBe(true)
    expect(podeLigar(d, 'b', 'd').ok).toBe(true)
  })

  it('recusa terminal puro, agente Codex e quadro que nao existe', () => {
    const terminal: Quadro = { ...agente('t', 'app'), tipo: 'terminal' }
    const d = dados([agente('a', 'app'), terminal, agente('x', 'app', 'gpt')])
    expect(podeLigar(d, 'a', 't')).toEqual({ ok: false, motivo: 'naoAgente' })
    expect(podeLigar(d, 'x', 'a')).toEqual({ ok: false, motivo: 'naoAgente' })
    expect(podeLigar(d, 'a', 'sumiu')).toEqual({ ok: false, motivo: 'naoAgente' })
  })
})

describe('ligacoesValidas', () => {
  it('tira a linha de quadro removido e a que ficou com contas que nao combinam', () => {
    const d = dados([agente('a', 'app'), agente('b', 'app'), agente('c', 'site', 'empresa')], [
      linha('a', 'b'),
      linha('a', 'sumiu'),
      linha('b', 'c'),
    ])
    expect(ligacoesValidas(d).map((l) => l.id)).toEqual(['a-b'])
  })
})

describe('timeDe', () => {
  it('acha o time por ligacao indireta, nos dois sentidos, comecando pelo quadro', () => {
    const ligacoes = [linha('a', 'b'), linha('c', 'b'), linha('x', 'y')]
    expect(timeDe(ligacoes, 'b')).toEqual(['b', 'a', 'c'])
    expect(timeDe(ligacoes, 'sozinho')).toEqual(['sozinho'])
  })
})

describe('raizDoRepo e mesmaPasta', () => {
  it('copia aponta para a original; mesma pasta so com o mesmo repoId', () => {
    expect(raizDoRepo(repos, 'app-c1')).toBe('app')
    expect(raizDoRepo(repos, 'site')).toBe('site')
    const quadros = [agente('a', 'app'), agente('b', 'app'), agente('c', 'app-c1')]
    expect(mesmaPasta(quadros, 'a', 'b')).toBe(true)
    expect(mesmaPasta(quadros, 'a', 'c')).toBe(false)
  })
})

describe('apresentacao do time (T29.1)', () => {
  const copia = (id: string, apelido: string): Repo => ({
    id, nome: `app ⑂ ${apelido}`, caminho: `C:/app.copias/${apelido}`, perfilPadraoId: 'pessoal',
    copia: { origemId: 'app', branch: `lousa/${apelido}`, apelido },
  })
  const base = (ligacoes: Ligacao[]): DadosTime => ({
    ...dados([{ ...agente('a', 'app'), papel: 'Construtor' }, agente('b', 'c1'), agente('c', 'c2')], ligacoes),
    repos: [...repos, copia('c1', 'claude-1'), copia('c2', 'claude-2')],
  })

  it('limparPapel tira quebra de linha e controle e corta em 40', () => {
    expect(limparPapel('  Re\nvisor\u001b[31m  ')).toBe('Re visor [31m')
    expect(limparPapel('x'.repeat(60))).toHaveLength(40)
    expect(limparPapel('\n\t')).toBe('')
  })

  it('nome: papel, senao apelido da copia, senao titulo', () => {
    const d = base([])
    expect(nomeNoTime(d, 'a')).toBe('Construtor')
    expect(nomeNoTime(d, 'b')).toBe('claude-1')
    expect(nomeNoTime({ ...d, repos }, 'b')).toBe('b')
  })

  it('cadeia: o do meio recebe de um e entrega para o outro; sozinho nao tem texto', () => {
    const d = base([linha('a', 'b'), linha('b', 'c')])
    const meio = textoDoTime(d, 'b') ?? ''
    expect(meio).toMatch(/^\[Lousa\] Você é claude-1 num time de 3 agentes\./)
    expect(meio).toContain('Você trabalha em C:/app.copias/claude-1 (branch lousa/claude-1).')
    expect(meio).toContain('Colegas: Construtor (pasta original app) · claude-2 (branch lousa/claude-2).')
    expect(meio).toContain('Você recebe o trabalho de Construtor.')
    expect(meio).toContain('o seu trabalho vai para claude-2.')
    // eslint-disable-next-line no-control-regex
    expect(meio).not.toMatch(/[\u0000-\u001f]/)
    expect(textoDoTime(d, 'a')).not.toContain('recebe o trabalho')
    expect(textoDoTime(base([]), 'a')).toBeNull()
  })

  it('papel com ; & | $ e acento grave nao chega ao texto (se o agente saiu, o PowerShell nao executa nada)', () => {
    const d = base([linha('a', 'b')])
    const malicioso = { ...d, quadros: d.quadros.map((q) => (q.id === 'a' ? { ...q, papel: 'X; rm -r ~ & y | $(z) `w`' } : q)) }
    expect(textoDoTime(malicioso, 'b')).not.toMatch(/[;&|$`]/)
    expect(textoDoTime(malicioso, 'b')).toContain('X rm -r ~ y (z) w')
  })
})
