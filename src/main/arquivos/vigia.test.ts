import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Repo } from '../../shared/model'
import { ATRASO_MS, VigiaArquivos, type Observar } from './vigia'

const repo = (id: string, caminho = `C:\\${id}`): Repo => ({ id, nome: id, caminho, perfilPadraoId: 'principal' })
const pasta = (repoId: string, relativo = '') => ({ repoId, relativo })

function montar() {
  const ativos = new Map<string, { mudar(nome: string): void; falhar(): void }>()
  const fechados: string[] = []
  const observar: Observar = (caminho, aoMudar, aoFalhar) => {
    ativos.set(caminho, { mudar: aoMudar, falhar: aoFalhar })
    return {
      fechar: () => {
        fechados.push(caminho)
        ativos.delete(caminho)
      },
    }
  }
  const avisos: Array<[string, string[]]> = []
  const vigia = new VigiaArquivos(observar, (repoId, caminhos) => avisos.push([repoId, caminhos]))
  return { vigia, ativos, fechados, avisos }
}

describe('VigiaArquivos', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('vigia so as pastas pedidas, cada uma no seu caminho dentro da pasta salva', () => {
    const { vigia, ativos } = montar()
    vigia.sincronizar([pasta('a'), pasta('a', 'docs'), pasta('a', 'src/lib')], [repo('a')])
    expect([...ativos.keys()].sort()).toEqual(['C:\\a', 'C:\\a\\docs', 'C:\\a\\src\\lib'])
  })

  it('junta os eventos de 75 ms num lote, com o caminho a partir da pasta salva', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([pasta('a'), pasta('a', 'docs')], [repo('a')])
    const raiz = ativos.get('C:\\a')
    const docs = ativos.get('C:\\a\\docs')
    docs?.mudar('x.md')
    docs?.mudar('x.md')
    raiz?.mudar('.git')
    raiz?.mudar('node_modules')
    raiz?.mudar('README.md')
    expect(avisos).toEqual([])
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([['a', ['docs/x.md', 'README.md']]])
  })

  it('so mudanca ignorada nao gera aviso', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([pasta('a')], [repo('a')])
    ativos.get('C:\\a')?.mudar('.git')
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
  })

  it('sincronizar abre as novas, fecha as que sairam e reabre a pasta salva que mudou de lugar', () => {
    const { vigia, ativos, fechados } = montar()
    vigia.sincronizar([pasta('a'), pasta('b'), pasta('b', 'src')], [repo('a'), repo('b')])
    vigia.sincronizar([pasta('b'), pasta('c')], [repo('b', 'C:\\b2'), repo('c')])
    expect(fechados.sort()).toEqual(['C:\\a', 'C:\\b', 'C:\\b\\src'])
    expect([...ativos.keys()].sort()).toEqual(['C:\\b2', 'C:\\c'])
  })

  it('pedido repetido nao reabre nada', () => {
    const { vigia, fechados } = montar()
    vigia.sincronizar([pasta('a', 'src')], [repo('a')])
    vigia.sincronizar([pasta('a', 'src')], [repo('a')])
    expect(fechados).toEqual([])
  })

  it('pasta de fora da pasta salva ou de pasta que nao existe mais e ignorada', () => {
    const { vigia, ativos } = montar()
    vigia.sincronizar([pasta('a', '..\\fora'), pasta('a', 'C:\\Windows'), pasta('sumiu')], [repo('a')])
    expect(ativos.size).toBe(0)
  })

  it('pasta que falha para de ser vigiada', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([pasta('a')], [repo('a')])
    const a = ativos.get('C:\\a')
    a?.falhar()
    a?.mudar('x.md')
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
    expect(ativos.size).toBe(0)
  })

  it('fecharTodos fecha tudo e descarta o pendente', () => {
    const { vigia, ativos, avisos } = montar()
    vigia.sincronizar([pasta('a'), pasta('b')], [repo('a'), repo('b')])
    ativos.get('C:\\a')?.mudar('x.md')
    vigia.fecharTodos()
    vi.advanceTimersByTime(ATRASO_MS)
    expect(avisos).toEqual([])
    expect(ativos.size).toBe(0)
  })
})
