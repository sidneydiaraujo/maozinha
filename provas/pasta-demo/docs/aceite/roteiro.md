# Roteiro de aceite da primeira versão (Claude e Claude, lousa livre)

Quem executa: Sidney. Marque cada item e anote o que falhou. O que falhar vira tarefa no `docs/ESTADO.md`.
Item 8 (Claude e ChatGPT) fica para depois: depende de T1.4b e T1.8.

- [ ] 1. Instalar `release/Lousa.ia Setup 0.0.1.exe` e abrir pelo Menu Iniciar. (Windows pode avisar "editor desconhecido": não há assinatura.)
- [ ] 2. A barra mostra as contas do PC com e-mail. Renomear "Principal" para "Empresa" (duplo clique no nome).
- [ ] 3. "Entrar"/"Trocar login": a janela não mostra terminal; anima "Abrindo o navegador" → "Autorize no navegador" → ✓ com o e-mail e fecha sozinha. Para outro e-mail: "Copiar link", janela anônima e, se pedir, colar o código.
- [ ] 4. "+ Novo quadro" (ou arrastar o cartão "Pessoal" para a lousa) → "Outra pasta…" → uma pasta em `C:\Users\sidne\pessoal\` → "Abrir agente": o cabeçalho mostra 📁 a pasta e o selo da conta.
- [ ] 5. Duplo clique no vazio → marcar "Empresa" → pasta da empresa → Enter.
- [ ] 6. Duas contas, pastas diferentes: `/status` mostra a conta certa em cada quadro; o cabeçalho mostra conta e pasta.
- [ ] 7. Duas contas, mesma pasta: "+ Novo quadro", outra conta, mesma pasta; o segundo vira "<pasta> 2"; `/status` confere.
- [ ] 8. (adiado) Claude e ChatGPT.
- [ ] 9. Num terminal da conta pessoal: `$env:GITHUB_TOKEN`, `$env:HOME` vazios e `$env:CLAUDE_CONFIG_DIR` = pasta pessoal. Na empresa: tudo vazio. (A Lousa já prova isso em teste automático; aqui é conferir com os olhos.)
- [ ] 10. Arrastar a lousa pelo vazio (ou com o botão do meio, até por cima dos quadros), arrastar quadros pelo cabeçalho, redimensionar, mexer no zoom, fechar e abrir: tudo no lugar, cada quadro na sua conta.
- [ ] 11. "Outra pasta…" com uma pasta que já está na lista: não duplica, só marca a existente.
- [ ] 12. Na janela "Novo quadro", "×" numa pasta → "Tirar": fecha os quadros daquela pasta, arquivos intactos.
- [ ] 13. Abrir a Lousa pela primeira vez depois da atualização: os quadros antigos aparecem no mesmo lugar, sem moldura.
- [ ] 14. Num agente com conversa: selo da conta → outra conta → "Trocar": o Claude reinicia na mesma pasta e continua a mesma conversa (pergunte algo que só a conversa sabe).
- [ ] 15. Fechar e abrir a Lousa: cada agente retoma a sua conversa.
- [ ] 16. Uma resposta do Claude com tabela e emoji (❌ 🟡 ✅): nenhuma palavra quebrada ou misturada.

- [ ] 99. Linha nova escrita pelo terminal.
