import { describe, expect, it } from 'vitest'
import type { AvisoAgente } from '../../../shared/model'
import {
  aplicarAviso,
  brilhoDoQuadro,
  chamaAtencao,
  esquecerAviso,
  marcarVisto,
  proximoAChamar,
  seloDoAviso,
  textoDaPilula,
  type MapaAtencao,
} from './atencao'

const vazio: MapaAtencao = new Map()

describe('aplicarAviso e chamaAtencao', () => {
  it('esperando, terminou e erro chamam ate o Sidney clicar; trabalhando e parado nao', () => {
    let m = aplicarAviso(vazio, 'q1', { estado: 'esperando', motivo: 'permissao' })
    expect(chamaAtencao(m.get('q1'))).toBe(true)
    m = marcarVisto(m, 'q1')
    expect(chamaAtencao(m.get('q1'))).toBe(false)
    m = aplicarAviso(m, 'q1', { estado: 'trabalhando' })
    expect(chamaAtencao(m.get('q1'))).toBe(false)
    m = aplicarAviso(m, 'q1', { estado: 'terminou' })
    expect(chamaAtencao(m.get('q1'))).toBe(true)
    expect(chamaAtencao(aplicarAviso(vazio, 'q2', { estado: 'erro' }).get('q2'))).toBe(true)
    expect(chamaAtencao(aplicarAviso(vazio, 'q2', { estado: 'parado' }).get('q2'))).toBe(false)
    expect(chamaAtencao(undefined)).toBe(false)
  })

  it('aviso repetido devolve o mesmo mapa e nao desfaz o visto', () => {
    const m = marcarVisto(aplicarAviso(vazio, 'q1', { estado: 'terminou', mensagem: 'ok' }), 'q1')
    expect(aplicarAviso(m, 'q1', { estado: 'terminou', mensagem: 'ok' })).toBe(m)
    expect(marcarVisto(m, 'q1')).toBe(m)
    expect(marcarVisto(m, 'nada')).toBe(m)
  })

  it('esquecer (terminal saiu, agente dormiu): some da pilula e do selo; quem nao estava, mesmo mapa', () => {
    const m = aplicarAviso(aplicarAviso(vazio, 'q1', { estado: 'trabalhando' }), 'q2', { estado: 'trabalhando' })
    expect(textoDaPilula(m, ['q1', 'q2'])).toBe('● 2 trabalhando')
    const sem = esquecerAviso(m, 'q1')
    expect(textoDaPilula(sem, ['q1', 'q2'])).toBe('● 1 trabalhando')
    expect(sem.has('q1')).toBe(false)
    expect(esquecerAviso(sem, 'q1')).toBe(sem)
  })
})

describe('proximoAChamar', () => {
  it('segue a ordem da lousa e da a volta', () => {
    let m = aplicarAviso(vazio, 'b', { estado: 'esperando' })
    m = aplicarAviso(m, 'd', { estado: 'erro' })
    m = aplicarAviso(m, 'c', { estado: 'trabalhando' })
    m = aplicarAviso(m, 'a', { estado: 'terminou' }) // terminou vai para a fila de prontos (A26)
    const ordem = ['a', 'b', 'c', 'd']
    expect(proximoAChamar(m, ordem, null)).toBe('b')
    expect(proximoAChamar(m, ordem, 'b')).toBe('d')
    expect(proximoAChamar(m, ordem, 'd')).toBe('b')
    expect(proximoAChamar(m, ordem, 'sumiu')).toBe('b')
    expect(proximoAChamar(vazio, ordem, null)).toBeNull()
  })
})

describe('seloDoAviso', () => {
  it('texto curto por estado e motivo; parado sem selo', () => {
    expect(seloDoAviso({ estado: 'trabalhando' })?.texto).toBe('trabalhando')
    expect(seloDoAviso({ estado: 'esperando' })).toEqual({ texto: 'esperando você', classe: 'selo-esperando' })
    expect(seloDoAviso({ estado: 'esperando', motivo: 'permissao' })?.texto).toBe('pedindo permissão')
    expect(seloDoAviso({ estado: 'esperando', motivo: 'pergunta' })?.texto).toBe('pergunta para você')
    expect(seloDoAviso({ estado: 'terminou' })?.classe).toBe('selo-terminou')
    expect(seloDoAviso({ estado: 'erro' })?.classe).toBe('selo-erro')
    expect(seloDoAviso({ estado: 'parado' })).toBeNull()
  })
})

describe('brilhoDoQuadro', () => {
  const com = (estados: Array<[string, AvisoAgente['estado']]>): MapaAtencao =>
    estados.reduce<MapaAtencao>((m, [id, estado]) => aplicarAviso(m, id, { estado }), new Map())
  it('so quem esta trabalhando brilha', () => {
    const mapa = com([
      ['a', 'trabalhando'],
      ['b', 'esperando'],
    ])
    expect(brilhoDoQuadro(mapa, 'a')).toBe('anima')
    expect(brilhoDoQuadro(mapa, 'b')).toBeNull()
    expect(brilhoDoQuadro(mapa, 'c')).toBeNull()
  })
  it('do quinto em diante a borda fica parada', () => {
    const mapa = com(['a', 'b', 'x', 'c', 'd', 'e'].map((id) => [id, id === 'x' ? 'parado' : 'trabalhando']))
    expect(['a', 'b', 'c', 'd', 'e'].map((id) => brilhoDoQuadro(mapa, id))).toEqual([
      'anima',
      'anima',
      'anima',
      'anima',
      'parado',
    ])
  })
})

describe('textoDaPilula', () => {
  it('esperando e trabalhando', () => {
    const mapa = [
      ['a', 'esperando'],
      ['b', 'trabalhando'],
      ['c', 'trabalhando'],
    ].reduce<MapaAtencao>((m, [id, estado]) => aplicarAviso(m, id!, { estado: estado as 'esperando' }), new Map())
    expect(textoDaPilula(mapa, ['a', 'b', 'c'])).toBe('● 1 esperando você · 2 trabalhando')
    expect(textoDaPilula(mapa, ['b'])).toBe('● 1 trabalhando')
    expect(textoDaPilula(new Map(), ['a'])).toBeNull()
  })
})
