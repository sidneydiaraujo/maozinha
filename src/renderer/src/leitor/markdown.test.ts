import { describe, expect, it } from 'vitest'
import { renderizarMarkdown, resolverLink } from './markdown'

describe('renderizarMarkdown', () => {
  it('formata titulo, lista e codigo', () => {
    const html = renderizarMarkdown('# Roteiro\n\n- um\n\n`npm run check`')
    expect(html).toContain('<h1>Roteiro</h1>')
    expect(html).toContain('<li>um</li>')
    expect(html).toContain('<code>npm run check</code>')
  })

  it('HTML dentro do md vira texto: nada roda na tela', () => {
    const html = renderizarMarkdown('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('link javascript: nao vira link; imagem vira texto', () => {
    expect(renderizarMarkdown('[x](javascript:alert(1))')).not.toContain('href="javascript')
    const html = renderizarMarkdown('![tela de login](https://exemplo.com/a.png)')
    expect(html).not.toContain('<img')
    expect(html).toContain('[tela de login]')
  })

  it('caixas de tarefa viram ☐ e ☑', () => {
    const html = renderizarMarkdown('- [ ] 3. Login\n- [x] 4. Pasta')
    expect(html).toContain('<li class="md-tarefa">☐ 3. Login</li>')
    expect(html).toContain('<li class="md-tarefa md-feita">☑ 4. Pasta</li>')
  })

  it('caixas tambem em lista com linha em branco entre os itens (como o roteiro)', () => {
    const html = renderizarMarkdown('- [ ] 3. Login\n\n- [x] 4. Pasta\n')
    expect(html).toContain('<li class="md-tarefa">\n<p>☐ 3. Login</p>')
    expect(html).toContain('<li class="md-tarefa md-feita">\n<p>☑ 4. Pasta</p>')
  })
})

describe('resolverLink', () => {
  it('relativo ao arquivo, com .. e %20; / = raiz do repo', () => {
    expect(resolverLink('docs/plano/README.md', 'fatia-7.md')).toBe('docs/plano/fatia-7.md')
    expect(resolverLink('docs/plano/README.md', '../aceite/roteiro.md#item-3')).toBe('docs/aceite/roteiro.md')
    expect(resolverLink('README.md', 'docs/Meu%20Doc.md')).toBe('docs/Meu Doc.md')
    expect(resolverLink('docs/a.md', '/CLAUDE.md')).toBe('CLAUDE.md')
  })

  it('fora do repo, ancora sozinha ou outro protocolo = null', () => {
    expect(resolverLink('README.md', '../fora.md')).toBeNull()
    expect(resolverLink('docs/a.md', '#titulo')).toBeNull()
    expect(resolverLink('docs/a.md', 'https://x.com')).toBeNull()
    expect(resolverLink('docs/a.md', 'file:///C:/x')).toBeNull()
  })
})
