import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { ESTADO_PADRAO, type Armazem } from '../estado/armazem'
import { MAXIMO_LETRAS_NOTA, ServicoNotas } from './servico'

function armazemNaMemoria(inicial: Partial<EstadoSalvo> = {}): Armazem & { estado: EstadoSalvo } {
  const a = {
    estado: { ...structuredClone(ESTADO_PADRAO), ...inicial },
    carregar: () => structuredClone(a.estado),
    salvar: (e: EstadoSalvo) => {
      a.estado = structuredClone(e)
    },
  }
  return a
}

let n = 0
const novoId = (): string => `n${++n}`

describe('ServicoNotas', () => {
  it('cria nota vazia onde pediu e guarda', () => {
    const armazem = armazemNaMemoria()
    const nota = new ServicoNotas({ armazem, novoId }).criar({ x: 10, y: 20 })
    expect(nota).toMatchObject({ texto: '', caixa: { x: 10, y: 20 } })
    expect(armazem.estado.notas).toEqual([nota])
  })

  it('nao nasce em cima de um quadro', () => {
    const caixa = { x: 0, y: 0, largura: 640, altura: 420 }
    const armazem = armazemNaMemoria({
      quadros: [{ id: 'q1', repoId: 'r', perfilId: 'p', tipo: 'terminal', titulo: 'Terminal 1', caixa }],
    })
    const nota = new ServicoNotas({ armazem, novoId }).criar({ x: 100, y: 100 })
    const c = nota.caixa
    expect(c.x >= 640 || c.y >= 420 || c.x + c.largura <= 0 || c.y + c.altura <= 0).toBe(true)
  })

  it('salvar troca o texto; nota que nao existe ou texto grande demais lanca', () => {
    const armazem = armazemNaMemoria()
    const s = new ServicoNotas({ armazem, novoId })
    const nota = s.criar({ x: 0, y: 0 })
    s.salvar(nota.id, '# plano\n- [ ] testar')
    expect(armazem.estado.notas?.[0]?.texto).toBe('# plano\n- [ ] testar')
    expect(() => s.salvar('nao-existe', 'x')).toThrow('Nota não encontrada')
    expect(() => s.salvar(nota.id, 'x'.repeat(MAXIMO_LETRAS_NOTA + 1))).toThrow('passou de')
  })

  it('remover tira a nota; remover de novo nao e erro', () => {
    const armazem = armazemNaMemoria()
    const s = new ServicoNotas({ armazem, novoId })
    const nota = s.criar({ x: 0, y: 0 })
    s.remover(nota.id)
    s.remover(nota.id)
    expect(armazem.estado.notas).toEqual([])
  })
})
