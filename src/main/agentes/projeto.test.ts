import { describe, expect, it } from 'vitest'
import { caminhoTocado, raizDoProjeto, trocaProjeto } from './projeto'

const ler = (o: object) => caminhoTocado(JSON.stringify(o))

describe('caminhoTocado', () => {
  it('le, procura e salva: o caminho da ferramenta, absoluto', () => {
    expect(ler({ hook_event_name: 'PostToolUse', tool_name: 'Read', tool_input: { file_path: 'C:\\p\\a\\x.ts' } })).toBe('C:\\p\\a\\x.ts')
    expect(ler({ hook_event_name: 'PostToolUse', tool_name: 'Grep', tool_input: { path: 'C:\\p\\a' } })).toBe('C:\\p\\a')
    expect(ler({ hook_event_name: 'PostToolUse', tool_name: 'NotebookEdit', tool_input: { notebook_path: 'C:\\p\\n.ipynb' } })).toBe('C:\\p\\n.ipynb')
  })

  it('relativo vale contra o cwd do gancho; sem cwd, nada', () => {
    expect(ler({ hook_event_name: 'PostToolUse', cwd: 'C:\\p', tool_input: { file_path: 'a\\x.ts' } })).toBe('C:\\p\\a\\x.ts')
    expect(ler({ hook_event_name: 'PostToolUse', tool_input: { file_path: 'a\\x.ts' } })).toBeNull()
  })

  it('outro evento, ferramenta sem caminho ou JSON quebrado: nada', () => {
    expect(ler({ hook_event_name: 'Stop', tool_input: { file_path: 'C:\\p\\x' } })).toBeNull()
    expect(ler({ hook_event_name: 'PostToolUse', tool_name: 'Bash', tool_input: { command: 'ls' } })).toBeNull()
    expect(caminhoTocado('nao e json')).toBeNull()
  })
})

describe('raizDoProjeto', () => {
  const casa = 'C:\\Users\\sid'
  const ampla = (p: string) => casa.toLowerCase().startsWith(p.toLowerCase())
  const comArquivos = (...existentes: string[]) => (c: string) => existentes.includes(c)

  it('a pasta mais proxima com .git, mesmo com package.json mais perto', () => {
    const existe = comArquivos('C:\\Users\\sid\\pessoal\\app\\.git', 'C:\\Users\\sid\\pessoal\\app\\web\\package.json')
    expect(raizDoProjeto('C:\\Users\\sid\\pessoal\\app\\web\\src\\x.ts', existe, ampla)).toBe('C:\\Users\\sid\\pessoal\\app')
  })

  it('sem git: a pasta mais proxima com cara de projeto', () => {
    const existe = comArquivos('C:\\Users\\sid\\notas\\CLAUDE.md')
    expect(raizDoProjeto('C:\\Users\\sid\\notas\\a\\b.md', existe, ampla)).toBe('C:\\Users\\sid\\notas')
  })

  it('a pasta do usuario nunca e projeto, nem com .git nela', () => {
    const existe = comArquivos('C:\\Users\\sid\\.git', 'C:\\Users\\sid\\solto\\x.md')
    expect(raizDoProjeto('C:\\Users\\sid\\solto\\x.md', existe, ampla)).toBeNull()
  })

  it('pasta escondida, de dependencias ou AppData no caminho: nada', () => {
    const existe = comArquivos('C:\\Users\\sid\\.claude\\.git', 'C:\\Users\\sid\\app\\.git', 'C:\\Users\\sid\\AppData\\x\\.git')
    expect(raizDoProjeto('C:\\Users\\sid\\.claude\\skills\\a.md', existe, ampla)).toBeNull()
    expect(raizDoProjeto('C:\\Users\\sid\\app\\node_modules\\z\\i.js', existe, ampla)).toBeNull()
    expect(raizDoProjeto('C:\\Users\\sid\\AppData\\x\\y.json', existe, ampla)).toBeNull()
  })
})

describe('trocaProjeto', () => {
  it('o primeiro projeto entra lendo ou salvando; o mesmo (outra caixa de letras) nao troca', () => {
    expect(trocaProjeto(null, 'C:\\a', false)).toBe(true)
    expect(trocaProjeto('C:\\A', 'c:\\a', true)).toBe(false)
  })

  it('com projeto, so salvar noutro troca; ler para consultar nao', () => {
    expect(trocaProjeto('C:\\a', 'C:\\b', false)).toBe(false)
    expect(trocaProjeto('C:\\a', 'C:\\b', true)).toBe(true)
  })
})
