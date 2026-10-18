import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  caminhoDentro,
  comoAbrir,
  decodificar,
  linkPermitido,
  mudancaRelevante,
  ordenar,
  pareceBinario,
  podeAbrirFora,
  visivel,
} from './regras'

const RAIZ = join('C:', 'repos', 'lousa')

describe('ordenar', () => {
  it('pastas primeiro e numeros em ordem natural, como o VSCode', () => {
    const itens = [
      { nome: 'b.md', pasta: false },
      { nome: 'a10.md', pasta: false },
      { nome: 'src', pasta: true },
      { nome: 'a2.md', pasta: false },
      { nome: 'Docs', pasta: true },
    ]
    expect(ordenar(itens).map((i) => i.nome)).toEqual(['Docs', 'src', 'a2.md', 'a10.md', 'b.md'])
  })
})

describe('visivel', () => {
  it('esconde o que o VSCode esconde e mostra node_modules', () => {
    expect(['.git', '.svn', '.DS_Store', 'Thumbs.db'].map(visivel)).toEqual([false, false, false, false])
    expect(['node_modules', '.github', '.env'].map(visivel)).toEqual([true, true, true])
  })
})

describe('caminhoDentro', () => {
  it('monta o caminho de dentro da pasta, com / ou \\', () => {
    expect(caminhoDentro(RAIZ, 'docs/aceite/roteiro.md')).toBe(join(RAIZ, 'docs', 'aceite', 'roteiro.md'))
    expect(caminhoDentro(RAIZ, 'docs\\ESTADO.md')).toBe(join(RAIZ, 'docs', 'ESTADO.md'))
    expect(caminhoDentro(RAIZ, '')).toBe(RAIZ)
  })

  it('recusa sair da pasta, caminho absoluto, outra unidade e byte zero', () => {
    for (const ruim of ['..', '../outro/x.md', 'docs/../../x', 'C:\\Windows\\win.ini', '/etc/passwd', 'D:x', 'a\0b']) {
      expect(caminhoDentro(RAIZ, ruim)).toBeNull()
    }
  })

  it('aceita nome que so comeca com dois pontos', () => {
    expect(caminhoDentro(RAIZ, '..config')).toBe(join(RAIZ, '..config'))
  })
})

describe('comoAbrir e podeAbrirFora', () => {
  it('texto de desenvolvimento no leitor, documento fora, o resto o main descobre', () => {
    expect(['roteiro.md', 'App.tsx', 'package.json', '.gitignore', 'Dockerfile'].map(comoAbrir)).toEqual([
      'leitor',
      'leitor',
      'leitor',
      'leitor',
      'leitor',
    ])
    expect(['plano.pdf', 'Relatorio.DOCX', 'foto.png'].map(comoAbrir)).toEqual(['fora', 'fora', 'fora'])
    expect(['LICENSE', 'dados.bin'].map(comoAbrir)).toEqual(['descobrir', 'descobrir'])
  })

  it('nunca manda para fora o que pode rodar', () => {
    for (const nome of [
      'setup.exe',
      'rodar.bat',
      'x.cmd',
      'script.ps1',
      'a.js',
      'b.py',
      'c.vbs',
      'atalho.lnk',
      'LICENSE',
    ]) {
      expect(podeAbrirFora(nome)).toBe(false)
    }
    expect(['a.pdf', 'b.xlsx', 'c.md', 'd.png'].map(podeAbrirFora)).toEqual([true, true, true, true])
  })
})

describe('pareceBinario', () => {
  const bytes = (s: string): Uint8Array => new TextEncoder().encode(s)

  it('texto comum e UTF-8 com acento nao sao binarios', () => {
    expect(pareceBinario(bytes('# Roteiro\nação ✅'))).toBe(false)
  })

  it('byte zero no meio = binario', () => {
    expect(pareceBinario(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0x1a, 0x0a, 0x00, 0x00]))).toBe(true)
    expect(pareceBinario(new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]))).toBe(true)
  })

  it('UTF-16 (com ou sem marca) nao e binario', () => {
    expect(pareceBinario(new Uint8Array([0xff, 0xfe, 0x61, 0x00]))).toBe(false)
    expect(pareceBinario(new Uint8Array([0x61, 0x00, 0x62, 0x00]))).toBe(false)
    expect(pareceBinario(new Uint8Array([0x00, 0x61, 0x00, 0x62]))).toBe(false)
  })
})

describe('decodificar', () => {
  it('UTF-8 sem a marca e UTF-16 LE com marca', () => {
    expect(decodificar(new Uint8Array([0xef, 0xbb, 0xbf, 0x6f, 0x69]))).toBe('oi')
    expect(decodificar(new Uint8Array([0xff, 0xfe, 0x6f, 0x00, 0x69, 0x00]))).toBe('oi')
  })
})

describe('mudancaRelevante', () => {
  it('troca \\ por / e ignora git, dependencias e builds', () => {
    expect(mudancaRelevante('docs\\aceite\\roteiro.md')).toBe('docs/aceite/roteiro.md')
    expect(mudancaRelevante('README.md')).toBe('README.md')
    for (const ruim of ['.git\\index', 'node_modules\\x\\y.js', 'out\\main\\index.js', 'web\\dist\\a.js', '']) {
      expect(mudancaRelevante(ruim)).toBeNull()
    }
  })
})

describe('linkPermitido', () => {
  it('so http e https', () => {
    expect(linkPermitido('https://github.com/x')).toBe('https://github.com/x')
    expect(linkPermitido('http://localhost:3000/')).toBe('http://localhost:3000/')
    for (const ruim of ['javascript:alert(1)', 'file:///C:/Windows/win.ini', 'ms-settings:', 'docs/a.md', '']) {
      expect(linkPermitido(ruim)).toBeNull()
    }
  })
})
