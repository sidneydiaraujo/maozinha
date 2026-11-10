import { describe, expect, it } from 'vitest'
import type { AvisoAgente, EstadoAgente, Ligacao, Quadro, Repo } from '../../shared/model'
import { TEXTO_SAIU_DO_TIME, type DadosTime } from '../../shared/time'
import { ApresentadorTime, DEMORA_MS, ESPERA_APRESENTAR_MS, FilaMensagens, REVISAR_MS, SEM_SINAL_MS } from './apresentar'

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
    pronto: () => false,
    temClaude: async () => comClaude,
  })
  return { f, escrito }
}

describe('FilaMensagens', () => {
  it('parado: digita o texto e depois o Enter, separados', async () => {
    const { f, escrito } = fila({ a: 'parado' })
    await f.enfileirar('a', 'oi')
    expect(escrito).toEqual(['a:oi', 'a:\r'])
  })

  it('D66: a apresentacao nunca e digitada sozinha, nem com o agente parado; espera o proximo trabalho', async () => {
    const { f, escrito } = fila({ a: 'parado' })
    await f.mandar('a', 'quem sou')
    await f.aoEstado('a', { estado: 'parado' })
    await f.aoPronto('a')
    await f.revisar()
    expect(escrito).toEqual([])
    expect(f.pendente('a')).toBe('quem sou')
  })

  it('parado mas sem claude.exe no terminal (saiu, ficou o PowerShell): nao digita e guarda os dois', async () => {
    const { f, escrito } = fila({ a: 'parado' }, false)
    await f.mandar('a', 'quem sou')
    await f.enfileirar('a', 'oi')
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual([])
    expect(f.pendente('a')).toBe('quem sou')
    expect(f.emEspera('a')).toEqual(['oi'])
  })

  it('troca de modelo esperando: a mensagem segura e sai para o agente reaberto (A15)', async () => {
    const escrito: string[] = []
    let trocando = true
    const f = new FilaMensagens({
      aberto: () => true,
      aviso: () => ({ estado: 'parado' }),
      escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
      esperar: async () => {},
      pronto: () => true,
      temClaude: async () => true,
      segurar: () => trocando,
    })
    await f.enfileirar('a', 'oi')
    await f.aoPronto('a')
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual([])
    trocando = false // reabriu com o modelo novo
    await f.aoPronto('a')
    expect(escrito).toEqual(['a:oi', 'a:\r'])
  })

  it('recem-aberto (sem estado): espera a linha de status; ao ficar pronto digita (D49)', async () => {
    const escrito: string[] = []
    let pronto = false
    const f = new FilaMensagens({
      aberto: () => true,
      aviso: () => null,
      escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
      esperar: async () => {},
      pronto: () => pronto,
      temClaude: async () => true,
    })
    await f.enfileirar('a', 'oi')
    await f.aoPronto('a')
    expect(escrito).toEqual([])
    pronto = true
    await f.aoPronto('a')
    expect(escrito).toEqual(['a:oi', 'a:\r'])
  })

  it('trabalhando: espera; a apresentacao mais nova substitui e vai na frente do trabalho, sem o pedido de "ok"', async () => {
    const { f, escrito } = fila({ a: 'trabalhando', b: 'fechado' })
    await f.mandar('a', 'velha. Responda só "ok".')
    await f.mandar('a', 'nova. Responda só "ok".')
    await f.enfileirar('a', 'tarefa')
    await f.mandar('b', 'fechado espera')
    expect(escrito).toEqual([])
    await f.aoEstado('a', { estado: 'esperando' } as AvisoAgente)
    expect(escrito).toEqual([])
    await f.aoEstado('a', { estado: 'terminou' })
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito).toEqual(['a:nova. tarefa', 'a:\r'])
    expect(f.pendente('a')).toBeUndefined()
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

  it('apresentacao guardada vai junto do primeiro repasse; o segundo vai sozinho; avisa como repasse', async () => {
    const tipos: string[] = []
    const escrito: string[] = []
    const f = new FilaMensagens(
      {
        aberto: () => true,
        aviso: () => ({ estado: 'trabalhando' }),
        escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
        esperar: async () => {},
        pronto: () => false,
        temClaude: async () => true,
      },
      (id, tipo) => tipos.push(`${id}:${tipo}`),
    )
    await f.enfileirar('a', 'um')
    await f.enfileirar('a', 'dois')
    await f.mandar('a', 'quem sou')
    await f.aoEstado('a', { estado: 'parado' })
    await f.aoEstado('a', { estado: 'trabalhando' })
    await f.aoEstado('a', { estado: 'parado' })
    expect(escrito.filter((e) => e !== 'a:\r')).toEqual(['a:quem sou um', 'a:dois'])
    expect(tipos).toEqual(['a:repasse', 'a:repasse'])
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

describe('FilaMensagens confere sozinha (A27)', () => {
  function relogioFila(estado: { e: EstadoAgente }, comClaude = { sim: true }) {
    const escrito: string[] = []
    const demoras: string[] = []
    const t = { agora: 0, perguntas: 0 }
    const f = new FilaMensagens({
      aberto: () => true,
      aviso: () => ({ estado: estado.e }),
      escrever: (id, dados) => void escrito.push(`${id}:${dados}`),
      esperar: async () => {},
      pronto: () => true,
      temClaude: async () => {
        t.perguntas++
        return comClaude.sim
      },
      agora: () => t.agora,
      aoDemorar: (id, detalhe) => void demoras.push(`${id} ${detalhe}`),
    })
    return { f, escrito, demoras, t }
  }

  it('a tarefa esperava um aviso que nao veio: com o agente parado, a revisao digita', async () => {
    const estado = { e: 'trabalhando' as EstadoAgente }
    const { f, escrito } = relogioFila(estado)
    await f.enfileirar('a', 'tarefa')
    await f.revisar()
    expect(escrito).toEqual([])
    estado.e = 'terminou' // o agente parou, mas o aviso nao chegou a fila
    await f.revisar()
    expect(escrito).toEqual(['a:tarefa', 'a:\r'])
  })

  it('digitou e o agente nao deu sinal: a proxima so sai depois de SEM_SINAL_MS', async () => {
    const { f, escrito, t } = relogioFila({ e: 'parado' })
    await f.enfileirar('a', 'apresentacao')
    await f.enfileirar('a', 'tarefa')
    expect(escrito).toEqual(['a:apresentacao', 'a:\r'])
    t.agora = SEM_SINAL_MS - 1
    await f.revisar()
    expect(f.emEspera('a')).toEqual(['tarefa'])
    t.agora = SEM_SINAL_MS
    await f.revisar()
    expect(escrito).toEqual(['a:apresentacao', 'a:\r', 'a:tarefa', 'a:\r'])
  })

  it('sem claude.exe: a revisao nao pergunta ao Windows de novo antes de SEM_SINAL_MS', async () => {
    const comClaude = { sim: false }
    const { f, escrito, t } = relogioFila({ e: 'parado' }, comClaude)
    await f.enfileirar('a', 'tarefa')
    expect(t.perguntas).toBe(1)
    t.agora = REVISAR_MS
    await f.revisar()
    expect(t.perguntas).toBe(1)
    comClaude.sim = true
    t.agora = SEM_SINAL_MS
    await f.revisar()
    expect(t.perguntas).toBe(2)
    expect(escrito).toEqual(['a:tarefa', 'a:\r'])
  })

  it('esperando ha mais de DEMORA_MS: uma linha no registro com o porque, uma vez so', async () => {
    const { f, demoras, t } = relogioFila({ e: 'trabalhando' })
    await f.enfileirar('a', 'tarefa')
    await f.revisar()
    t.agora = DEMORA_MS - 1
    await f.revisar()
    expect(demoras).toEqual([])
    t.agora = DEMORA_MS
    await f.revisar()
    await f.revisar()
    expect(demoras).toEqual(['a aberto=true estado=trabalhando pronto=true digitou=nao segurando=false semClaude=false naFila=1 apresentacao=false'])
  })
})

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
