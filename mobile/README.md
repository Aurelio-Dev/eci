# EC Itapetininga em React e React Native

Este projeto Expo SDK 57 atende navegador de PC, navegador móvel, Android e iOS. A versão web é renderizada por componentes React DOM com a estrutura e o CSS do site original, para preservar o desenho das páginas. Android e iOS usam componentes React Native com uma apresentação adaptada a telas pequenas. Navegação, dados de conteúdo e regras de negócio ficam dentro deste projeto.

```powershell
cd mobile
npm ci
npm run web
```

Abra o endereço mostrado pelo Expo para ver o site no PC. Para gerar arquivos web estáticos, rode `npm run build:web` e sirva `dist/` em um servidor HTTP. Para o aplicativo móvel, rode `npm run android` ou `npm run ios` com um dispositivo ou emulador configurado. Os comandos de exportação (`npx expo export --platform android` e `--platform ios`) verificam a geração dos bundles, mas não instalam um aplicativo.

As páginas e estilos históricos usados como referência estão em `reference/`; a autenticação demonstrativa foi removida. O script `scripts/build_web_reference.py` converte a estrutura HTML para `src/data/webPages.json` e extrai os estilos de cada página para `public/page-css/`. As imagens e os documentos da web estão em `public/`; as imagens do aplicativo nativo estão em `assets/`. O projeto em `mobile/` não depende dos arquivos da raiz para executar ou compilar. Para regenerar os dados após editar uma referência, instale `beautifulsoup4` no Python e execute `python scripts/build_web_reference.py` dentro de `mobile/`.

O link **Área administrativa** aparece no cabeçalho e no menu móvel. O painel tem três módulos: **Almoxarifado**, com materiais e movimentações de entrada/saída em Kardex; **Diário de classe**, com criação de aulas descritas e frequência individual; e **Cadastros**, com alunos e colaboradores. A autenticação e os registros usam a API e o MySQL descritos em [backend/README.md](../backend/README.md). O administrador inicial é criado durante a configuração. Arquivar um aluno preserva as frequências de aulas já criadas.

O formulário de contato usa o endpoint FormSubmit do site original. O widget oficial VLibras é carregado na web. Em Android e iOS, a opção de acessibilidade abre o serviço VLibras externamente, pois o widget original é para páginas web. A loja e os relatórios financeiros mantêm o conteúdo provisório da referência.

Para verificar a aplicação, rode `npm run lint`, `npm run typecheck` e `npm test`. A [verificação anterior](VERIFICACAO.md) documenta os testes da migração visual. Para o teste web completo, use uma API ligada a um banco vazio e descartável, execute `python scripts/serve_reference.py` em `mobile/` para servir a referência em `localhost:5501` e sirva `mobile/dist` em `localhost:5502`, e execute `node tests/web.e2e.mjs` com `ECI_TEST_DB_IS_DISPOSABLE=yes`, `ECI_TEST_USER` e `ECI_TEST_PASSWORD` configurados. O teste cadastra e altera dados; não o execute no banco do clube.

## Usuários e perfis

Administradores têm acesso ao módulo **Usuários** no painel web e no aplicativo nativo. Nele podem criar operadores ou administradores, ativar ou desativar contas e redefinir senhas. Operadores continuam acessando os três módulos operacionais. Para preparar ou atualizar o banco e consultar os detalhes das sessões, veja [a documentação da API](../backend/README.md).
