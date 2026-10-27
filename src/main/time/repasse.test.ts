import { describe, expect, it } from 'vitest'
import type { EventoRepasse, Ligacao, Quadro, Repo } from '../../shared/model'
import { textoDoRepasse, type DadosTime } from '../../shared/time'
import { ehDigitacao, fimDaVez, Repasse } from './repasse'

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, repoId: string, papel?: string): Quadro => ({
  id,
  repoId,
  perfilId: 'pessoal',
  tipo: 'agente',
  titulo: id,
  caixa,
  ...(papel ? { papel } : {}),
})
const repos: Repo[] = [
  { id: 'app', nome: 'app', caminho: 'C:/app', perfilPadraoId: 'pessoal' },
  { id: 'c3', nome: 'claude-3', caminho: 'C:/c3', perfilPadraoId: 'pessoal', copia: { origemId: 'app', branch: 'lousa/claude-3', apelido: 'claude-3' } },
  { id: 'c4', nome: 'claude-4', caminho: 'C:/c4', perfilPadraoId: 'pessoal', copia: { origemId: 'app', branch: 'lousa/claude-4', apelido: 'claude-4' } },
]
const linha = (de: string, para: string, extra: Partial<Ligacao> = {}): Ligacao => ({
  id: `${de}-${para}`,
  de,
  para,
  modo: 'automatico',
  ...extra,
})

function montar(ligacoes: Ligacao[], fechados: string[] = []) {
  const dados: DadosTime = {
    quadros: [agente('a', 'c3', 'Construtor'), agente('b', 'c4', 'Revisor'), agente('c', 'app')],
    repos,
    ligacoes,
    provedores: { pessoal: 'claude' },
  }
  const fila: Array<[string, string]> = []
  const eventos: EventoRepasse[] = []
  const r = new Repasse({
    dados: () => dados,
    fila: { enfileirar: async (id, texto) => void fila.push([id, texto]) },
    aberto: (id) => !fechados.includes(id),
    ajustar: (id, mudanca) => {
      dados.ligacoes = dados.ligacoes.map((l) => (l.id === id ? { ...l, ...mudanca } : l))
      return dados.ligacoes.find((l) => l.id === id) as Ligacao
    },
    avisar: (e) => void eventos.push(e),
  })
  /** Uma vez de trabalho do agente: trabalhando e depois terminou. */
  const vez = async (id: string, mensagem?: string): Promise<void> => {
    await r.aoEstado(id, 'trabalhando')
    await r.aoEstado(id, 'terminou', mensagem)
  }
  return { r, dados, fila, eventos, vez }
}

describe('fimDaVez', () => {
  it('terminou vale vindo de qualquer outro estado; parado so depois de trabalhando', () => {
    expect(fimDaVez('trabalhando', 'terminou')).toBe(true)
    expect(fimDaVez(undefined, 'terminou')).toBe(true)
    expect(fimDaVez('terminou', 'terminou')).toBe(false)
    expect(fimDaVez('trabalhando', 'parado')).toBe(true)
    expect(fimDaVez(undefined, 'parado')).toBe(false)
    expect(fimDaVez('terminou', 'parado')).toBe(false)
    expect(fimDaVez('trabalhando', 'esperando')).toBe(false)
  })
})

describe('ehDigitacao', () => {
  it('letra e Enter contam; resposta automatica do terminal (ESC) nao', () => {
    expect(ehDigitacao('a')).toBe(true)
    expect(ehDigitacao('\r')).toBe(true)
    expect(ehDigitacao('\x1b[I')).toBe(false)
    expect(ehDigitacao('\x1b[0;0;97;1;0;1_')).toBe(false)
    expect(ehDigitacao('\x7f')).toBe(false)
  })
})

describe('textoDoRepasse', () => {
  it('quem terminou, o que disse e a branch, sem caractere de shell', () => {
    const { dados } = montar([])
    expect(textoDoRepasse(dados, 'a', 'Fiz o login; rode $x | y')).toBe(
      '[Salazar] Seu colega Construtor terminou e disse: "Fiz o login rode x y". O trabalho dele está na branch lousa/claude-3. Veja o que mudou (git log e git diff nessa branch) e continue a sua parte.',
    )
    expect(textoDoRepasse(dados, 'c')).toContain('Seu colega c terminou. O trabalho dele está na pasta original app.')
  })
})

describe('Repasse', () => {
  it('automatico: o fim da vez do de poe o texto na fila do para e avisa a linha', async () => {
    const { fila, eventos, vez } = montar([linha('a', 'b')])
    await vez('a', 'pronto')
    expect(fila).toEqual([['b', expect.stringContaining('Construtor terminou e disse: "pronto"')]])
    expect(eventos).toEqual([{ ligacaoId: 'a-b', tipo: 'repassou', para: 'Revisor' }])
  })

  it('o Claude que volta direto a parado tambem passa; abrir parado nao', async () => {
    const { r, fila } = montar([linha('a', 'b')])
    await r.aoEstado('a', 'parado')
    expect(fila).toEqual([])
    await r.aoEstado('a', 'trabalhando')
    await r.aoEstado('a', 'parado')
    expect(fila).toHaveLength(1)
  })

  it('perguntar nao poe na fila: avisa; o botao passa com a ultima mensagem', async () => {
    const { r, fila, eventos, vez } = montar([linha('a', 'b', { modo: 'perguntar' })])
    await vez('a', 'feito')
    expect(fila).toEqual([])
    expect(eventos).toEqual([{ ligacaoId: 'a-b', tipo: 'perguntar', para: 'Revisor' }])
    await r.passar('a-b')
    expect(fila).toEqual([['b', expect.stringContaining('disse: "feito"')]])
  })

  it('pausada nao faz nada', async () => {
    const { fila, eventos, vez } = montar([linha('a', 'b', { pausada: true })])
    await vez('a')
    expect(fila).toEqual([])
    expect(eventos).toEqual([])
  })

  it('o quarto repasse seguido pausa a linha; digitar no time zera; Continuar retoma e passa', async () => {
    const { r, dados, fila, eventos, vez } = montar([linha('a', 'b')])
    for (let i = 0; i < 3; i++) await vez('a')
    expect(fila).toHaveLength(3)
    await vez('a')
    expect(fila).toHaveLength(3)
    expect(eventos.at(-1)).toMatchObject({ ligacaoId: 'a-b', tipo: 'limite', ligacao: { pausada: true } })
    expect(dados.ligacoes[0]?.pausada).toBe(true)
    await r.passar('a-b')
    expect(fila).toHaveLength(4)
    expect(dados.ligacoes[0]?.pausada).toBe(false)
    for (let i = 0; i < 3; i++) await vez('a')
    expect(fila).toHaveLength(7)
    r.digitou('b')
    await vez('a')
    expect(fila).toHaveLength(8)
  })

  it('o freio conta o time todo: a→b→c', async () => {
    const { fila, eventos, vez } = montar([linha('a', 'b'), linha('b', 'c')])
    await vez('a')
    await vez('b')
    await vez('a')
    await vez('b')
    expect(fila).toHaveLength(3)
    expect(eventos.at(-1)).toMatchObject({ ligacaoId: 'b-c', tipo: 'limite' })
  })

  it('para fechado: descarta e avisa; o botao tambem recusa', async () => {
    const { r, fila, eventos, vez } = montar([linha('a', 'b')], ['b'])
    await vez('a')
    expect(fila).toEqual([])
    expect(eventos).toEqual([{ ligacaoId: 'a-b', tipo: 'descartado', para: 'Revisor' }])
    await expect(r.passar('a-b')).rejects.toThrow('Revisor está fechado')
    await expect(r.passar('nada')).rejects.toThrow('Linha não encontrada')
  })

  it('duas linhas no mesmo para: entram na fila na ordem em que os de terminaram', async () => {
    const { fila, vez } = montar([linha('a', 'c'), linha('b', 'c')])
    await vez('b', 'revisei')
    await vez('a', 'construi')
    expect(fila.map(([id, t]) => [id, t.includes('revisei') ? 'b' : 'a'])).toEqual([
      ['c', 'b'],
      ['c', 'a'],
    ])
  })

  it('a resposta a uma apresentacao nao passa adiante; a vez seguinte passa', async () => {
    const { r, fila, vez } = montar([linha('a', 'b')])
    r.aoDigitar('a', 'apresentacao')
    await vez('a', 'ok')
    expect(fila).toEqual([])
    r.aoDigitar('a', 'repasse')
    await vez('a', 'trabalho')
    expect(fila).toHaveLength(1)
  })
})
