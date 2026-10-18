// Nome digitado -> sufixo da pasta da conta nova (T1.8): "Trabalho Dev" -> "trabalho-dev".

const TAMANHO_MAXIMO = 30

/** Minusculas, sem acento, so [a-z0-9-], sem '-' nas pontas, ate 30 caracteres. Vazio = nome invalido. */
export function slugConta(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/, '')
}
