// Gera o icone (T14.1, refeito em D41 e D51): build/icon.png (512) e build/icon.ico
// (256, 64, 48, 32, 24, 16). Desenho "Mãozinha" (D51): um monitor bege dos anos 80, tela de
// fosforo verde com linhas de varredura, e dentro a mãozinha do cursor em pixels.
// De 32 px para baixo vai uma versao simples, porque detalhe pequeno vira borrao.
// Sem dependencia: cada forma e uma distancia com sinal (negativa dentro), pintada com 4x4
// amostras por pixel; PNG e ICO montados aqui com o zlib do Node.
// Rodar: node scripts/gerar-icone.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

// monitor bege dos anos 80 com tela de fosforo verde (D51)
const BEGE_ALTO = [0xee, 0xe3, 0xc6]
const BEGE_BAIXO = [0xc9, 0xba, 0x95]
const MOLDURA = [0xa8, 0x99, 0x74]
const SOMBRA = [0x7d, 0x70, 0x52]
const TELA_CENTRO = [0x0f, 0x2e, 0x1c]
const TELA_BORDA = [0x05, 0x10, 0x0a]
const FOSFORO = [0x6c, 0xff, 0x9a]
const FOSFORO_FUNDO = [0x1f, 0x8c, 0x48]
const LED = [0x4c, 0xe0, 0x6c]

// ---- distancias com sinal, em coordenadas 0..256 ----
// Cada distancia leva o retangulo onde ela pode ser negativa (`limite`): fora dele a pintura
// nem calcula, senao as curvas deixam o script lento.

function comLimite(d, limite) {
  d.limite = limite
  return d
}

function caixa([x, y, w, h], r) {
  const cx = x + w / 2
  const cy = y + h / 2
  const d = (px, py) => {
    const qx = Math.abs(px - cx) - (w / 2 - r)
    const qy = Math.abs(py - cy) - (h / 2 - r)
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r
  }
  return comLimite(d, [x, y, x + w, y + h])
}

function circulo(cx, cy, r) {
  return comLimite((px, py) => Math.hypot(px - cx, py - cy) - r, [cx - r, cy - r, cx + r, cy + r])
}

function aoSegmento(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax
  const dy = by - ay
  const t = Math.min(Math.max(((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy), 0), 1)
  return Math.hypot(px - ax - t * dx, py - ay - t * dy)
}

/** Traco de ponta redonda por uma linha de pontos (cantos redondos tambem). */
function traco(pontos, largura) {
  const d = (px, py) => {
    let menor = Infinity
    for (let i = 1; i < pontos.length; i++) menor = Math.min(menor, aoSegmento(px, py, pontos[i - 1], pontos[i]))
    return menor - largura / 2
  }
  const xs = pontos.map((p) => p[0])
  const ys = pontos.map((p) => p[1])
  const m = largura / 2
  return comLimite(d, [Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m])
}

/** Contorno de uma forma: a faixa de `largura` centrada na borda, como o stroke do SVG. */
function borda(forma, largura) {
  const [x0, y0, x1, y1] = forma.limite
  const m = largura / 2
  return comLimite((px, py) => Math.abs(forma(px, py)) - m, [x0 - m, y0 - m, x1 + m, y1 + m])
}

// ---- o desenho ----

/** Casas que alcancam a borda andando na horizontal e na vertical sem passar por um #. */
function casasDeFora(linhas) {
  const alto = linhas.length
  const largo = linhas[0].length
  const fora = linhas.map((l) => [...l].map(() => false))
  const fila = []
  for (let y = 0; y < alto; y++) fila.push([0, y], [largo - 1, y])
  for (let x = 0; x < largo; x++) fila.push([x, 0], [x, alto - 1])
  while (fila.length) {
    const [x, y] = fila.pop()
    if (linhas[y]?.[x] === undefined || fora[y][x] || linhas[y][x] === '#') continue
    fora[y][x] = true
    fila.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
  }
  return fora
}

/**
 * Desenho em pixels (# = contorno; o que fica preso dentro dele e o recheio). Devolve as duas
 * formas, em celulas de `lado` a partir de (x0, y0).
 */
function pixels(linhas, x0, y0, lado) {
  const alto = linhas.length
  const largo = linhas[0].length
  const fora = casasDeFora(linhas)
  const casa = (teste) => {
    const d = (px, py) => {
      const x = Math.floor((px - x0) / lado)
      const y = Math.floor((py - y0) / lado)
      return x >= 0 && y >= 0 && x < largo && y < alto && teste(x, y) ? -1 : 1
    }
    return comLimite(d, [x0, y0, x0 + largo * lado, y0 + alto * lado])
  }
  return {
    contorno: casa((x, y) => linhas[y][x] === '#'),
    recheio: casa((x, y) => linhas[y][x] !== '#' && !fora[y][x]),
  }
}

/** A mãozinha do cursor apontando para cima: 16 x 18 casas. */
const MAO = [
  '.....##.........',
  '....#..#........',
  '....#..#........',
  '....#..#........',
  '....#..#........',
  '....#..###......',
  '....#..#..###...',
  '....#..#..#..#..',
  '.####..#..#..#..',
  '#............#..',
  '#............#..',
  '.#...........#..',
  '.#...........#..',
  '..#..........#..',
  '..#.........#...',
  '...#........#...',
  '...#........#...',
  '...##########...',
]

/** A mesma mão cheia, em 7 x 9, para os tamanhos pequenos: o dedo fino e alto diz "apontando". */
const MAO_PEQUENA = ['..#....', '..#....', '..#.#..', '..#####', '#.#####', '#######', '.######', '..#####', '..####.']

const TELA = [46, 40, 164, 128]
const brilhoDaTela = (px, py) => misturar(TELA_CENTRO, TELA_BORDA, Math.hypot(px - 128, (py - 104) * 1.3) / 95)

/** Gabinete bege, pe e base; a tela vem por cima. */
function monitor(simples) {
  const corpo = caixa([22, 18, 212, 184], simples ? 30 : 24)
  return [
    { d: caixa([66, 206, 124, 30], 12), cor: MOLDURA },
    { d: caixa([98, 196, 60, 20], 4), cor: SOMBRA },
    { d: corpo, cor: (_, py) => misturar(BEGE_ALTO, BEGE_BAIXO, (py - 18) / 184) },
    ...(simples ? [] : [{ d: borda(caixa([23.5, 19.5, 209, 181], 23), 3), cor: SOMBRA, alfa: 0.5 }]),
    { d: caixa([TELA[0] - 8, TELA[1] - 8, TELA[2] + 16, TELA[3] + 16], 24), cor: MOLDURA },
  ]
}

/** Linhas escuras de varredura, so dentro da tela. */
function varredura(tela) {
  return comLimite((px, py) => Math.max(tela(px, py), (py - TELA[1]) % 5 < 1.6 ? -1 : 1), tela.limite)
}

const telaDetalhada = caixa(TELA, 20)
const maoGrande = pixels(MAO, 128 - 8 * 5.6, 104 - 9 * 5.6, 5.6)
const DETALHADO = [
  ...monitor(false),
  { d: telaDetalhada, cor: brilhoDaTela },
  { d: maoGrande.recheio, cor: FOSFORO_FUNDO },
  { d: maoGrande.contorno, cor: FOSFORO },
  { d: varredura(telaDetalhada), cor: TELA_BORDA, alfa: 0.35 },
  { d: borda(telaDetalhada, 3), cor: TELA_BORDA },
  { d: traco([[52, 185], [104, 185]], 5), cor: SOMBRA, alfa: 0.6 },
  { d: circulo(200, 185, 6), cor: LED },
]

const telaSimples = caixa([42, 36, 172, 136], 22)
const maoSimples = pixels(MAO_PEQUENA, 128 - 3.5 * 13, 104 - 4.5 * 13, 13)
const SIMPLES = [
  ...monitor(true),
  { d: telaSimples, cor: TELA_CENTRO },
  { d: maoSimples.contorno, cor: FOSFORO },
]

/** Ate 32 px vai o desenho simples. */
const desenhoPara = (lado) => (lado <= 32 ? SIMPLES : DETALHADO)

// ---- pintura ----

function misturar(a, b, t) {
  const k = Math.min(Math.max(t, 0), 1)
  return a.map((c, i) => c + (b[i] - c) * k)
}

const AMOSTRAS = 4 // por lado do pixel: 4x4 = 16

/** [r, g, b, a] (0..255, sem pre-multiplicar) de um ponto: as formas pintadas em ordem, por cima. */
function corEm(formas, px, py) {
  let cor = [0, 0, 0]
  let a = 0
  for (const f of formas) {
    const [x0, y0, x1, y1] = f.d.limite
    if (px < x0 || px > x1 || py < y0 || py > y1 || f.d(px, py) > 0) continue
    const k = f.alfa ?? 1
    const nova = typeof f.cor === 'function' ? f.cor(px, py) : f.cor
    const aFinal = k + a * (1 - k)
    cor = cor.map((c, i) => (nova[i] * k + c * a * (1 - k)) / aFinal)
    a = aFinal
  }
  return [...cor, a]
}

/** RGBA de um pixel: media das amostras, com a cor pesada pela cobertura. */
function pixel(formas, x, y, lado) {
  const soma = [0, 0, 0]
  let cobertura = 0
  for (let i = 0; i < AMOSTRAS * AMOSTRAS; i++) {
    const px = ((x + ((i % AMOSTRAS) + 0.5) / AMOSTRAS) / lado) * 256
    const py = ((y + (Math.floor(i / AMOSTRAS) + 0.5) / AMOSTRAS) / lado) * 256
    const [r, g, b, a] = corEm(formas, px, py)
    soma[0] += r * a
    soma[1] += g * a
    soma[2] += b * a
    cobertura += a
  }
  const media = soma.map((c) => (cobertura ? Math.round(c / cobertura) : 0))
  return [...media, Math.round((cobertura / (AMOSTRAS * AMOSTRAS)) * 255)]
}

/** RGBA de um icone `lado` x `lado`. */
function desenhar(lado) {
  const formas = desenhoPara(lado)
  const rgba = Buffer.alloc(lado * lado * 4)
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) rgba.set(pixel(formas, x, y, lado), (y * lado + x) * 4)
  }
  return rgba
}

// ---- PNG e ICO ----

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pedaco(tipo, dados) {
  const tamanho = Buffer.alloc(4)
  tamanho.writeUInt32BE(dados.length)
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(corpo))
  return Buffer.concat([tamanho, corpo, crc])
}

function png(lado) {
  const rgba = desenhar(lado)
  const linhas = Buffer.alloc(lado * (lado * 4 + 1))
  for (let y = 0; y < lado; y++) rgba.copy(linhas, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4)
  const cabecalho = Buffer.alloc(13)
  cabecalho.writeUInt32BE(lado, 0)
  cabecalho.writeUInt32BE(lado, 4)
  cabecalho.set([8, 6, 0, 0, 0], 8) // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pedaco('IHDR', cabecalho),
    pedaco('IDAT', deflateSync(linhas, { level: 9 })),
    pedaco('IEND', Buffer.alloc(0)),
  ])
}

/** ICO com PNG dentro de cada tamanho (aceito pelo Windows desde o Vista). */
function ico(lados) {
  const imagens = lados.map(png)
  const cabecalho = Buffer.alloc(6)
  cabecalho.writeUInt16LE(1, 2)
  cabecalho.writeUInt16LE(lados.length, 4)
  let posicao = 6 + 16 * lados.length
  const entradas = lados.map((lado, i) => {
    const e = Buffer.alloc(16)
    e[0] = lado >= 256 ? 0 : lado
    e[1] = lado >= 256 ? 0 : lado
    e.writeUInt16LE(1, 4)
    e.writeUInt16LE(32, 6)
    e.writeUInt32LE(imagens[i].length, 8)
    e.writeUInt32LE(posicao, 12)
    posicao += imagens[i].length
    return e
  })
  return Buffer.concat([cabecalho, ...entradas, ...imagens])
}

mkdirSync('build', { recursive: true })
writeFileSync('build/icon.png', png(512))
writeFileSync('build/icon.ico', ico([256, 64, 48, 32, 24, 16]))
// so para conferir o desenho simples (nao vai para o instalador)
if (process.argv.includes('--amostras')) for (const lado of [64, 32, 16]) writeFileSync(`build/amostra-${lado}.png`, png(lado))
console.log('build/icon.png e build/icon.ico gerados')
