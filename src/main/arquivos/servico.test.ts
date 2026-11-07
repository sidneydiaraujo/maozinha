import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { ItemArquivo, Repo } from '../../shared/model'
import { ServicoArquivos } from './servico'

const RAIZ = join('C:', 'repos', 'lousa')
const REPO: Repo = { id: 'r1', nome: 'lousa', caminho: RAIZ, perfilPadraoId: 'principal' }
const texto = (s: string): Uint8Array => new TextEncoder().encode(s)

function montar(arquivos: Record<string, Uint8Array>, pastas: Record<string, ItemArquivo[]> = {}) {
  const abertos: string[] = []
  const mostrados: string[] = []
  const servico = new ServicoArquivos({
    repos: {
      obter: (id) => {
        if (id !== REPO.id) throw new Error('Repositório não encontrado')
        return REPO
      },
    },
    listarPasta: (caminho) => pastas[caminho] ?? [],
    tamanho: (caminho) => arquivos[caminho]?.length ?? null,
    lerBytes: (caminho) => arquivos[caminho] ?? new Uint8Array(),
    abrirNoWindows: async (caminho) => {
      abertos.push(caminho)
      return ''
    },
    mostrarNaPasta: (caminho) => mostrados.push(caminho),
  })
  return { servico, abertos, mostrados }
}

describe('ServicoArquivos', () => {
  it('listar ordena como o VSCode e esconde .git', () => {
    const { servico } = montar(
      {},
      {
        [RAIZ]: [
          { nome: 'README.md', pasta: false },
          { nome: '.git', pasta: true },
          { nome: 'src', pasta: true },
        ],
      },
    )
    expect(servico.listar('r1', '').map((i) => i.nome)).toEqual(['src', 'README.md'])
  })

  it('recusa caminho fora da pasta e repo desconhecido', () => {
    const { servico } = montar({})
    expect(() => servico.listar('r1', '../outro')).toThrow('Arquivo fora da pasta')
    expect(() => servico.ler('r1', 'C:\\Windows\\win.ini')).toThrow('Arquivo fora da pasta')
    expect(() => servico.listar('r9', '')).toThrow('Repositório não encontrado')
  })

  it('ler devolve texto, binario ou grande', () => {
    const md = join(RAIZ, 'docs', 'a.md')
    const bin = join(RAIZ, 'LICENSE.bin')
    const grande = join(RAIZ, 'grande.log')
    const { servico } = montar({
      [md]: texto('# Oi'),
      [bin]: new Uint8Array([0x4d, 0x5a, 0x00, 0x03, 0x00]),
      [grande]: new Uint8Array(3 * 1024 * 1024),
    })
    expect(servico.ler('r1', 'docs/a.md')).toEqual({ tipo: 'texto', texto: '# Oi', tamanho: 4, podeAbrirFora: true })
    expect(servico.ler('r1', 'LICENSE.bin')).toMatchObject({ tipo: 'binario', texto: '', podeAbrirFora: false })
    expect(servico.ler('r1', 'grande.log').tipo).toBe('grande')
    expect(() => servico.ler('r1', 'nao-existe.md')).toThrow('Arquivo não encontrado')
  })

  it('abrir: documento vai para o Windows, md vai para o leitor', async () => {
    const pdf = join(RAIZ, 'plano.pdf')
    const { servico, abertos } = montar({ [pdf]: texto('%PDF'), [join(RAIZ, 'a.md')]: texto('oi') })
    expect(await servico.abrir('r1', 'plano.pdf')).toEqual({ onde: 'fora' })
    expect(abertos).toEqual([pdf])
    expect(await servico.abrir('r1', 'a.md')).toMatchObject({ onde: 'leitor', conteudo: { texto: 'oi' } })
  })

  it('abrirFora recusa o que pode rodar; mostrar na pasta aceita qualquer arquivo de dentro', async () => {
    const exe = join(RAIZ, 'setup.exe')
    const { servico, abertos, mostrados } = montar({ [exe]: new Uint8Array([0x4d, 0x5a]) })
    await expect(servico.abrirFora('r1', 'setup.exe')).rejects.toThrow('não abre fora')
    expect(abertos).toEqual([])
    servico.mostrarNaPasta('r1', 'setup.exe')
    expect(mostrados).toEqual([exe])
  })
})

describe('ServicoArquivos.resolver (R1.6)', () => {
  const { servico } = montar(
    { [join(RAIZ, 'docs', 'ESTADO.md')]: texto('x'), [join(RAIZ, 'leia.md')]: texto('y') },
    {
      [RAIZ]: [
        { nome: 'docs', pasta: true },
        { nome: 'leia.md', pasta: false },
      ],
      [join(RAIZ, 'docs')]: [{ nome: 'ESTADO.md', pasta: false }],
    },
  )

  it('existe como foi citado: ele mesmo, com barra normal', () => {
    expect(servico.resolver('r1', 'docs\\ESTADO.md')).toBe('docs/ESTADO.md')
    expect(servico.resolver('r1', 'leia.md')).toBe('leia.md')
  })

  it('nome solto que mora numa subpasta: o unico que termina com ele', () => {
    expect(servico.resolver('r1', 'ESTADO.md')).toBe('docs/ESTADO.md')
  })

  it('nao existe, ou sai da pasta: null (nao vira link)', () => {
    expect(servico.resolver('r1', 'sumiu.md')).toBeNull()
    expect(servico.resolver('r1', '../fora.md')).toBeNull()
  })
})
