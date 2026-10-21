// Estados de teste (o estado.json de uma pasta de dados separada). Nunca o estado real.
// demo: dois terminais comuns na pasta de exemplo (contas Principal e Pessoal, sem login).
// casa: a pasta do usuario salva (aberta na arvore, so leitura) + dois terminais, como no D17.
// git: dois repositorios git novos (app e api) e tres terminais, para copia separada,
// juntar, Ctrl+K e mensagem para varios quadros (Fatias 10 a 13).
// time: tres agentes de verdade (Fatia 28) nos repositorios do git, mais um terminal comum.
// agente: UM AGENTE DE VERDADE (claude.exe, conta Pessoal) na copia da pasta de exemplo, para a
// linha de status (Fatia 17). Pede o ok do Sidney; o cenario nao manda mensagem nenhuma.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

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

export const ESTADOS = ['demo', 'casa', 'git', 'agente', 'time']

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

/**
 * Pastas que o estado `git` precisa, criadas dentro da saida da rodada. O `app` tem um arquivo
 * em subpasta (Ctrl+K acha) e o mesmo nome dentro de node_modules (Ctrl+K nao pode achar).
 */
export function prepararPastas(nome, saida) {
  if (nome !== 'git' && nome !== 'time') return {}
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
  return { app, api }
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
  if (nome === 'git') {
    // q2 (api) fica longe, fora da tela: o Ctrl+K precisa levar a vista ate ele
    return {
      ...base,
      repos: [repo('r1', 'app', pastas.app), repo('r2', 'api', pastas.api)],
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
    }
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
