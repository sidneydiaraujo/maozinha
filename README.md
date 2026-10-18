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
3. Para abrir um quadro: "+ Novo quadro", duplo clique no vazio ou arraste o
   cartão de uma conta para a lousa. Escolha a conta (quem paga) e a pasta (onde
   o trabalho fica) e clique em "Abrir agente" (Claude Code) ou "Abrir terminal".
4. O cabeçalho do quadro mostra 📁 a pasta e o selo da conta. Clique no selo para
   trocar quem paga: o Claude reinicia na mesma pasta e continua a mesma conversa.
5. Posição, tamanho, zoom e a conversa de cada agente ficam salvos. Na janela
   "Novo quadro", o "×" tira uma pasta e fecha os quadros dela (nunca apaga
   arquivos). Botão do meio do mouse arrasta a lousa até por cima dos quadros.
