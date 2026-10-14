# Lousa.ia

Lousa infinita para Windows onde cada quadro é um terminal de IA. Cada
repositório pertence a uma conta do Claude Code (por exemplo, Pessoal e
Empresa) e todo terminal dele já abre nessa conta. As contas ficam lado a
lado, sem configuração e sem vazamento de uma para a outra.

Status: primeira versão pronta para aceite (só contas Claude; Codex/ChatGPT vem depois). Veja [docs/ESTADO.md](docs/ESTADO.md).

## Rodar em desenvolvimento

```powershell
npm install
npm run dev      # abre o app
npm run check    # tipos + lint + testes
npm run smoke    # prova de ponta a ponta sem abrir janela
```

Requisitos: Windows 10/11, Node 22 ou mais novo, Claude Code instalado
(`%USERPROFILE%\.local\bin\claude.exe`). Não precisa de compilador C++.

## Documentos

- [CLAUDE.md](CLAUDE.md): regras para quem constrói (pessoa ou IA)
- [docs/FUNCIONALIDADES.md](docs/FUNCIONALIDADES.md): o produto completo
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md): como as partes se encaixam
- [docs/plano/](docs/plano/): tarefas da primeira versão
- [docs/DECISOES.md](docs/DECISOES.md): por que cada escolha

Regras de lint em `eslint-rules/`: cópia do
[vibe-coding-toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit)
(MIT), licença em `eslint-rules/LICENSE-vibe-coding-toolkit`.

## Instalar e usar

1. `npm run dist` gera `release/Lousa.ia Setup 0.0.1.exe` (sem assinatura digital;
   confira o hash em `release/SHA256.txt`). Instalar não pede administrador.
2. Abra pelo Menu Iniciar. A barra da esquerda mostra as contas do Claude do PC.
   "Entrar" / "Trocar login" abre o login de cada conta.
3. "+ Adicionar repositório" escolhe uma pasta; a Lousa sugere a conta pelo caminho.
4. Na moldura do repo, "+ Agente" abre o Claude Code na conta padrão e o "▾"
   abre em outra conta, até no mesmo repo. "+ Terminal" abre um PowerShell.
5. Posição, tamanho e zoom ficam salvos. O menu "⋯" da moldura muda a conta
   padrão (só quadros novos) ou remove o repo da lousa (nunca apaga arquivos).
