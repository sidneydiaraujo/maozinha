import { describe, expect, it } from 'vitest'
import { atalhoDe } from './teclas'

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
