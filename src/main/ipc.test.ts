import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

// R4.24: a porta de entrada de todo canal. O ipcMain e falso: guardamos o que cada canal registrou.
const canais = vi.hoisted(() => new Map<string, (evento: unknown, bruto: unknown) => Promise<unknown>>())
vi.mock('electron', () => ({
  ipcMain: { handle: (canal: string, fn: (evento: unknown, bruto: unknown) => Promise<unknown>) => canais.set(canal, fn) },
}))
vi.mock('./log', () => ({ log: () => undefined }))

const { handle } = await import('./ipc')
const { paginaDoApp } = await import('./paginaDoApp')

const daTela = { senderFrame: { url: paginaDoApp().arquivo } }
const chamar = (canal: string, bruto: unknown, evento: unknown = daTela) => canais.get(canal)!(evento, bruto)

describe('handle (R4.24)', () => {
  const executar = vi.fn((entrada: { quadroId: string }) => `ok ${entrada.quadroId}`)
  beforeEach(() => {
    executar.mockClear()
    handle('teste:canal', z.object({ quadroId: z.string().min(1) }), executar)
  })

  it('da propria pagina e com a entrada certa: executa so com os campos do schema', async () => {
    await expect(chamar('teste:canal', { quadroId: 'q1', cwd: 'C:\\Windows', comando: 'calc' })).resolves.toBe('ok q1')
    expect(executar).toHaveBeenCalledWith({ quadroId: 'q1' })
  })

  it('origem de fora (caminho de rede, site, sem quadro): recusa sem executar', async () => {
    for (const url of ['file://servidor/x.html', 'https://mal.com/', 'http://localhost:5173.mal.com/', '']) {
      await expect(chamar('teste:canal', { quadroId: 'q1' }, { senderFrame: { url } })).rejects.toThrow(/IPC recusado/)
    }
    await expect(chamar('teste:canal', { quadroId: 'q1' }, {})).rejects.toThrow(/IPC recusado/)
    expect(executar).not.toHaveBeenCalled()
  })

  it('entrada fora do formato (tipo errado, vazio, nada, lixo): recusa sem executar', async () => {
    for (const bruto of [{ quadroId: 1 }, { quadroId: '' }, undefined, 'q1', ['q1'], { quadroId: { toString: 'x' } }]) {
      await expect(chamar('teste:canal', bruto)).rejects.toThrow()
    }
    expect(executar).not.toHaveBeenCalled()
  })

  it('erro da regra volta para a tela', async () => {
    handle('teste:erro', z.object({}), () => {
      throw new Error('Quadro não encontrado')
    })
    await expect(chamar('teste:erro', {})).rejects.toThrow('Quadro não encontrado')
  })
})
