// Estados de teste (o estado.json de uma pasta de dados separada). Nunca o estado real.
// demo: dois terminais comuns na pasta de exemplo (contas Principal e Pessoal, sem login).
// casa: a pasta do usuario salva (aberta na arvore, so leitura) + dois terminais, como no D17.
// git: dois repositorios git novos (app e api) e tres terminais, para copia separada,
// juntar, Ctrl+K e mensagem para varios quadros (Fatias 10 a 13).
// time: tres agentes de verdade (Fatia 28) nos repositorios do git, mais um terminal comum.
// repasse: dois agentes de verdade (Pessoal) no app, ja ligados a1 -> a2 (Fatia 30).
// fantasmas: o app com quatro copias (R3.16): c-sumiu (pasta apagada), c-vazia (pasta esvaziada),
// c-viva (normal) e c-trabalho (pasta apagada, com um commit que nunca foi juntado).
// juntar-time: tres agentes de verdade (Pessoal), cada um numa copia do app, ligados a1 -> a2 -> a3 (Fatia 31).
// contrato: o agente de verdade do `agente` mais um terminal comum da mesma conta (R4.21).
// livre: a conta Pessoal com pasta livre na pasta da rodada (D65), que guarda o app e a api (git)
// mas nao e projeto; nenhum quadro: o cenario abre o quadro livre.
// agente: UM AGENTE DE VERDADE (claude.exe, conta Pessoal) na copia da pasta de exemplo, para a
// linha de status (Fatia 17). Pede o ok do Sidney; o cenario nao manda mensagem nenhuma.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const caixa = (x, largura) => ({ x, y: 40, largura, altura: 380 })

const terminal = (id, repoId, perfilId, x, largura) => ({
  id,
  repoId,
  perfilId,
  tipo: 'terminal',
  titulo: `Terminal ${id.slice(1)}`,
  caixa: caixa(x, largura),
})

const repo = (id, nome, caminho) => ({ id, nome, caminho, perfilPadraoId: 'principal' })

export const ESTADOS = ['demo', 'casa', 'git', 'agente', 'contrato', 'time', 'repasse', 'juntar-time', 'fantasmas', 'livre']

/** Repositorio git com um commit; identidade e fim de linha locais (o autocrlf do PC nao vale aqui). */
function criarRepo(pasta) {
  mkdirSync(pasta, { recursive: true })
  const git = (...a) => execFileSync('git', a, { cwd: pasta, encoding: 'utf8' })
  git('init', '-q', '-b', 'main')
  git('config', 'user.email', 'prova@lousa')
  git('config', 'user.name', 'prova')
  git('config', 'commit.gpgsign', 'false')
  git('config', 'core.autocrlf', 'false')
  writeFileSync(join(pasta, 'leia.md'), '# app de teste\n')
  git('add', '.')
  git('commit', '-qm', 'init')
  return git
}

/** R3.16: copias de verdade que depois somem ou ficam vazias, como as do PC do Sidney. */
function criarCopiasFantasmas(git, app, saida) {
  const pastas = {}
  for (const nome of ['c-sumiu', 'c-vazia', 'c-viva', 'c-trabalho']) {
    pastas[nome] = join(saida, 'app.copias', nome)
    git('worktree', 'add', '-q', '-b', `lousa/${nome}`, pastas[nome])
  }
  writeFileSync(join(pastas['c-trabalho'], 'novo.md'), '# trabalho que nao foi juntado\n')
  execFileSync('git', ['add', 'novo.md'], { cwd: pastas['c-trabalho'] })
  execFileSync('git', ['commit', '-qm', 'trabalho'], { cwd: pastas['c-trabalho'] })
  rmSync(pastas['c-sumiu'], { recursive: true, force: true })
  rmSync(pastas['c-trabalho'], { recursive: true, force: true })
  for (const item of readdirSync(pastas['c-vazia'])) rmSync(join(pastas['c-vazia'], item), { recursive: true, force: true })
  return pastas
}

/**
 * Pastas que o estado `git` precisa, criadas dentro da saida da rodada. O `app` tem um arquivo
 * em subpasta (Ctrl+K acha) e o mesmo nome dentro de node_modules (Ctrl+K nao pode achar).
 */
export function prepararPastas(nome, saida) {
  if (!['git', 'time', 'repasse', 'juntar-time', 'fantasmas', 'livre'].includes(nome)) return {}
  const app = join(saida, 'app')
  const api = join(saida, 'api')
  const git = criarRepo(app)
  criarRepo(api)
  mkdirSync(join(app, 'docs', 'plano'), { recursive: true })
  writeFileSync(join(app, 'docs', 'plano', 'fatia-12.md'), '# Fatia 12\n\nCtrl+K e Ctrl+F.\n')
  mkdirSync(join(app, 'node_modules', 'x'), { recursive: true })
  writeFileSync(join(app, 'node_modules', 'x', 'fatia-12.md'), 'nao deve aparecer\n')
  // a pasta original precisa nascer limpa: o Juntar recusa com qualquer alteracao pendente
  writeFileSync(join(app, '.gitignore'), 'node_modules/\n')
  git('add', '.')
  git('commit', '-qm', 'docs')
  if (nome === 'fantasmas') return { app, api, ...criarCopiasFantasmas(git, app, saida) }
  return nome === 'juntar-time' ? { app, api, ...criarCopiasDoTime(git, app, saida) } : { app, api }
}

/**
 * Tres copias do app (git worktree, como as da Lousa), para juntar o time (T31.1): c1 com um
 * commit no leia.md; c2 com um commit e um arquivo nao salvo (fica de fora); c3 com um commit no
 * mesmo trecho do leia.md que a c1 (conflito depois que a c1 entra).
 */
function criarCopiasDoTime(git, app, saida) {
  const pastas = {}
  const mudar = (nome, arquivo, texto, salvar = true) => {
    writeFileSync(join(pastas[nome], arquivo), texto)
    if (!salvar) return
    execFileSync('git', ['add', arquivo], { cwd: pastas[nome] })
    execFileSync('git', ['commit', '-qm', `${nome}: ${arquivo}`], { cwd: pastas[nome] })
  }
  for (const nome of ['c1', 'c2', 'c3']) {
    pastas[nome] = join(saida, 'app.copias', nome)
    git('worktree', 'add', '-q', '-b', `lousa/${nome}`, pastas[nome])
  }
  mudar('c1', 'leia.md', '# app de teste\n\nc1 escreveu aqui\n')
  mudar('c2', 'novo-c2.md', '# do c2\n')
  mudar('c2', 'rascunho.md', 'ainda nao salvo\n', false)
  mudar('c3', 'leia.md', '# app de teste\n\nc3 escreveu outra coisa\n')
  return pastas
}

/**
 * `pastas` = { pastaDemo, casa, app, api }: caminhos absolutos montados pelo rodar.mjs.
 * Opcao `brilho` no casa: mais tres terminais, para 5 quadros trabalhando (T21.2).
 */
export function estadoDe(nome, pastas, opcoes = []) {
  const demo = repo('rd', 'pasta-demo', pastas.pastaDemo)
  const base = { versao: 2, perfis: {}, viewport: { x: 0, y: 0, zoom: 0.8 }, ultimoPerfilId: 'principal' }
  if (nome === 'casa') {
    return {
      ...base,
      repos: [repo('home', 'casa', pastas.casa), demo],
      quadros: [
        terminal('t1', 'rd', 'principal', 40, 620),
        terminal('t2', 'rd', 'principal', 680, 520),
        ...(opcoes.includes('brilho') ? [1220, 1760, 2300].map((x, i) => terminal(`t${i + 3}`, 'rd', 'pessoal', x, 520)) : []),
      ],
    }
  }
  if (nome === 'livre') {
    return { ...base, perfis: { pessoal: { pastaLivre: dirname(pastas.app) } }, ultimoPerfilId: 'pessoal', repos: [demo], quadros: [] }
  }
  if (nome === 'fantasmas') {
    const copia = (n) => ({
      ...repo(n, 'app', pastas[n]),
      copia: { origemId: 'r1', branch: `lousa/${n}`, apelido: n },
    })
    return {
      ...base,
      repos: [repo('r1', 'app', pastas.app), ...['c-sumiu', 'c-vazia', 'c-viva', 'c-trabalho'].map(copia)],
      quadros: [terminal('q1', 'r1', 'principal', 40, 560)],
    }
  }
  if (nome === 'git') {
    // q2 (api) fica longe, fora da tela: o Ctrl+K precisa levar a vista ate ele
    return {
      ...base,
      // pasta-demo (R1.5): pasta sem git, sem quadro: a caixa da copia vem desligada
      repos: [repo('r1', 'app', pastas.app), repo('r2', 'api', pastas.api), demo],
      quadros: [
        terminal('q1', 'r1', 'principal', 40, 560),
        terminal('q2', 'r2', 'pessoal', 2400, 560),
        terminal('q3', 'r1', 'principal', 640, 560),
      ],
    }
  }
  if (nome === 'time') {
    // Fatia 28: agentes de verdade (claude.exe) que o cenario fecha na pergunta de confianca.
    // a1 e a2 na mesma pasta (Pessoal), a3 em outro repo e outra conta (Principal), t1 terminal
    const agente = (id, repoId, perfilId, x, y) => ({
      ...terminal(id, repoId, perfilId, x, 460),
      tipo: 'agente',
      titulo: `Claude ${id.slice(1)}`,
      caixa: { x, y, largura: 460, altura: 300 },
      kanban: true, // A22: os agentes do estado time seguem o kanban do projeto
    })
    return {
      ...base,
      viewport: { x: 0, y: 0, zoom: 0.6 },
      repos: [repo('r1', 'app', pastas.app), repo('r2', 'api', pastas.api)],
      quadros: [
        agente('a1', 'r1', 'pessoal', 40, 40),
        agente('a2', 'r1', 'pessoal', 640, 40),
        agente('a3', 'r2', 'principal', 40, 440),
        { ...terminal('t1', 'r2', 'principal', 640, 460), caixa: { x: 640, y: 440, largura: 460, altura: 300 } },
      ],
      // opcao ligados (A26, cenario prontos): a1 lidera um time com o a2
      ...(opcoes.includes('ligados') ? { ligacoes: [{ id: 'l1', de: 'a1', para: 'a2', modo: 'automatico' }] } : {}),
    }
  }
  if (nome === 'repasse') {
    // Fatia 30: o claude.exe de cada um e fechado na confianca; o cenario poe o Claude falso
    const agente = (id, x) => ({ ...terminal(id, 'r1', 'pessoal', x, 520), tipo: 'agente', titulo: `Claude ${id.slice(1)}` })
    return {
      ...base,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      repos: [repo('r1', 'app', pastas.app)],
      quadros: [agente('a1', 40), agente('a2', 700)],
      ligacoes: [{ id: 'l1', de: 'a1', para: 'a2', modo: 'automatico' }],
    }
  }
  if (nome === 'juntar-time') {
    // Fatia 31: o claude.exe de cada um e fechado na confianca; ninguem recebe mensagem
    const copia = (id, caminho) => ({ id, nome: id, caminho, perfilPadraoId: 'pessoal', copia: { origemId: 'r1', branch: `lousa/${id}`, apelido: id } })
    const agente = (id, repoId, x) => ({ ...terminal(id, repoId, 'pessoal', x, 440), tipo: 'agente', titulo: `Claude ${id.slice(1)}` })
    return {
      ...base,
      viewport: { x: 0, y: 0, zoom: 0.7 },
      repos: [repo('r1', 'app', pastas.app), copia('c1', pastas.c1), copia('c2', pastas.c2), copia('c3', pastas.c3)],
      quadros: [agente('a1', 'c1', 40), agente('a2', 'c2', 560), agente('a3', 'c3', 1080)],
      ligacoes: [
        { id: 'l1', de: 'a1', para: 'a2', modo: 'automatico' },
        { id: 'l2', de: 'a2', para: 'a3', modo: 'automatico' },
      ],
    }
  }
  if (nome === 'contrato') {
    // R4.21: o agente de verdade e um terminal comum na mesma conta, para conferir o claude.exe e o --help
    const a1 = { ...terminal('a1', 'rd', 'pessoal', 40, 900), tipo: 'agente', titulo: 'Claude 1' }
    return { ...base, repos: [demo], quadros: [a1, terminal('t1', 'rd', 'pessoal', 980, 620)] }
  }
  if (nome === 'agente') {
    const a1 = { ...terminal('a1', 'rd', 'pessoal', 40, 900), tipo: 'agente', titulo: 'Claude 1' }
    return { ...base, repos: [demo], quadros: [a1] }
  }
  if (nome !== 'demo') throw new Error(`estado desconhecido: ${nome} (use ${ESTADOS.join(' ou ')})`)
  return {
    ...base,
    repos: [demo],
    quadros: [terminal('t1', 'rd', 'principal', 40, 620), terminal('t2', 'rd', 'pessoal', 680, 520)],
  }
}
