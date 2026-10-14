import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { criarArmazem } from './armazem'
import { migrar } from './migrar'

// Retrato do estado real de 14/10/2026 (lousa com moldura), encurtado.
const v1 = {
  versao: 1,
  perfis: {},
  repos: [
    { id: 'r1', nome: 'pessoal', caminho: 'C:\\pessoal', perfilPadraoId: 'pessoal', caixa: { x: 40, y: 40, largura: 920, altura: 620 } },
  ],
  quadros: [
    { id: 'q1', repoId: 'r1', perfilId: 'principal', tipo: 'agente', titulo: 'Claude 1', caixa: { x: 30, y: 62, largura: 545, altura: 673 } },
    { id: 'q2', repoId: 'sumiu', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 2', caixa: { x: 5, y: 6, largura: 440, altura: 280 } },
  ],
  viewport: { x: -223, y: 1368, zoom: 0.35 },
  ultimoPerfilId: 'pessoal',
}

describe('migrar', () => {
  it('v1: o quadro passa a ter posicao na lousa (moldura + relativa) e a moldura some', () => {
    const v2 = migrar(v1) as { versao: number; repos: object[]; quadros: Array<{ caixa: object }> }
    expect(v2.versao).toBe(2)
    expect(v2.repos[0]).toEqual({ id: 'r1', nome: 'pessoal', caminho: 'C:\\pessoal', perfilPadraoId: 'pessoal' })
    expect(v2.quadros[0]?.caixa).toEqual({ x: 70, y: 102, largura: 545, altura: 673 })
  })

  it('quadro de repo que nao existe fica onde estava (nada se perde)', () => {
    const v2 = migrar(v1) as { quadros: Array<{ caixa: object }> }
    expect(v2.quadros[1]?.caixa).toEqual({ x: 5, y: 6, largura: 440, altura: 280 })
  })

  it('o que nao e v1 volta como veio', () => {
    const outro = { versao: 2, qualquer: true }
    expect(migrar(outro)).toBe(outro)
  })

  it('o armazem carrega um arquivo v1 ja migrado, sem marcar como corrompido', () => {
    const arquivo = join(mkdtempSync(join(tmpdir(), 'lousa-')), 'estado.json')
    writeFileSync(arquivo, JSON.stringify(v1), 'utf8')
    const estado = criarArmazem(arquivo).carregar()
    expect(estado.versao).toBe(2)
    expect(estado.quadros.map((q) => q.titulo)).toEqual(['Claude 1', 'Claude 2'])
    expect(estado.viewport).toEqual(v1.viewport)
  })
})
