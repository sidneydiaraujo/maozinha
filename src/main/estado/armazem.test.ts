import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { criarArmazem, ESTADO_PADRAO } from './armazem'

const pasta = (): string => mkdtempSync(join(tmpdir(), 'lousa-'))
const caixa = { x: 1, y: 2, largura: 300, altura: 200 }

const estado: EstadoSalvo = {
  versao: 2,
  perfis: { principal: { nome: 'Empresa' }, 'cx:novo': { provedor: 'codex', criada: true } },
  repos: [
    { id: 'r1', nome: 'app', caminho: 'C:\\app', perfilPadraoId: 'principal' },
    {
      id: 'r2',
      nome: 'app',
      caminho: 'C:\\app.copias\\claude-2',
      perfilPadraoId: 'pessoal',
      copia: { origemId: 'r1', branch: 'lousa/claude-2', apelido: 'claude-2' },
    },
  ],
  quadros: [{ id: 'q1', repoId: 'r1', perfilId: 'pessoal', tipo: 'agente', titulo: 'Claude 1', caixa }],
  viewport: { x: 10, y: 20, zoom: 0.5 },
  ultimoPerfilId: 'principal',
}

describe('criarArmazem', () => {
  it('guarda e le de volta o mesmo estado', () => {
    const arquivo = join(pasta(), 'estado.json')
    const armazem = criarArmazem(arquivo)
    armazem.salvar(estado)
    expect(criarArmazem(arquivo).carregar()).toEqual(estado)
  })

  it('arquivo ausente devolve o padrao sem criar o arquivo', () => {
    const arquivo = join(pasta(), 'estado.json')
    expect(criarArmazem(arquivo).carregar()).toEqual(ESTADO_PADRAO)
    expect(existsSync(arquivo)).toBe(false)
  })

  it('o padrao devolvido e uma copia: mexer nele nao estraga o proximo', () => {
    const armazem = criarArmazem(join(pasta(), 'estado.json'))
    armazem.carregar().repos.push(estado.repos[0]!)
    expect(armazem.carregar().repos).toEqual([])
  })

  it('JSON quebrado vira padrao e o arquivo ruim fica guardado', () => {
    const dir = pasta()
    const arquivo = join(dir, 'estado.json')
    writeFileSync(arquivo, '{quebrado', 'utf8')
    expect(criarArmazem(arquivo).carregar()).toEqual(ESTADO_PADRAO)
    const guardados = readdirSync(dir).filter((n) => n.startsWith('estado.json.corrompido-'))
    expect(guardados).toHaveLength(1)
    expect(existsSync(arquivo)).toBe(false)
  })

  it('versao desconhecida vira padrao e fica guardada', () => {
    const dir = pasta()
    const arquivo = join(dir, 'estado.json')
    writeFileSync(arquivo, JSON.stringify({ ...estado, versao: 99 }), 'utf8')
    expect(criarArmazem(arquivo).carregar()).toEqual(ESTADO_PADRAO)
    expect(readdirSync(dir).some((n) => n.includes('.corrompido-'))).toBe(true)
  })

  it('salvar cria a pasta que faltar e nao deixa .tmp para tras', () => {
    const dir = join(pasta(), 'a', 'b')
    const arquivo = join(dir, 'estado.json')
    criarArmazem(arquivo).salvar(estado)
    expect(JSON.parse(readFileSync(arquivo, 'utf8'))).toEqual(estado)
    expect(readdirSync(dir)).toEqual(['estado.json'])
  })

  it('recusa gravar estado invalido e preserva o arquivo anterior', () => {
    const arquivo = join(pasta(), 'estado.json')
    const armazem = criarArmazem(arquivo)
    armazem.salvar(estado)
    const ruim = { ...estado, viewport: { x: 0, y: 0, zoom: 'grande' } } as unknown as EstadoSalvo
    expect(() => armazem.salvar(ruim)).toThrow()
    expect(armazem.carregar()).toEqual(estado)
  })
})
