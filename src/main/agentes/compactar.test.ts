import { describe, expect, it } from 'vitest'
import type { AvisoAgente, Quadro } from '../../shared/model'
import { compactar, GUARDAR_CAIXA, mostraMenuDoCompact, TEXTO_SEM_MENU, type DepsCompactar } from './compactar'

function deps(
  tipo: Quadro['tipo'],
  aviso: AvisoAgente | null,
  { aberto = true, pronto = false, claude = true, menu = true } = {},
): DepsCompactar & { escrito: string[] } {
  const escrito: string[] = []
  return {
    escrito,
    quadro: (id): Quadro => ({ id, repoId: 'r', perfilId: 'p', tipo, titulo: 'x', caixa: { x: 0, y: 0, largura: 400, altura: 300 } }),
    aberto: () => aberto,
    aviso: () => aviso,
    pronto: () => pronto,
    temClaude: async () => claude,
    escrever: (_id, dados) => escrito.push(dados),
    esperar: async () => {},
    // marca quando a Lousa passou a olhar a saida: tem de ser antes de digitar o /compact
    aguardarSaida: async () => {
      escrito.push('[olhando]')
      return menu
    },
  }
}

/** Ctrl+S guarda a caixa (A28), a Lousa olha a saida, digita o comando e, com o menu, o Enter. */
const ENVIOU = [GUARDAR_CAIXA, '[olhando]', '/compact', '\r']

describe('compactar', () => {
  it('agente parado: guarda a caixa, /compact e depois o Enter, separados', async () => {
    const d = deps('agente', { estado: 'parado' })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(ENVIOU)
  })

  it('agente que terminou tambem pode', async () => {
    const d = deps('agente', { estado: 'terminou' })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(ENVIOU)
  })

  it('recem-aberto, sem estado mas com a linha de status: pode (D49)', async () => {
    const d = deps('agente', null, { pronto: true })
    await compactar(d, 'q1')
    expect(d.escrito).toEqual(ENVIOU)
  })

  it('A28: sem o menu do comando, apaga o que digitou, devolve a caixa e nao aperta Enter', async () => {
    const d = deps('agente', { estado: 'parado' }, { menu: false })
    await expect(compactar(d, 'q1')).rejects.toThrow(TEXTO_SEM_MENU)
    expect(d.escrito).toEqual([GUARDAR_CAIXA, '[olhando]', '/compact', '\x7f'.repeat(8), GUARDAR_CAIXA])
    expect(d.escrito).not.toContain('\r')
  })

  it('parado mas o Claude ja saiu: recusa, nada cai no PowerShell (D39)', async () => {
    const d = deps('agente', { estado: 'parado' }, { claude: false })
    await expect(compactar(d, 'q1')).rejects.toThrow('não está rodando')
    expect(d.escrito).toEqual([])
  })

  it('trabalhando, esperando ou sem estado e sem linha de status: recusa e nao escreve nada', async () => {
    for (const aviso of [{ estado: 'trabalhando' }, { estado: 'esperando' }, null] as const) {
      const d = deps('agente', aviso)
      await expect(compactar(d, 'q1')).rejects.toThrow('Espere o agente parar')
      expect(d.escrito).toEqual([])
    }
  })

  it('terminal comum ou terminal fechado: recusa', async () => {
    await expect(compactar(deps('terminal', { estado: 'parado' }), 'q1')).rejects.toThrow('Só um agente')
    await expect(compactar(deps('agente', { estado: 'parado' }, { aberto: false }), 'q1')).rejects.toThrow('não está aberto')
  })
})

describe('mostraMenuDoCompact (A28)', () => {
  const esc = String.fromCharCode(27)
  it('acha a descricao do /compact no meio das sequencias do terminal (como no claude.exe 2.1.317)', () => {
    expect(mostraMenuDoCompact(`${esc}[2m❯ /compact${esc}[3CFree${esc}[1Cup context by summarizing`)).toBe(true)
  })

  it('rascunho antigo na frente do comando: o menu nao abre', () => {
    expect(mostraMenuDoCompact(`${esc}]0;titulo${String.fromCharCode(7)}rascunho antigo/compact`)).toBe(false)
  })
})
