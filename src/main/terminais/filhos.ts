// O Claude ainda roda dentro do terminal? (T29.1) O Claude nao avisa pelo OSC 7501 quando sai, e o
// ultimo estado ("parado") fica guardado: antes de digitar algo para o agente, o main confere se o
// PowerShell do quadro tem um claude.exe filho. Prova de 21/10/2026: depois do "No, exit" a Lousa
// digitava a apresentacao no PowerShell (que recusava a linha, mas nao era para chegar la).
import { execFile } from 'node:child_process'

export type RodarComando = (arquivo: string, args: string[]) => Promise<string>

/** Comando fixo; o pid e numero conferido, nunca texto de fora. */
export function argumentosDaBusca(pid: number): string[] {
  if (!Number.isInteger(pid) || pid <= 0) throw new Error('pid inválido')
  return [
    '-NoLogo',
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    `@(Get-CimInstance Win32_Process -Filter 'ParentProcessId=${pid}' | Where-Object { $_.Name -eq 'claude.exe' }).Count`,
  ]
}

export async function temClaudeDentro(pid: number, rodar: RodarComando): Promise<boolean> {
  try {
    return Number.parseInt((await rodar('powershell.exe', argumentosDaBusca(pid))).trim(), 10) > 0
  } catch {
    return false // na duvida, nao digita
  }
}

export const rodarReal: RodarComando = (arquivo, args) =>
  new Promise((resolve, reject) => {
    execFile(arquivo, args, { windowsHide: true, timeout: 10000 }, (erro, saida) => (erro ? reject(erro) : resolve(saida)))
  })
