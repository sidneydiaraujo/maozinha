import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { acharSessao, copiarSessao } from './sessoes'

const ID = '6d6af6e2-54e2-4c60-905c-497cd36f8073'
const SUB = 'C--Users-x-app'
const raizes: string[] = []

function conta(): string {
  const dir = mkdtempSync(join(tmpdir(), 'lousa-sessao-'))
  raizes.push(dir)
  return dir
}

function gravar(configDir: string, arquivo: string, conteudo: string): void {
  const caminho = join(configDir, 'projects', arquivo)
  mkdirSync(join(caminho, '..'), { recursive: true })
  writeFileSync(caminho, conteudo)
}

afterEach(() => {
  for (const r of raizes.splice(0)) rmSync(r, { recursive: true, force: true })
})

describe('acharSessao', () => {
  it('acha a subpasta onde o Claude guardou a conversa', () => {
    const a = conta()
    gravar(a, `outro-projeto/${'0'.repeat(8)}-0000-0000-0000-000000000000.jsonl`, '{}')
    gravar(a, `${SUB}/${ID}.jsonl`, '{}')
    expect(acharSessao(a, ID)).toBe(SUB)
  })

  it('conversa que nao existe, conta sem projects ou id fora do formato: null', () => {
    const a = conta()
    expect(acharSessao(a, ID)).toBeNull()
    gravar(a, `${SUB}/x.jsonl`, '{}')
    expect(acharSessao(a, '../x')).toBeNull()
  })
})

describe('copiarSessao', () => {
  it('copia o arquivo e a pasta de subagentes para a mesma subpasta da outra conta', () => {
    const [a, b] = [conta(), conta()]
    gravar(a, `${SUB}/${ID}.jsonl`, 'conversa')
    gravar(a, `${SUB}/${ID}/subagents/s1.jsonl`, 'sub')
    expect(copiarSessao(a, b, ID)).toBe(true)
    expect(readFileSync(join(b, 'projects', SUB, `${ID}.jsonl`), 'utf8')).toBe('conversa')
    expect(readFileSync(join(b, 'projects', SUB, ID, 'subagents', 's1.jsonl'), 'utf8')).toBe('sub')
    expect(acharSessao(b, ID)).toBe(SUB)
  })

  it('ida e volta: a copia mais nova sobrescreve a antiga', () => {
    const [a, b] = [conta(), conta()]
    gravar(a, `${SUB}/${ID}.jsonl`, 'v1')
    copiarSessao(a, b, ID)
    gravar(b, `${SUB}/${ID}.jsonl`, 'v1+v2')
    copiarSessao(b, a, ID)
    expect(readFileSync(join(a, 'projects', SUB, `${ID}.jsonl`), 'utf8')).toBe('v1+v2')
  })

  it('nada digitado ainda (sem arquivo): nao copia e devolve false', () => {
    expect(copiarSessao(conta(), conta(), ID)).toBe(false)
  })
})
