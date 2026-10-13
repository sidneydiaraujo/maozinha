import { spawn } from 'node-pty'

/**
 * Prova que o node-pty funciona neste PC: abre um PowerShell num
 * pseudo-terminal e espera o texto LOUSA_PTY_OK. O texto e montado pelo
 * proprio PowerShell para nao ser confundido com o titulo da janela.
 * Devolve true se apareceu dentro do prazo.
 */
export function provarPty(prazoMs = 20_000): Promise<boolean> {
  return new Promise((resolver) => {
    const pty = spawn(
      'powershell.exe',
      ['-NoLogo', '-NoProfile', '-Command', "Write-Output ('LOUSA_' + 'PTY_OK')"],
      { name: 'xterm-256color', cols: 80, rows: 24, cwd: process.cwd(), env: process.env },
    )
    let saida = ''
    let saiu = false
    let terminou = false

    const terminar = (ok: boolean): void => {
      if (terminou) return
      terminou = true
      clearTimeout(relogio)
      // kill() num processo que ja saiu dispara um erro barulhento do node-pty
      // no Windows (AttachConsole failed). So mata se ainda estiver rodando.
      if (!saiu) pty.kill()
      resolver(ok)
    }

    const relogio = setTimeout(() => terminar(false), prazoMs)
    pty.onData((dados) => {
      saida += dados
    })
    // No Windows (ConPTY) parte da saida pode chegar depois do evento de saida.
    pty.onExit(() => {
      saiu = true
      setTimeout(() => terminar(saida.includes('LOUSA_PTY_OK')), 500)
    })
  })
}
