// Monta o ambiente de cada terminal do zero (T1.3). E o coracao do isolamento:
// so o que esta na lista permitida passa; a conta entra por UMA variavel.
// Proibido repassar process.env inteiro (docs/DECISOES.md, D6).
import type { Perfil } from '../../shared/model'
import { variaveisDoGit } from './git'

/** Nomes em MAIUSCULAS. Lista de docs/ARQUITETURA.md ("Ambiente de cada terminal"). */
export const VARIAVEIS_PERMITIDAS: readonly string[] = [
  'ALLUSERSPROFILE',
  'APPDATA',
  'COMMONPROGRAMFILES',
  'COMMONPROGRAMFILES(X86)',
  'COMMONPROGRAMW6432',
  'COMPUTERNAME',
  'COMSPEC',
  'HOMEDRIVE',
  'HOMEPATH',
  'LOCALAPPDATA',
  'NUMBER_OF_PROCESSORS',
  'OS',
  'PATH',
  'PATHEXT',
  'PROCESSOR_ARCHITECTURE',
  'PROCESSOR_IDENTIFIER',
  'PROCESSOR_LEVEL',
  'PROCESSOR_REVISION',
  'PROGRAMDATA',
  'PROGRAMFILES',
  'PROGRAMFILES(X86)',
  'PROGRAMW6432',
  'PSMODULEPATH',
  'PUBLIC',
  'SYSTEMDRIVE',
  'SYSTEMROOT',
  'TEMP',
  'TMP',
  'USERDOMAIN',
  'USERDOMAIN_ROAMINGPROFILE',
  'USERNAME',
  'USERPROFILE',
  'WINDIR',
]

const PERMITIDAS = new Set(VARIAVEIS_PERMITIDAS)

/** Variavel que aponta para a pasta da conta, por provedor. */
const VARIAVEL_DA_CONTA = { claude: 'CLAUDE_CONFIG_DIR', codex: 'CODEX_HOME' } as const

function chaveSemCaixa(env: Record<string, string>, nome: string): string | undefined {
  return Object.keys(env).find((k) => k.toUpperCase() === nome)
}

/** Poe <USERPROFILE>\.local\bin na frente do PATH (la fica o claude.exe), sem duplicar. */
function garantirLocalBin(env: Record<string, string>): void {
  const chaveHome = chaveSemCaixa(env, 'USERPROFILE')
  if (!chaveHome) return
  const localBin = `${env[chaveHome]}\\.local\\bin`
  const chavePath = chaveSemCaixa(env, 'PATH') ?? 'PATH'
  const atual = env[chavePath] ?? ''
  const jaTem = atual.split(';').some((p) => p.toLowerCase() === localBin.toLowerCase())
  if (jaTem) return
  env[chavePath] = atual ? `${localBin};${atual}` : localBin
}

/** So a lista permitida, sem conta nenhuma: para o git que o main roda (T10.2). */
export function ambienteBase(base: Record<string, string | undefined>): Record<string, string> {
  const env: Record<string, string> = {}
  for (const [nome, valor] of Object.entries(base)) {
    if (valor !== undefined && PERMITIDAS.has(nome.toUpperCase())) env[nome] = valor
  }
  return env
}

/** `dados` = pasta de dados da Lousa, onde fica o login do gh de quem tem GitHub proprio (D42). */
export function montarAmbiente(
  perfil: Pick<Perfil, 'id' | 'provedor' | 'configDir' | 'ehPadrao' | 'git'>,
  base: Record<string, string | undefined>,
  dados: string | null = null,
): Record<string, string> {
  const env = ambienteBase(base)
  // Conta padrao roda SEM variavel, igual ao terminal normal (D6).
  if (!perfil.ehPadrao) env[VARIAVEL_DA_CONTA[perfil.provedor]] = perfil.configDir
  Object.assign(env, variaveisDoGit(perfil.id, perfil.git, dados))
  env.TERM = 'xterm-256color'
  env.COLORTERM = 'truecolor'
  env.LOUSA_PERFIL = perfil.id
  garantirLocalBin(env)
  return env
}
