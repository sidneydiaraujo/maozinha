// Liga o ServicoTerminais ao node-pty de verdade (T2.2). O ambiente chega pronto
// de montarAmbiente(): aqui nunca se passa process.env.
import { spawn } from 'node-pty'
import type { Spawner } from './servico'

export const spawnReal: Spawner = (arquivo, args, { cwd, env, cols, rows }) =>
  spawn(arquivo, args, { name: 'xterm-256color', cols, rows, cwd, env })
