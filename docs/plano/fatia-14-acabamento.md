# Fatia 14 — Acabamento do instalador

Entrega: ícone próprio da Lousa (no `.exe`, no instalador, no Menu Iniciar e na
barra de tarefas) e versão **0.1.0**, para saber pelo número qual instalador está
em uso.

Origem: "faça as 4" (19/10/2026). Decisão: D22.

## T14.1 Ícone e versão

**Arquivos:** `scripts/gerar-icone.mjs` (gera `build/icon.png` 512 e
`build/icon.ico` 256/64/48/32/16, sem dependência), `build/`,
`electron-builder.yml` (`win.icon`, `nsis.installerIcon`, `uninstallerIcon`,
`signAndEditExecutable: true`), `package.json` (0.1.0), `README.md`.

**Regras:** desenho = lousa escura com três quadros nas cores das contas (azul,
verde, âmbar). Para mudar: editar `FORMAS` no script e rodar
`node scripts/gerar-icone.mjs`. Sem certificado, nada é assinado (conferido:
`NotSigned` no `.exe` e no instalador); o hash continua em `release/SHA256.txt`.

**Pronto quando:** `npm run dist` gera `Lousa.ia Setup 0.1.0.exe`; o ícone extraído
do `.exe` e do instalador é o novo; versão do arquivo 0.1.0; `Lousa.ia.exe --smoke`
do `win-unpacked` termina com código 0.

## Aceite

Item 41 do `docs/aceite/roteiro.md`.
