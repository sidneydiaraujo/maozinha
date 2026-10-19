// Gera o icone da Lousa (T14.1): build/icon.png (512) e build/icon.ico (256, 64, 48, 32, 16).
// Desenho: uma lousa escura com tres quadros nas cores das contas. Sem dependencia: PNG e ICO
// montados aqui (zlib do Node), com 4x4 amostras por pixel para as bordas ficarem suaves.
// Rodar: node scripts/gerar-icone.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

/** Formas em coordenadas 0..1, pintadas em ordem: [x, y, largura, altura, raio, cor]. */
const FORMAS = [
  [0.03, 0.03, 0.94, 0.94, 0.2, [0x16, 0x1b, 0x24]], // lousa
  [0.11, 0.13, 0.36, 0.33, 0.07, [0x3b, 0x82, 0xf6]], // quadro azul
  [0.53, 0.13, 0.36, 0.33, 0.07, [0x22, 0xc5, 0x5e]], // quadro verde
  [0.11, 0.54, 0.78, 0.33, 0.07, [0xf5, 0xa5, 0x24]], // quadro ambar
  [0.15, 0.19, 0.2, 0.035, 0.017, [0xff, 0xff, 0xff]], // "texto" nos quadros
  [0.57, 0.19, 0.2, 0.035, 0.017, [0xff, 0xff, 0xff]],
  [0.15, 0.6, 0.4, 0.035, 0.017, [0x16, 0x1b, 0x24]],
]

function dentro([x, y, w, h, r], px, py) {
  if (px < x || px > x + w || py < y || py > y + h) return false
  const cx = Math.min(Math.max(px, x + r), x + w - r)
  const cy = Math.min(Math.max(py, y + r), y + h - r)
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r
}

/** RGBA de um icone `lado` x `lado`. */
function desenhar(lado) {
  const rgba = Buffer.alloc(lado * lado * 4)
  const N = 4
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      let [r, g, b, a] = [0, 0, 0, 0]
      for (let sy = 0; sy < N; sy++) {
        for (let sx = 0; sx < N; sx++) {
          const px = (x + (sx + 0.5) / N) / lado
          const py = (y + (sy + 0.5) / N) / lado
          let cor = null
          for (const f of FORMAS) if (dentro(f, px, py)) cor = f[5]
          if (cor) {
            r += cor[0]
            g += cor[1]
            b += cor[2]
            a += 1
          }
        }
      }
      const i = (y * lado + x) * 4
      rgba[i] = a ? Math.round(r / a) : 0
      rgba[i + 1] = a ? Math.round(g / a) : 0
      rgba[i + 2] = a ? Math.round(b / a) : 0
      rgba[i + 3] = Math.round((a / (N * N)) * 255)
    }
  }
  return rgba
}

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
writeFileSync('build/icon.ico', ico([256, 64, 48, 32, 16]))
console.log('build/icon.png e build/icon.ico gerados')
