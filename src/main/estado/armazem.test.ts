import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { EstadoSalvo } from '../../shared/model'
import { copiasVelhas, criarArmazem, ESTADO_PADRAO } from './armazem'

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

/** Todos os campos opcionais preenchidos: campo novo esquecido no esquema some e o teste pega. */
const completo: EstadoSalvo = {
  ...estado,
  perfis: {
    ...estado.perfis,
    pessoal: { nome: 'Pessoal', cor: '#22c55e', raizes: ['C:\\p'], git: { nome: 'S', email: 's@x', githubProprio: true } },
  },
  quadros: [
    {
      id: 'q1',
      repoId: 'r1',
      perfilId: 'pessoal',
      tipo: 'agente',
      titulo: 'Claude 1',
      caixa,
      sessaoId: '11111111-2222-4333-8444-555555555555',
      modelo: 'opus',
      esforco: 'high',
      papel: 'Revisor',
      kanban: true,
      dormindo: true,
    },
    { id: 'q2', repoId: 'r2', perfilId: 'principal', tipo: 'terminal', titulo: 'app 2', caixa },
  ],
  notas: [{ id: 'n1', texto: 'lembrar', caixa }],
  vistas: [{ id: 'v1', nome: 'foco', viewport: { x: 1, y: 2, zoom: 1 }, caixas: { q1: caixa } }],
  ligacoes: [{ id: 'l1', de: 'q1', para: 'q2', modo: 'perguntar', pausada: true }],
}

describe('criarArmazem: item ruim nao apaga a lousa (R1.2)', () => {
  const gravar = (conteudo: object): { dir: string; arquivo: string } => {
    const dir = pasta()
    const arquivo = join(dir, 'estado.json')
    writeFileSync(arquivo, JSON.stringify(conteudo))
    return { dir, arquivo }
  }

  it('todos os campos opcionais vao e voltam iguais', () => {
    const arquivo = join(pasta(), 'estado.json')
    criarArmazem(arquivo).salvar(completo)
    expect(criarArmazem(arquivo).carregar()).toEqual(completo)
  })

  it('um quadro fora do formato sai sozinho; o resto abre e o arquivo como estava fica copiado', () => {
    const ruim = { ...completo.quadros[1], sessaoId: 'nao-e-uuid' }
    const { dir, arquivo } = gravar({ ...completo, quadros: [completo.quadros[0], ruim], ligacoes: [] })
    const lido = criarArmazem(arquivo).carregar()
    expect(lido.quadros.map((q) => q.id)).toEqual(['q1'])
    expect(lido.repos).toHaveLength(2)
    expect(lido.notas).toEqual(completo.notas)
    expect(existsSync(arquivo)).toBe(true)
    expect(readdirSync(dir).filter((n) => n.startsWith('estado.json.antes-'))).toHaveLength(1)
  })

  it('o carregar roda a cada operacao: o mesmo arquivo ruim vira uma copia so, nao uma por leitura (R3.14)', () => {
    const ruim = { ...completo.quadros[1], sessaoId: 'nao-e-uuid' }
    const { dir, arquivo } = gravar({ ...completo, quadros: [completo.quadros[0], ruim], ligacoes: [] })
    const armazem = criarArmazem(arquivo)
    for (let i = 0; i < 3; i++) armazem.carregar()
    expect(readdirSync(dir).filter((n) => n.startsWith('estado.json.antes-'))).toHaveLength(1)
  })

  it('copiasVelhas: so as 5 mais novas de cada estado ficam (R3.14)', () => {
    const nomes = [1, 2, 3, 4, 5, 6, 7].map((n) => `estado.json.antes-${n}000`)
    nomes.push('estado.json.corrompido-8000', 'estado.json', 'estado.json.tmp', 'outro.json.antes-1')
    expect(copiasVelhas(nomes, 'estado.json').sort()).toEqual(['estado.json.antes-1000', 'estado.json.antes-2000', 'estado.json.antes-3000'])
  })

  it('linha de uma versao futura (modo novo) sai; os quadros ficam', () => {
    const futura = { id: 'l2', de: 'q1', para: 'q2', modo: 'turbo' }
    const { arquivo } = gravar({ ...completo, ligacoes: [completo.ligacoes![0], futura] })
    const lido = criarArmazem(arquivo).carregar()
    expect(lido.ligacoes?.map((l) => l.id)).toEqual(['l1'])
    expect(lido.quadros).toHaveLength(2)
  })

  it('pasta ruim sai sozinha; linha de um quadro que saiu sai junto: nada liga ao vazio', () => {
    const repos = [completo.repos[0], { ...completo.repos[1], caminho: 42 }]
    const quadros = [completo.quadros[0], { ...completo.quadros[1], tipo: 'planilha' }]
    const { arquivo } = gravar({ ...completo, repos, quadros })
    const lido = criarArmazem(arquivo).carregar()
    expect(lido.repos.map((r) => r.id)).toEqual(['r1'])
    expect(lido.quadros.map((q) => q.id)).toEqual(['q1'])
    expect(lido.ligacoes).toEqual([])
  })

  it('perfil e viewport estragados: perfil sai, viewport volta ao padrao, o resto fica', () => {
    const { arquivo } = gravar({ ...completo, perfis: { ...completo.perfis, ruim: 7 }, viewport: 'x' })
    const lido = criarArmazem(arquivo).carregar()
    expect(Object.keys(lido.perfis)).not.toContain('ruim')
    expect(lido.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
    expect(lido.quadros).toHaveLength(2)
  })
})

describe('criarArmazem', () => {
  it('guarda e le de volta o mesmo estado', () => {
    const arquivo = join(pasta(), 'estado.json')
    const armazem = criarArmazem(arquivo)
    armazem.salvar(estado)
    expect(criarArmazem(arquivo).carregar()).toEqual(estado)
  })

  it('modelo e esforco do quadro (T19.1): valido volta; desconhecido vira "sem escolha" sem estragar o resto', () => {
    const arquivo = join(pasta(), 'estado.json')
    const q = estado.quadros[0]
    const quadros = [
      { ...q, id: 'q1', modelo: 'sonnet', esforco: 'high' },
      { ...q, id: 'q2', modelo: 'gpt-9', esforco: 'turbo' },
    ]
    writeFileSync(arquivo, JSON.stringify({ ...estado, quadros }))
    const lido = criarArmazem(arquivo).carregar()
    expect(lido.quadros[0]).toMatchObject({ modelo: 'sonnet', esforco: 'high' })
    expect(lido.quadros[1]?.modelo).toBeUndefined()
    expect(lido.quadros[1]?.esforco).toBeUndefined()
    expect(lido.quadros[1]?.titulo).toBe('Claude 1')
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
