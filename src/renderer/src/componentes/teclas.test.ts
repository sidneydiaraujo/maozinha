import { describe, expect, it } from 'vitest'
import { ALT_V, atalhoDe, colagem } from './teclas'

describe('colagem (Ctrl+V)', () => {
  it('so um print: o Alt+V do Claude', () => {
    expect(colagem(true, '')).toEqual({ tipo: 'imagem' })
    expect(ALT_V).toBe('\x1bv')
  })

  it('so texto: cola o texto', () => {
    expect(colagem(false, 'git status')).toEqual({ tipo: 'texto', texto: 'git status' })
  })

  it('texto e imagem juntos: o texto ganha, como hoje', () => {
    expect(colagem(true, 'legenda')).toEqual({ tipo: 'texto', texto: 'legenda' })
  })

  it('nada na area de transferencia: null (segue o ^V para o programa)', () => {
    expect(colagem(false, '')).toBeNull()
  })
})

const tecla = (key: string, mods: Partial<{ ctrl: boolean; shift: boolean; alt: boolean; meta: boolean }> = {}) => ({
  key,
  ctrlKey: !!mods.ctrl,
  shiftKey: !!mods.shift,
  altKey: !!mods.alt,
  metaKey: !!mods.meta,
})

describe('atalhoDe', () => {
  it('Ctrl+C copia ou interrompe; Ctrl+Shift+C so copia', () => {
    expect(atalhoDe(tecla('c', { ctrl: true }))).toBe('copiarOuInterromper')
    expect(atalhoDe(tecla('C', { ctrl: true, shift: true }))).toBe('copiar')
  })

  it('Ctrl+V cola ou segue para o programa; Ctrl+Shift+V e Shift+Insert so colam', () => {
    expect(atalhoDe(tecla('v', { ctrl: true }))).toBe('colarOuSeguir')
    expect(atalhoDe(tecla('V', { ctrl: true, shift: true }))).toBe('colar')
    expect(atalhoDe(tecla('Insert', { shift: true }))).toBe('colar')
    expect(atalhoDe(tecla('f', { ctrl: true }))).toBe('buscar')
    expect(atalhoDe(tecla('F', { ctrl: true, shift: true }))).toBeNull()
  })

  it('o resto segue para o terminal (Alt+V do Claude, letras, Ctrl+D)', () => {
    expect(atalhoDe(tecla('v', { alt: true }))).toBeNull()
    expect(atalhoDe(tecla('v', { ctrl: true, alt: true }))).toBeNull()
    expect(atalhoDe(tecla('c'))).toBeNull()
    expect(atalhoDe(tecla('d', { ctrl: true }))).toBeNull()
    expect(atalhoDe(tecla('Insert'))).toBeNull()
  })
})
