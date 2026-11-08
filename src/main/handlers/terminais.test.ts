import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Perfil, Quadro, Repo } from '../../shared/model'

// R4.24: o canal que abre terminais. A tela manda so o id do quadro; pasta, conta, ambiente e
// comando saem do que o main guardou, mesmo que a tela mande mais coisa.
const canais = vi.hoisted(() => new Map<string, (evento: unknown, bruto: unknown) => Promise<unknown>>())
vi.mock('electron', () => ({
  app: { getPath: (nome: string) => (nome === 'home' ? 'C:\\Users\\ana' : 'C:\\dados'), isPackaged: false },
  ipcMain: { handle: (canal: string, fn: (evento: unknown, bruto: unknown) => Promise<unknown>) => canais.set(canal, fn) },
}))
vi.mock('../log', () => ({ log: () => undefined }))
vi.mock('../kanban/disco', () => ({ prepararKanban: () => null }))
vi.mock('../quadros/sessoes', () => ({ acharSessao: () => null }))

const { IPC } = await import('../../shared/ipc')
const { paginaDoApp } = await import('../paginaDoApp')
const { registrarHandlersTerminais } = await import('./terminais')

const pessoal: Perfil = {
  id: 'pessoal',
  provedor: 'claude',
  nome: 'Pessoal',
  cor: '#123456',
  configDir: 'C:\\Users\\ana\\.claude-pessoal',
  ehPadrao: false,
  raizes: [],
}
const repo: Repo = { id: 'r1', nome: 'app', caminho: 'C:\\projetos\\app', perfilPadraoId: 'pessoal' }
const quadro: Quadro = {
  id: 'q1',
  repoId: 'r1',
  perfilId: 'pessoal',
  tipo: 'agente',
  titulo: 'Claude 1',
  caixa: { x: 0, y: 0, largura: 1, altura: 1 },
  kanban: false,
}

const abrir = vi.fn((_p: { cwd: string; env: Record<string, string>; comandoInicial?: string }) => ({ bufferInicial: '' }))
const escrever = vi.fn()
const servicos = {
  terminais: { abrir, aviso: () => null, escrever, fechar: vi.fn(), redimensionar: vi.fn() },
  perfis: { obter: (id: string) => (id === 'pessoal' ? pessoal : { ...pessoal, id, ehPadrao: true, configDir: 'C:\\Users\\ana\\.claude' }) },
  quadros: { dormir: vi.fn(), comSessao: (id: string) => (id === 'q1' ? quadro : (() => { throw new Error('Quadro não encontrado') })()) },
  repos: { obter: () => repo },
  agentes: { preparar: () => null, prepararMcp: () => null },
  repasse: { digitou: vi.fn() },
  vigia: { avisarAgora: vi.fn() },
  mcp: { configDo: () => null },
}
registrarHandlersTerminais(servicos as never)

const daTela = { senderFrame: { url: paginaDoApp().arquivo } }
const chamar = (canal: string, bruto: unknown) => canais.get(canal)!(daTela, bruto)

describe('terminais:abrir (R4.24)', () => {
  beforeEach(() => {
    abrir.mockClear()
    process.env['MEU_TOKEN'] = 'segredo'
    process.env['ANTHROPIC_API_KEY'] = 'chave'
  })

  it('pasta, conta e comando vem do quadro salvo, nao do que a tela manda junto', async () => {
    await chamar(IPC.terminaisAbrir, {
      alvo: { tipo: 'quadro', quadroId: 'q1', cwd: 'C:\\Windows', perfilId: 'principal', comando: 'calc' },
      cols: 80,
      rows: 24,
      cwd: 'C:\\Windows',
      env: { HOME: 'C:\\x', CLAUDE_CONFIG_DIR: 'C:\\Users\\ana\\.claude' },
      comandoInicial: 'calc',
    })
    const p = abrir.mock.calls[0]![0]
    expect(p.cwd).toBe(repo.caminho)
    expect(p.env['CLAUDE_CONFIG_DIR']).toBe(pessoal.configDir)
    expect(p.comandoInicial ?? '').not.toContain('calc')
  })

  it('o ambiente nao leva tokens, chaves nem HOME do PC', async () => {
    await chamar(IPC.terminaisAbrir, { alvo: { tipo: 'quadro', quadroId: 'q1' }, cols: 80, rows: 24 })
    const env = abrir.mock.calls[0]![0].env
    expect(env['MEU_TOKEN']).toBeUndefined()
    expect(env['ANTHROPIC_API_KEY']).toBeUndefined()
    expect(env['HOME']).toBeUndefined()
    expect(env['CODEX_HOME']).toBeUndefined()
  })

  it('quadro que nao existe, tamanho absurdo ou alvo inventado: recusa sem abrir', async () => {
    const ruins = [
      { alvo: { tipo: 'quadro', quadroId: 'zz' }, cols: 80, rows: 24 },
      { alvo: { tipo: 'quadro', quadroId: 'q1' }, cols: 99999, rows: 24 },
      { alvo: { tipo: 'quadro', quadroId: '' }, cols: 80, rows: 24 },
      { alvo: { tipo: 'pasta', caminho: 'C:\\' }, cols: 80, rows: 24 },
      { alvo: { tipo: 'quadro', quadroId: 'q1' } },
    ]
    for (const bruto of ruins) await expect(chamar(IPC.terminaisAbrir, bruto)).rejects.toThrow()
    expect(abrir).not.toHaveBeenCalled()
  })
})

describe('terminais:escrever (R4.24)', () => {
  it('texto acima de 1 MB ou terminal sem id: recusa sem escrever', async () => {
    escrever.mockClear()
    await expect(chamar(IPC.terminaisEscrever, { terminalId: 'q1', dados: 'x'.repeat(1_000_001) })).rejects.toThrow()
    await expect(chamar(IPC.terminaisEscrever, { terminalId: '', dados: 'a' })).rejects.toThrow()
    await expect(chamar(IPC.terminaisEscrever, { terminalId: 7, dados: 'a' })).rejects.toThrow()
    expect(escrever).not.toHaveBeenCalled()
  })

  it('digitacao do Sidney zera o freio do time', async () => {
    servicos.repasse.digitou.mockClear()
    await chamar(IPC.terminaisEscrever, { terminalId: 'q1', dados: 'a' })
    expect(escrever).toHaveBeenCalledWith('q1', 'a')
    expect(servicos.repasse.digitou).toHaveBeenCalledWith('q1')
  })
})
