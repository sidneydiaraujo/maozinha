import { describe, expect, it } from 'vitest'
import { acharLinks, arquivoDeUri, caminhoNoRepo, textoDaLinhaLogica } from './links'

const textos = (linha: string): Array<[string, string]> => acharLinks(linha).map((l) => [l.tipo, l.texto])

describe('acharLinks', () => {
  it('URL sem a pontuacao do fim', () => {
    expect(textos('Veja https://github.com/x/y. e (http://localhost:3000/a?b=1).')).toEqual([
      ['url', 'https://github.com/x/y'],
      ['url', 'http://localhost:3000/a?b=1'],
    ])
  })

  it('caminhos com pasta, com linha e coluna, e absolutos do Windows', () => {
    expect(textos('Editei src/main/index.ts e docs/ESTADO.md:12 (ver ./a/b.tsx:3:7).')).toEqual([
      ['arquivo', 'src/main/index.ts'],
      ['arquivo', 'docs/ESTADO.md:12'],
      ['arquivo', './a/b.tsx:3:7'],
    ])
    expect(textos('Salvo em C:\\Users\\sidne\\pessoal\\lousa-ia\\docs\\roteiro.md')).toEqual([
      ['arquivo', 'C:\\Users\\sidne\\pessoal\\lousa-ia\\docs\\roteiro.md'],
    ])
  })

  it('nome solto so com extensao conhecida; versao, e.g. e pasta sem arquivo ficam de fora', () => {
    expect(textos('Atualizei package.json e README.md')).toEqual([
      ['arquivo', 'package.json'],
      ['arquivo', 'README.md'],
    ])
    expect(textos('Electron 41.10.7, v1.2, e.g. isso, src/main, a.b.c')).toEqual([])
  })

  it('o caminho dentro de uma URL nao vira outro link', () => {
    expect(textos('https://x.com/docs/a.md')).toEqual([['url', 'https://x.com/docs/a.md']])
  })

  it('posicoes batem com o texto', () => {
    const linha = 'ok: docs/a.md'
    const [l] = acharLinks(linha)
    expect(linha.slice(l!.inicio, l!.fim)).toBe('docs/a.md')
  })
})

describe('caminhoNoRepo', () => {
  const raiz = 'C:\\Users\\sidne\\pessoal\\lousa-ia'

  it('relativo fica relativo (com /) e perde ":linha"', () => {
    expect(caminhoNoRepo(raiz, 'docs\\ESTADO.md:12')).toBe('docs/ESTADO.md')
    expect(caminhoNoRepo(raiz, './src/a.ts:3:7')).toBe('src/a.ts')
    expect(caminhoNoRepo(raiz, 'package.json')).toBe('package.json')
  })

  it('absoluto dentro da pasta vira relativo, sem ligar para maiusculas', () => {
    expect(caminhoNoRepo(raiz, 'c:\\users\\sidne\\pessoal\\lousa-ia\\docs\\a.md')).toBe('docs/a.md')
    expect(caminhoNoRepo(`${raiz}\\`, 'C:/Users/sidne/pessoal/lousa-ia/src/b.ts')).toBe('src/b.ts')
  })

  it('fora da pasta ou absoluto de outro jeito = null', () => {
    expect(caminhoNoRepo(raiz, 'C:\\Windows\\win.ini')).toBeNull()
    expect(caminhoNoRepo(raiz, 'C:\\Users\\sidne\\pessoal\\lousa-ia-outro\\a.md')).toBeNull()
    expect(caminhoNoRepo(raiz, '/etc/hosts.txt')).toBeNull()
  })
})

describe('arquivoDeUri', () => {
  it('file:/// vira caminho do Windows; http e lixo = null', () => {
    expect(arquivoDeUri('file:///C:/Users/sidne/Meu%20Doc.md')).toBe('C:/Users/sidne/Meu Doc.md')
    expect(arquivoDeUri('https://x.com')).toBeNull()
    expect(arquivoDeUri('nao e uri')).toBeNull()
  })
})

describe('textoDaLinhaLogica', () => {
  const linha = (celulas: Array<[string, number]>, quebrada = false) => ({
    isWrapped: quebrada,
    length: celulas.length,
    getCell: (x: number) => {
      const c = celulas[x]
      return c ? { getChars: () => c[0], getWidth: () => c[1] } : undefined
    },
  })
  const letras = (t: string): Array<[string, number]> => [...t].map((c) => [c, 1])

  it('letra larga ocupa duas colunas; celula vazia vira espaco', () => {
    const r = textoDaLinhaLogica(
      [
        {
          y: 5,
          linha: linha([
            ['✅', 2],
            ['', 0],
            ['', 1],
            ['a', 1],
          ]),
        },
      ],
      80,
    )
    expect(r.texto).toBe('✅ a')
    expect(r.inicio).toEqual([
      { x: 1, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ])
    expect(r.fim.map((c) => c.x)).toEqual([2, 3, 4])
  })

  it('para nas colunas do terminal', () => {
    expect(textoDaLinhaLogica([{ y: 1, linha: linha(letras('abc')) }], 2).texto).toBe('ab')
  })

  it('caminho quebrado em duas linhas vira um link so, do comeco ao fim', () => {
    const r = textoDaLinhaLogica(
      [
        { y: 7, linha: linha(letras('ver C:\\pasta\\lon')) },
        { y: 8, linha: linha(letras('go\\a.md:2 ok'), true) },
      ],
      80,
    )
    expect(r.texto).toBe('ver C:\\pasta\\longo\\a.md:2 ok')
    const [link] = acharLinks(r.texto)
    expect(link?.texto).toBe('C:\\pasta\\longo\\a.md:2')
    expect(r.inicio[link!.inicio]).toEqual({ x: 5, y: 7 })
    expect(r.fim[link!.fim - 1]).toEqual({ x: 9, y: 8 })
  })
})
