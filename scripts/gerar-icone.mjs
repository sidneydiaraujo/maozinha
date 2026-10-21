// Gera o icone da Lousa (T14.1, refeito em D41): build/icon.png (512) e build/icon.ico
// (256, 64, 48, 32, 24, 16). Desenho "Time na lousa": um terminal com o prompt >_ puxa duas
// linhas ate dois colegas, sobre a ardosia, com as cores do app (giz, ambar e a cor de time).
// De 32 px para baixo vai uma versao simples, porque detalhe pequeno vira borrao.
// Sem dependencia: cada forma e uma distancia com sinal (negativa dentro), pintada com 4x4
// amostras por pixel; PNG e ICO montados aqui com o zlib do Node.
// Rodar: node scripts/gerar-icone.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

// cores do src/renderer/src/estilos/tokens.css (D36) e o fundo da proposta aprovada
const GIZ = [0xdc, 0xd8, 0xcc]
const AMBAR = [0xf0, 0xb4, 0x4c]
const TIME = [0x7f, 0xd1, 0xc7]
const QUADRO = [0x13, 0x1c, 0x27]
const ARDOSIA_ALTO = [0x1b, 0x28, 0x36]
const ARDOSIA_BAIXO = [0x0d, 0x14, 0x1b]

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

/** Curva cubica (o "C" do SVG) virada em 48 pedacos retos. */
function curva(p0, p1, p2, p3) {
  return Array.from({ length: 49 }, (_, i) => {
    const t = i / 48
    const a = (1 - t) ** 3
    const b = 3 * (1 - t) ** 2 * t
    const c = 3 * (1 - t) * t ** 2
    const d = t ** 3
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]
  })
}

/** Contorno de uma forma: a faixa de `largura` centrada na borda, como o stroke do SVG. */
function borda(forma, largura) {
  const [x0, y0, x1, y1] = forma.limite
  const m = largura / 2
  return comLimite((px, py) => Math.abs(forma(px, py)) - m, [x0 - m, y0 - m, x1 + m, y1 + m])
}

// ---- o desenho ----

/** Ardosia com degrade de cima para baixo e um fio de giz na borda. */
const FUNDO = [
  { d: caixa([8, 8, 240, 240], 54), cor: (_, py) => misturar(ARDOSIA_ALTO, ARDOSIA_BAIXO, (py - 8) / 240) },
  { d: borda(caixa([9.5, 9.5, 237, 237], 52.5), 3), cor: GIZ, alfa: 0.1 },
]

/** Um quadro com fundo escuro e contorno de giz. */
function quadro(retangulo, r) {
  return [
    { d: caixa(retangulo, r), cor: QUADRO },
    { d: borda(caixa(retangulo, r), 6), cor: GIZ },
  ]
}

const DETALHADO = [
  ...FUNDO,
  { d: traco(curva([112, 128], [134, 128], [130, 76], [150, 76]), 7), cor: TIME },
  { d: traco(curva([112, 128], [134, 128], [130, 180], [150, 180]), 7), cor: TIME },
  ...quadro([30, 90, 82, 76], 16),
  { d: traco([[48, 114], [62, 127], [48, 140]], 8), cor: GIZ },
  { d: traco([[70, 143], [92, 143]], 8), cor: AMBAR },
  ...quadro([150, 44, 76, 64], 15),
  { d: traco([[166, 68], [208, 68]], 7), cor: GIZ, alfa: 0.55 },
  { d: traco([[166, 84], [194, 84]], 7), cor: GIZ, alfa: 0.55 },
  ...quadro([150, 148, 76, 64], 15),
  { d: traco([[166, 172], [208, 172]], 7), cor: GIZ, alfa: 0.55 },
  { d: traco([[166, 188], [190, 188]], 7), cor: GIZ, alfa: 0.55 },
  { d: circulo(112, 128, 9), cor: TIME },
  { d: circulo(150, 76, 8), cor: TIME },
  { d: circulo(150, 180, 8), cor: TIME },
]

const SIMPLES = [
  ...FUNDO,
  { d: traco(curva([100, 128], [140, 128], [128, 70], [168, 70]), 18), cor: TIME },
  { d: traco(curva([100, 128], [140, 128], [128, 186], [168, 186]), 18), cor: TIME },
  { d: caixa([28, 88, 86, 80], 20), cor: GIZ },
  { d: traco([[50, 112], [66, 128], [50, 144]], 13), cor: QUADRO },
  { d: caixa([160, 40, 68, 60], 18), cor: GIZ },
  { d: caixa([160, 156, 68, 60], 18), cor: GIZ },
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
