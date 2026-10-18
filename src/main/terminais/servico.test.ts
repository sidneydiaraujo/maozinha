import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../shared/model'
import { ServicoTerminais, type Descartavel, type PtyLike, type Spawner } from './servico'
import { respostaEmTeclas } from './status'

class PtyFalso implements PtyLike {
  escritos: string[] = []
  tamanhos: Array<[number, number]> = []
  mortes = 0
  descartados = 0
  private dados: Array<(d: string) => void> = []
  private saidas: Array<(e: { exitCode: number }) => void> = []
  onData(cb: (d: string) => void): Descartavel {
    this.dados.push(cb)
    return { dispose: () => void this.descartados++ }
  }
  onExit(cb: (e: { exitCode: number }) => void): Descartavel {
    this.saidas.push(cb)
    return { dispose: () => void this.descartados++ }
  }
  write(d: string): void {
    this.escritos.push(d)
  }
  resize(c: number, r: number): void {
    this.tamanhos.push([c, r])
  }
  kill(): void {
    this.mortes++
  }
  emitir(d: string): void {
    this.dados.forEach((cb) => cb(d))
  }
  sair(codigo = 0): void {
    this.saidas.forEach((cb) => cb({ exitCode: codigo }))
  }
}

function montar(limite?: number) {
  const ptys: PtyFalso[] = []
  const chamadas: Array<{ arquivo: string; args: string[]; cwd: string; cols: number; rows: number }> = []
  const spawn: Spawner = (arquivo, args, o) => {
    const pty = new PtyFalso()
    ptys.push(pty)
    chamadas.push({ arquivo, args, cwd: o.cwd, cols: o.cols, rows: o.rows })
    return pty
  }
  const dados: Array<[string, string]> = []
  const saidas: Array<[string, number]> = []
  const estados: Array<[string, AvisoAgente]> = []
  const servico = new ServicoTerminais(
    spawn,
    {
      aoDados: (id, d) => void dados.push([id, d]),
      aoSair: (id, c) => void saidas.push([id, c]),
      aoEstado: (id, a) => void estados.push([id, a]),
    },
    limite,
  )
  return { servico, ptys, chamadas, dados, saidas, estados }
}

const pedido = { terminalId: 't1', cwd: 'C:\\repo', env: { A: '1' }, cols: 80, rows: 24 }

describe('ServicoTerminais', () => {
  it('abrir e idempotente: nao chama spawn de novo e devolve o buffer', () => {
    const { servico, ptys, chamadas } = montar()
    expect(servico.abrir(pedido)).toEqual({ bufferInicial: '', jaEstavaAberto: false })
    ptys[0]!.emitir('ola ')
    ptys[0]!.emitir('mundo')
    expect(servico.abrir(pedido)).toEqual({ bufferInicial: 'ola mundo', jaEstavaAberto: true })
    expect(chamadas).toHaveLength(1)
  })

  it('usa powershell -NoLogo por padrao e respeita o shell pedido', () => {
    const { servico, chamadas } = montar()
    servico.abrir(pedido)
    servico.abrir({ ...pedido, terminalId: 't2', shell: { arquivo: 'cmd.exe', args: ['/k'] } })
    expect(chamadas.map((c) => [c.arquivo, c.args])).toEqual([
      ['powershell.exe', ['-NoLogo']],
      ['cmd.exe', ['/k']],
    ])
  })

  it('o buffer corta o comeco quando passa do limite', () => {
    const { servico, ptys } = montar(10)
    servico.abrir(pedido)
    ptys[0]!.emitir('0123456789')
    ptys[0]!.emitir('ABCDE')
    expect(servico.abrir(pedido).bufferInicial).toBe('56789ABCDE')
  })

  it('escreve o comando inicial logo depois de abrir', () => {
    const { servico, ptys } = montar()
    servico.abrir({ ...pedido, comandoInicial: 'claude\r' })
    expect(ptys[0]!.escritos).toEqual(['claude\r'])
  })

  it('repassa dados e saida aos ouvintes; apos sair, fechar nao chama kill', () => {
    const { servico, ptys, dados, saidas } = montar()
    servico.abrir(pedido)
    ptys[0]!.emitir('x')
    ptys[0]!.sair(3)
    expect(dados).toEqual([['t1', 'x']])
    expect(saidas).toEqual([['t1', 3]])
    expect(servico.estaAberto('t1')).toBe(false)
    servico.fechar('t1')
    expect(ptys[0]!.mortes).toBe(0)
    expect(ptys[0]!.descartados).toBe(2)
  })

  it('id que ja saiu abre um shell novo', () => {
    const { servico, ptys, chamadas } = montar()
    servico.abrir(pedido)
    ptys[0]!.sair()
    expect(servico.abrir(pedido).jaEstavaAberto).toBe(false)
    expect(chamadas).toHaveLength(2)
  })

  it('fechar de terminal vivo chama kill uma vez e remove o id', () => {
    const { servico, ptys } = montar()
    servico.abrir(pedido)
    servico.fechar('t1')
    servico.fechar('t1')
    expect(ptys[0]!.mortes).toBe(1)
    expect(servico.estaAberto('t1')).toBe(false)
  })

  it('fecharTodos fecha todos', () => {
    const { servico, ptys } = montar()
    servico.abrir(pedido)
    servico.abrir({ ...pedido, terminalId: 't2' })
    servico.fecharTodos()
    expect(ptys.map((p) => p.mortes)).toEqual([1, 1])
  })

  it('escrever e redimensionar em id desconhecido ou encerrado nao fazem nada', () => {
    const { servico, ptys } = montar()
    expect(() => servico.escrever('nada', 'x')).not.toThrow()
    expect(() => servico.redimensionar('nada', 10, 10)).not.toThrow()
    servico.abrir(pedido)
    ptys[0]!.sair()
    servico.escrever('t1', 'x')
    servico.redimensionar('t1', 10, 10)
    expect(ptys[0]!.escritos).toEqual([])
    expect(ptys[0]!.tamanhos).toEqual([])
  })

  it('limita cols e rows entre 2 e 500', () => {
    const { servico, ptys, chamadas } = montar()
    servico.abrir({ ...pedido, cols: 0, rows: 9999 })
    expect([chamadas[0]!.cols, chamadas[0]!.rows]).toEqual([2, 500])
    servico.redimensionar('t1', 1, 1000)
    servico.redimensionar('t1', 120, 40)
    expect(ptys[0]!.tamanhos).toEqual([[2, 500], [120, 40]])
  })

  it('com status: responde a pergunta do Claude e avisa cada estado novo uma vez', () => {
    const { servico, ptys, estados } = montar()
    servico.abrir({ ...pedido, status: true })
    ptys[0]!.emitir(']7501;?')
    expect(ptys[0]!.escritos).toEqual([respostaEmTeclas()])
    ptys[0]!.emitir(']7501;state=working:app=claude-code')
    ptys[0]!.emitir(']7501;state=working:app=claude-code')
    ptys[0]!.emitir(']7501;state=blocked:app=claude-code:kind=question')
    expect(estados).toEqual([
      ['t1', { estado: 'trabalhando' }],
      ['t1', { estado: 'esperando', motivo: 'pergunta' }],
    ])
    expect(servico.aviso('t1')).toEqual({ estado: 'esperando', motivo: 'pergunta' })
  })

  it('sem status (login, padrao): nao responde nem le estados', () => {
    const { servico, ptys, estados } = montar()
    servico.abrir(pedido)
    ptys[0]!.emitir(']7501;?]7501;state=done')
    expect(ptys[0]!.escritos).toEqual([])
    expect(estados).toEqual([])
    expect(servico.aviso('t1')).toBeNull()
  })
})
