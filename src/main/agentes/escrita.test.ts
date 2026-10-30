import { describe, expect, it } from 'vitest'
import { caminhoEscrito, ganchoDeEscrita } from './escrita'

describe('ganchoDeEscrita (A16)', () => {
  it('PostToolUse nas ferramentas que salvam, gravando com barra normal', () => {
    expect(ganchoDeEscrita('C:\\dados\\agentes\\q1.escrita.json')).toEqual({
      PostToolUse: [
        {
          matcher: 'Write|Edit|MultiEdit|NotebookEdit',
          hooks: [{ type: 'command', command: 'findstr "^" > "C:/dados/agentes/q1.escrita.json"' }],
        },
      ],
    })
  })
})

describe('caminhoEscrito', () => {
  it('Write e Edit: tool_input.file_path; NotebookEdit: notebook_path', () => {
    expect(caminhoEscrito('{"tool_name":"Write","tool_input":{"file_path":"C:\\\\p\\\\a.ts","content":"x"}}')).toBe(
      'C:\\p\\a.ts',
    )
    expect(caminhoEscrito('{"tool_input":{"notebook_path":"C:\\\\p\\\\n.ipynb"}}')).toBe('C:\\p\\n.ipynb')
  })

  it('caminho relativo: a partir do cwd do gancho', () => {
    expect(caminhoEscrito('{"cwd":"C:\\\\p","tool_input":{"file_path":"src\\\\b.ts"}}')).toBe('C:\\p\\src\\b.ts')
    expect(caminhoEscrito('{"tool_input":{"file_path":"src\\\\b.ts"}}')).toBeNull()
  })

  it('JSON quebrado, sem tool_input ou caminho que nao e texto: null', () => {
    expect(caminhoEscrito('{quebrado')).toBeNull()
    expect(caminhoEscrito('null')).toBeNull()
    expect(caminhoEscrito('{"tool_input":{"file_path":42}}')).toBeNull()
  })
})
