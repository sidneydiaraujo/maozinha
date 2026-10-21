import { describe, expect, it } from 'vitest'
import type { AvisoAgente, EstadoAgente, Ligacao, Quadro, Repo } from '../../shared/model'
import { TEXTO_SAIU_DO_TIME, type DadosTime } from '../../shared/time'
import { ApresentadorTime, ESPERA_APRESENTAR_MS, FilaMensagens } from './apresentar'

function fila(estados: Record<string, EstadoAgente | 'fechado'>, comClaude = true) {
  const escrito: string[] = []
  const f = new FilaMensagens({
    aberto: (id) => estados[id] !== 'fechado',
    aviso: (id) => {
      const e = estados[id]
      return e && e !== 'fechado' ? { estado: e } : null
    },
    escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
    esperar: async () => {},
    temClaude: async () => comClaude,
  })
  return { f, escrito }
}

describe('FilaMensagens', () => {
  it('parado: digita o texto e depois o Enter, separados', async () => {
    const { f, escrito } = fila({ a: 'parado' })
    await f.mandar('a', 'oi')
    expect(escrito).toEqual(['a:oi', 'a:\r'])
  })

  it('parado mas sem claude.exe no terminal (saiu, ficou o PowerShell): nao digita e guarda', async () => {
    const { f, escrito } = fila({ a: 'parado' }, false)
    await f.mandar('a', 'oi')
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual([])
    expect(f.pendente('a')).toBe('oi')
  })

  it('trabalhando ou sem estado: espera; a mais nova substitui; ao parar digita uma vez', async () => {
    const { f, escrito } = fila({ a: 'trabalhando', b: 'fechado' })
    await f.mandar('a', 'velha')
    await f.mandar('a', 'nova')
    await f.mandar('b', 'fechado espera')
    expect(escrito).toEqual([])
    await f.aoEstado('a', { estado: 'esperando' } as AvisoAgente)
    expect(escrito).toEqual([])
    await f.aoEstado('a', { estado: 'terminou' })
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual(['a:nova', 'a:\r'])
    expect(f.pendente('b')).toBe('fechado espera')
    f.esquecer('b')
    expect(f.pendente('b')).toBeUndefined()
  })

  it('repasse (T30.1): fila em ordem, uma mensagem por parada, nada substitui', async () => {
    const { f, escrito } = fila({ a: 'trabalhando' })
    await f.enfileirar('a', 'primeiro')
    await f.enfileirar('a', 'segundo')
    expect(escrito).toEqual([])
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual(['a:primeiro', 'a:\r'])
    expect(f.emEspera('a')).toEqual(['segundo'])
    await f.aoEstado('a', { estado: 'trabalhando' })
    await f.aoEstado('a', { estado: 'terminou' })
    expect(escrito).toEqual(['a:primeiro', 'a:\r', 'a:segundo', 'a:\r'])
  })

  it('parado: o primeiro repasse vai na hora; o segundo espera ele parar de novo', async () => {
    const { f, escrito } = fila({ a: 'parado' })
    await f.enfileirar('a', 'um')
    await f.enfileirar('a', 'dois')
    expect(escrito).toEqual(['a:um', 'a:\r'])
    expect(f.emEspera('a')).toEqual(['dois'])
  })

  it('apresentacao pendente sai antes do repasse; avisa o que digitou', async () => {
    const tipos: string[] = []
    const escrito: string[] = []
    const f = new FilaMensagens(
      {
        aberto: () => true,
        aviso: () => ({ estado: 'trabalhando' }),
        escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
        esperar: async () => {},
        temClaude: async () => true,
      },
      (id, tipo) => tipos.push(`${id}:${tipo}`),
    )
    await f.enfileirar('a', 'repasse')
    await f.mandar('a', 'quem sou')
    await f.aoEstado('a', { estado: 'parado' })
    await f.aoEstado('a', { estado: 'trabalhando' })
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito.filter((e) => e !== 'a:\r')).toEqual(['a:quem sou', 'a:repasse'])
    expect(tipos).toEqual(['a:apresentacao', 'a:repasse'])
  })

  it('repasse sem claude.exe volta para o comeco da fila; esquecer limpa tudo', async () => {
    const { f, escrito } = fila({ a: 'parado' }, false)
    await f.enfileirar('a', 'um')
    await f.enfileirar('a', 'dois')
    expect(escrito).toEqual([])
    expect(f.emEspera('a')).toEqual(['um', 'dois'])
    f.esquecer('a')
    expect(f.emEspera('a')).toEqual([])
  })
})

const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
const agente = (id: string, perfilId = 'pessoal'): Quadro => ({ id, repoId: 'app', perfilId, tipo: 'agente', titulo: id, caixa })
const repos: Repo[] = [{ id: 'app', nome: 'app', caminho: 'C:/app', perfilPadraoId: 'pessoal' }]
const linha = (de: string, para: string): Ligacao => ({ id: `${de}-${para}`, de, para, modo: 'automatico' })

function montar() {
  let dados: DadosTime = { quadros: [agente('a'), agente('b'), agente('x', 'gpt')], repos, ligacoes: [], provedores: { pessoal: 'claude', gpt: 'codex' } }
  const mandados: Array<[string, string]> = []
  const adiados: Array<() => void> = []
  const ap = new ApresentadorTime({
    dados: () => dados,
    fila: { mandar: async (id, texto) => void mandados.push([id, texto]) },
    adiar: (fn, ms) => {
      expect(ms).toBe(ESPERA_APRESENTAR_MS)
      adiados.push(fn)
      const i = adiados.length - 1
      return () => void (adiados[i] = () => {})
    },
  })
  return { ap, mandados, adiados, mudar: (d: Partial<DadosTime>) => void (dados = { ...dados, ...d }) }
}

describe('ApresentadorTime', () => {
  it('varias mudancas seguidas: uma apresentacao so, para cada agente do time', () => {
    const { ap, mandados, adiados, mudar } = montar()
    mudar({ ligacoes: [linha('a', 'b')] })
    ap.mudou()
    ap.mudou()
    adiados.forEach((fn) => fn())
    expect(mandados.map(([id]) => id)).toEqual(['a', 'b'])
    expect(mandados[0]?.[1]).toContain('Você é a num time de 2 agentes')
  })

  it('so manda de novo o que mudou; quem saiu ouve que saiu, uma vez; Codex nunca ouve', () => {
    const { ap, mandados, mudar } = montar()
    mudar({ ligacoes: [linha('a', 'b')] })
    ap.apresentar()
    ap.apresentar()
    expect(mandados).toHaveLength(2)
    mudar({ ligacoes: [] })
    ap.apresentar()
    ap.apresentar()
    expect(mandados.slice(2)).toEqual([
      ['a', TEXTO_SAIU_DO_TIME],
      ['b', TEXTO_SAIU_DO_TIME],
    ])
    expect(mandados.some(([id]) => id === 'x')).toBe(false)
  })
})
