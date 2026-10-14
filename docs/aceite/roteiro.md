# Roteiro de aceite da primeira versão (Claude e Claude)

Quem executa: Sidney. Marque cada item e anote o que falhou. O que falhar vira tarefa no `docs/ESTADO.md`.
Item 8 (Claude e ChatGPT) fica para depois: depende de T1.4b e T1.8.

- [ ] 1. Instalar `release/Lousa.ia Setup 0.0.1.exe` e abrir pelo Menu Iniciar. (Windows pode avisar "editor desconhecido": não há assinatura.)
- [ ] 2. A barra mostra as contas do PC com e-mail. Renomear "Principal" para "Empresa" (duplo clique no nome).
- [ ] 3. Conta sem login: "Entrar" abre o login e, ao terminar, o e-mail aparece. (Não provado ainda: login real pelo navegador.)
- [ ] 4. Adicionar um repo em `C:\Users\sidne\pessoal\`: "Pessoal" já vem marcada; Enter confirma.
- [ ] 5. Adicionar um repo da empresa: escolher "Empresa" (1 clique).
- [ ] 6. Duas contas, repos diferentes: "+ Agente" em cada moldura; `/status` mostra a conta certa em cada uma.
- [ ] 7. Duas contas, mesmo repo: "+ Agente ▾" na outra conta abre um segundo Claude na mesma moldura; `/status` confere.
- [ ] 8. (adiado) Claude e ChatGPT.
- [ ] 9. Num terminal da conta pessoal: `$env:GITHUB_TOKEN`, `$env:HOME` vazios e `$env:CLAUDE_CONFIG_DIR` = pasta pessoal. Na empresa: tudo vazio. (A Lousa já prova isso em teste automático; aqui é conferir com os olhos.)
- [ ] 10. Arrastar e redimensionar quadros, mexer no zoom, fechar e abrir: tudo no lugar, cada quadro na sua conta. (Não provado ainda: o arrastar com o mouse.)
- [ ] 11. Adicionar o mesmo repo de novo: a Lousa recusa e orienta a usar "+ Agente" nele.
- [ ] Extra (T3.6): "⋯" → trocar a conta padrão e criar quadro novo; "⋯" → remover repositório (confirma, fecha os terminais, arquivos intactos).
