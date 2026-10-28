import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Repo } from '../../shared/model'
import {
  ARQUIVO_KANBAN,
  comExclusao,
  ETAPAS,
  garantirKanban,
  modeloKanban,
  repoDoKanban,
  regraDoKanban,
  type DiscoKanban,
} from './kanban'

const original: Repo = { id: 'r1', nome: 'app', caminho: 'C:\\p\\app', perfilPadraoId: 'principal' }
const copia: Repo = {
  id: 'r2',
  nome: 'claude-2',
  caminho: 'C:\\p\\app.copias\\claude-2',
  perfilPadraoId: 'principal',
  copia: { origemId: 'r1', branch: 'lousa/claude-2', apelido: 'claude-2' },
}
const obter = (id: string): Repo => {
  const r = [original, copia].find((x) => x.id === id)
  if (!r) throw new Error('Repositório não encontrado')
  return r
}

/** Disco em memoria: arquivos e pastas por caminho. */
function discoFalso(arquivos: Record<string, string> = {}, pastas: string[] = []): DiscoKanban & {
  arquivos: Record<string, string>
} {
  const dirs = new Set(pastas)
  return {
    arquivos,
    existe: (c) => c in arquivos || dirs.has(c),
    ehPasta: (c) => dirs.has(c),
    ler: (c) => arquivos[c] ?? '',
    escrever: (c, t) => {
      arquivos[c] = t
    },
    criarPasta: (c) => {
      dirs.add(c)
    },
  }
}

describe('modeloKanban', () => {
  it('tem o nome do projeto e uma secao por etapa, na ordem', () => {
    const texto = modeloKanban('app')
    expect(texto.startsWith('# Kanban · app\n')).toBe(true)
    const secoes = [...texto.matchAll(/^## (.+)$/gm)].map((m) => m[1])
    expect(secoes).toEqual([...ETAPAS])
    expect(ETAPAS.at(-2)).toBe('⏳ Aguardando commit')
    expect(ETAPAS).toHaveLength(7)
  })
})

describe('repoDoKanban', () => {
  it('pasta original: ela mesma', () => {
    expect(repoDoKanban(original, obter).caminho).toBe('C:\\p\\app')
  })
  it('copia separada: a pasta original, para ser um arquivo so por projeto', () => {
    expect(repoDoKanban(copia, obter).caminho).toBe('C:\\p\\app')
  })
  it('copia cuja original saiu da lista: fica na copia', () => {
    expect(repoDoKanban(copia, () => { throw new Error('x') }).caminho).toBe(copia.caminho)
  })
})

describe('regraDoKanban', () => {
  const regra = regraDoKanban('C:\\p\\app\\KANBAN.md', 'Revisor')

  it('diz o arquivo, o nome do card, as etapas e retomar o proprio card', () => {
    expect(regra).toContain('C:\\p\\app\\KANBAN.md')
    expect(regra).toContain('"- **Revisor** · tarefa em poucas palavras · HH:MM"')
    expect(regra).toContain(
      'Pendente, Em definição, Executando, Testando, Bloqueado / aguardando decisão, Aguardando commit, Concluído',
    )
    // travou ou depende do usuario: etapa propria, com o motivo no card
    expect(regra).toContain('depender de uma decisão do usuário, mova o card para "Bloqueado / aguardando decisão"')
    expect(regra).toContain('escreva no card o motivo')
    expect(regra).toContain('mova esse em vez de criar outro')
    expect(regra).toContain('nunca apague os dos outros')
    // o PowerShell 5 le arquivo sem BOM como ANSI e estraga emoji e acento (prova kanban)
    expect(regra).toContain('-Encoding utf8')
  })

  it('uma linha so: nada de Enter, nem vindo do caminho ou do nome', () => {
    const r = regraDoKanban('C:\\a\r\nb\\KANBAN.md', 'Re\rvisor\n')
    // eslint-disable-next-line no-control-regex
    expect(r).not.toMatch(/[\u0000-\u001f]/)
  })
})

describe('comExclusao', () => {
  it('arquivo vazio ganha a linha', () => {
    expect(comExclusao('')).toBe(`# kanban do Mãozinha (D52)\n/${ARQUIVO_KANBAN}\n`)
  })
  it('mantem o que ja tinha, mesmo sem quebra de linha no fim', () => {
    expect(comExclusao('*.log')).toBe(`*.log\n# kanban do Mãozinha (D52)\n/${ARQUIVO_KANBAN}\n`)
  })
  it('ja tem (com ou sem barra, com \\r\\n): nao mexe', () => {
    expect(comExclusao('*.log\r\n/KANBAN.md\r\n')).toBeNull()
    expect(comExclusao('KANBAN.md\n')).toBeNull()
  })
})

describe('garantirKanban', () => {
  const pasta = 'C:\\p\\app'
  const md = join(pasta, ARQUIVO_KANBAN)
  const git = join(pasta, '.git')
  const exclude = join(git, 'info', 'exclude')

  it('cria o md e poe no exclude do git', () => {
    const disco = discoFalso({}, [git])
    expect(garantirKanban(pasta, 'app', disco)).toEqual({ arquivo: md, criado: true })
    expect(disco.arquivos[md]).toBe(modeloKanban('app'))
    expect(disco.arquivos[exclude]).toContain('/KANBAN.md')
  })

  it('md que ja existe nao e reescrito (os cards ficam)', () => {
    const disco = discoFalso({ [md]: '# meus cards' }, [git])
    expect(garantirKanban(pasta, 'app', disco).criado).toBe(false)
    expect(disco.arquivos[md]).toBe('# meus cards')
  })

  it('exclude que ja tem o kanban nao e regravado', () => {
    const disco = discoFalso({ [exclude]: '/KANBAN.md\n' }, [git])
    let gravou = false
    const espiao = { ...disco, escrever: (c: string, t: string) => ((gravou ||= c === exclude), disco.escrever(c, t)) }
    garantirKanban(pasta, 'app', espiao)
    expect(gravou).toBe(false)
  })

  it('sem git (ou .git arquivo, de um worktree): so o md', () => {
    const disco = discoFalso({ [git]: 'gitdir: C:\\outro' })
    garantirKanban(pasta, 'app', disco)
    expect(Object.keys(disco.arquivos).sort()).toEqual([git, md].sort())
  })
})
