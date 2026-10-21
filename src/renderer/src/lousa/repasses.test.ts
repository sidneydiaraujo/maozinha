import { describe, expect, it } from 'vitest'
import { rotuloDoRepasse } from './repasses'

const base = { ligacaoId: 'l1', para: 'Revisor' }

describe('rotuloDoRepasse', () => {
  it('passou e fechado so avisam; perguntar e o freio passam no clique', () => {
    expect(rotuloDoRepasse({ ...base, tipo: 'repassou' })).toMatchObject({ texto: '→ passou para Revisor', passa: false })
    expect(rotuloDoRepasse({ ...base, tipo: 'descartado' })).toMatchObject({ texto: 'Revisor está fechado', passa: false })
    expect(rotuloDoRepasse({ ...base, tipo: 'perguntar' })).toMatchObject({ texto: '▶ Passar para Revisor', passa: true })
    expect(rotuloDoRepasse({ ...base, tipo: 'limite' })).toMatchObject({ texto: 'Limite de 3 repasses: Continuar?', passa: true })
  })
})
