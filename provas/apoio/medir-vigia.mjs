// Quanto um vigia RECURSIVO de uma pasta receberia (o que derrubava a digitacao no D17).
// Conta avisos por segundo, caminhos diferentes, custo do stat e onde mais muda.
// uso: node provas/apoio/medir-vigia.mjs [pasta] [segundos]   (padrao: a pasta do usuario, 30 s)
import { statSync, watch } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const pasta = process.argv[2] ?? homedir()
const segundos = Number(process.argv[3] ?? 30)
const FORA = new Set(['.git', '.svn', '.hg', 'node_modules', 'out', 'dist', '.jj', '.DS_Store', 'Thumbs.db'])
const diferentes = new Set()
const porTopo = new Map()
let brutos = 0
let erros = 0
let msStat = 0

const vigia = watch(pasta, { recursive: true }, (_tipo, nome) => {
  brutos++
  const texto = nome?.toString() ?? ''
  const partes = texto.split(/[\\/]/)
  if (partes.some((p) => FORA.has(p))) return
  diferentes.add(texto)
  const topo = partes.slice(0, 3).join('\\')
  porTopo.set(topo, (porTopo.get(topo) ?? 0) + 1)
  const inicio = performance.now()
  try {
    statSync(join(pasta, texto), { throwIfNoEntry: false })
  } catch {
    erros++ // EPERM em arquivo de outro app: era o erro do main no D17
  }
  msStat += performance.now() - inicio
})

setTimeout(() => {
  vigia.close()
  console.log(`pasta: ${pasta} | ${segundos} s`)
  console.log(`avisos: ${brutos} (${(brutos / segundos).toFixed(0)}/s) | caminhos diferentes: ${diferentes.size}`)
  console.log(`stat: ${msStat.toFixed(0)} ms no total, ${erros} erros (EPERM etc.)`)
  console.log('onde mais mudou:')
  for (const [k, v] of [...porTopo].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`  ${v}\t${k || '(raiz)'}`)
}, segundos * 1000)
