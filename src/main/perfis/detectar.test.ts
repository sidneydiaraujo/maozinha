import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { detectarPerfis, PALETA, type DepsDeteccao } from './detectar'

const HOME = join('C:', 'Users', 'teste')

/** Disco falso: lista de caminhos relativos ao HOME (pastas e arquivos). */
function disco(...relativos: string[]): DepsDeteccao {
  const todos = new Set<string>()
  for (const r of relativos) {
    const partes = r.split(/[\\/]/)
    // cada pasta no caminho tambem existe, como num disco de verdade
    for (let i = 1; i <= partes.length; i++) todos.add(join(HOME, ...partes.slice(0, i)).toLowerCase())
  }
  return {
    home: HOME,
    listarPastas: (caminho) => {
      if (caminho !== HOME) return []
      const nomes = new Set(relativos.map((r) => r.split(/[\\/]/)[0] ?? r))
      return [...nomes]
    },
    existe: (caminho) => todos.has(caminho.toLowerCase()),
  }
}

describe('detectarPerfis', () => {
  it('acha Claude e Codex com marcador e ignora o resto', () => {
    const deps = disco(
      '.claude/settings.json',
      '.claude-pessoal/projects',
      '.codex-trabalho/auth.json',
      '.claude-vazio/leia.txt',
      '.codex-vazio/leia.txt',
      'claude-dev-plugin/settings.json',
      '.claudex/settings.json',
    )
    const ids = detectarPerfis(deps, {}).map((p) => p.id)
    expect(ids).toEqual(['principal', 'pessoal', 'cx:trabalho'])
  })

  it('pasta vazia vale quando foi criada pelo app', () => {
    const deps = disco('.claude-nova/leia.txt', '.codex-nova/leia.txt')
    const ajustes = { nova: { criada: true }, 'cx:nova': { criada: true } }
    expect(detectarPerfis(deps, ajustes).map((p) => p.id)).toEqual(['nova', 'cx:nova'])
  })

  it('principal e padrao vem primeiro; Codex depois dos Claude', () => {
    const deps = disco(
      '.codex-b/auth.json',
      '.codex/auth.json',
      '.claude-zeta/settings.json',
      '.claude/settings.json',
      '.claude-alfa/settings.json',
    )
    const perfis = detectarPerfis(deps, {})
    expect(perfis.map((p) => p.id)).toEqual(['principal', 'alfa', 'zeta', 'cx:padrao', 'cx:b'])
    expect(perfis.map((p) => p.ehPadrao)).toEqual([true, false, false, true, false])
    expect(perfis.map((p) => p.provedor)).toEqual(['claude', 'claude', 'claude', 'codex', 'codex'])
  })

  it('nomes padrao e configDir', () => {
    const deps = disco('.claude/settings.json', '.claude-pessoal/projects', '.codex/auth.json', '.codex-trabalho/auth.json')
    const perfis = detectarPerfis(deps, {})
    expect(perfis.map((p) => p.nome)).toEqual(['Principal', 'Pessoal', 'Codex', 'Codex Trabalho'])
    expect(perfis[1]?.configDir).toBe(join(HOME, '.claude-pessoal'))
  })

  it('.claude-codex nao colide com .codex', () => {
    const deps = disco('.claude-codex/settings.json', '.codex/auth.json')
    expect(detectarPerfis(deps, {}).map((p) => p.id)).toEqual(['codex', 'cx:padrao'])
  })

  it('cores seguem a ordem da paleta e dao a volta', () => {
    const nomes = ['a', 'b', 'c', 'd', 'e', 'f']
    const deps = disco('.claude/settings.json', ...nomes.map((n) => `.claude-${n}/settings.json`))
    const cores = detectarPerfis(deps, {}).map((p) => p.cor)
    expect(cores).toEqual([...PALETA, PALETA[0], PALETA[1]])
  })

  it('raiz padrao so aparece quando a pasta home/<sufixo> existe', () => {
    const deps = disco('.claude/settings.json', '.claude-pessoal/projects', '.claude-outra/projects', 'pessoal/app/leia.txt')
    const perfis = detectarPerfis(deps, {})
    expect(perfis.find((p) => p.id === 'principal')?.raizes).toEqual([])
    expect(perfis.find((p) => p.id === 'pessoal')?.raizes).toEqual([join(HOME, 'pessoal')])
    expect(perfis.find((p) => p.id === 'outra')?.raizes).toEqual([])
  })

  it('ajustes mudam nome, cor e raizes; id inexistente nao quebra', () => {
    const deps = disco('.claude/settings.json')
    const ajustes = {
      principal: { nome: 'Empresa', cor: '#000000', raizes: ['C:\\empresa'] },
      sumiu: { nome: 'Fantasma' },
    }
    const [p] = detectarPerfis(deps, ajustes)
    expect(p?.nome).toBe('Empresa')
    expect(p?.cor).toBe('#000000')
    expect(p?.raizes).toEqual(['C:\\empresa'])
    expect(detectarPerfis(deps, ajustes)).toHaveLength(1)
  })

  it('home sem nenhuma conta devolve lista vazia', () => {
    expect(detectarPerfis(disco('Documentos/a.txt'), {})).toEqual([])
  })
})
