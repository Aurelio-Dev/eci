# API e MySQL do ECI

Esta API é necessária para acessar o painel administrativo. Os dados são armazenados no MySQL; o site e o aplicativo não acessam o banco diretamente. Ela foi testada com MySQL 8. A implementação inicial guarda cada registro como um documento JSON em `eci_records`, com tabelas separadas para usuários, sessões e revisão. Ela ainda não é uma modelagem relacional completa.

## Preparar no computador

1. Inicie o MySQL. No Workbench, conecte-se à instância local usando uma conta com permissão para criar banco e usuário. Crie um banco e uma conta exclusiva para a aplicação; substitua a senha por uma senha própria:

   ```sql
   CREATE DATABASE IF NOT EXISTS eci CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'eci_app'@'localhost' IDENTIFIED BY 'COLOQUE_UMA_SENHA_FORTE_AQUI';
   GRANT ALL PRIVILEGES ON eci.* TO 'eci_app'@'localhost';
   ```

   Se a conta já existir, não execute novamente o `CREATE USER`; confira a conta e suas permissões no Workbench. Não compartilhe a senha.

2. No PowerShell, dentro da pasta `backend`, rode `npm ci` e copie o arquivo `.env.example` para `.env`. Ajuste `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` e `DB_NAME` conforme o banco criado. O arquivo `.env` é local e não deve ser enviado ao GitHub.
3. Execute `npm run setup`. O comando cria as tabelas se necessário e solicita usuário e senha para o primeiro administrador. A senha será visível durante a digitação no terminal; execute em ambiente privado. Se já houver administrador, ele é preservado. A senha do administrador é diferente da senha de conexão com o MySQL.
4. Execute `npm start` e mantenha o terminal aberto. Em outro terminal, entre em `mobile`, rode `npm ci` e `npm run web`. A API padrão é `http://localhost:3333`.

Os endereços do site permitidos pela API ficam em `ALLOWED_ORIGINS`, separados por vírgulas. Use exatamente o endereço apresentado pelo Expo, incluindo protocolo, domínio e porta. Não misture `localhost` e `127.0.0.1`: os cookies são vinculados ao domínio usado. Se alterar a configuração, reinicie a API.

## Registros anteriores

Após entrar no painel com um banco vazio, o botão **Importar registros locais** aparece quando houver registros da versão anterior naquele navegador ou dispositivo. A importação depende de confirmação, não apaga a cópia local e não substitui registros existentes. Use o mesmo navegador ou dispositivo em que os dados foram cadastrados. Caso o banco já contenha dados, faça uma migração assistida; não use esse botão para mesclar bases.

## Dispositivos móveis e implantação

No aplicativo nativo, `localhost` representa o próprio aparelho. Para desenvolvimento, configure em `mobile/.env.local` a variável pública `EXPO_PUBLIC_API_URL` com o endereço acessível da API e reinicie o Expo. Para outro dispositivo na rede, a API precisa escutar em um endereço apropriado (`HOST`) e a rede/firewall precisam permitir a conexão. Essa variável é pública: nunca coloque senhas nela.

Para uso pela internet, é necessário publicar a API e o MySQL em infraestrutura adequada, usar HTTPS, configurar `COOKIE_SECURE=true`, restringir origens, proteger a rede do banco, realizar backups e revisar autenticação, permissões e privacidade. Os cookies web usam `SameSite=Strict`: hospede a API e o site sob o mesmo site ou configure um proxy no domínio do site. Não exponha a porta do MySQL diretamente. O código atual é uma base de desenvolvimento e ainda requer revisão de segurança e testes em aparelhos antes de uso com dados pessoais reais.

## Migração de uma instalação existente

Antes de atualizar a API, pare as gravações, faça uma cópia de segurança completa do banco e confirme que ela pode ser restaurada. Na pasta `backend`, confira se o `.env` aponta para o banco correto e execute `npm run migrate`. O comando acrescenta `role` e `active` a `eci_users` sem apagar nem substituir tabelas. Todos os usuários anteriores recebem perfil administrador ativo, pois antes desta versão todos tinham esse acesso. Novos usuários recebem o perfil escolhido no cadastro; o padrão do banco para inserções sem perfil é operador. Senhas, sessões, revisão e dados dos módulos são preservados. Reinicie a API após migrar. `npm run setup` também executa a migração em instalações existentes e cria o primeiro administrador apenas quando não há usuários.

A migração é retomável: se for interrompida, execute-a novamente. O MySQL confirma alterações de estrutura separadamente, portanto não há reversão transacional completa; conserve o backup. A conta da aplicação precisa de permissão `ALTER` para a migração.

## Gestão de usuários

Entre como administrador e abra **Usuários**. Cadastre um nome de acesso, uma senha inicial de 12 a 512 caracteres e o perfil **Administrador** ou **Operador**. O operador usa Almoxarifado, Diário de classe e Cadastros; somente o administrador pode gerenciar usuários. A lista mostra perfil e estado, nunca a senha ou seu hash. Nela é possível ativar, desativar e redefinir a senha. A desativação e a redefinição encerram as sessões existentes; ao reativar, o usuário deve entrar novamente. O último administrador ativo não pode ser desativado. A redefinição da própria senha também encerra a sessão atual. Compartilhe senhas iniciais por um canal seguro.

As permissões e o estado são conferidos pela API em cada solicitação. Uma tela já aberta é redirecionada ao login na próxima solicitação que receba 401; dados já apresentados ou copiados antes da revogação não podem ser retirados remotamente. Senhas são armazenadas com scrypt e sal aleatório; tokens são armazenados como hash.

## Testes

`npm test` executa os testes de regras e pula os testes de integração se não configurados. Para testar gestão e migração com MySQL, defina `ECI_RUN_DB_TESTS=1` e execute `node --test test/users.integration.test.js`. A conta MySQL precisa criar e remover uma base temporária com nome aleatório `eci_test_*`; o teste não usa nem altera `DB_NAME`. O teste de integração antigo aceita `ECI_TEST_API`, `ECI_TEST_USER` e `ECI_TEST_PASSWORD` e altera o banco indicado: use apenas uma API com banco exclusivo e vazio para testes.

Para incluir o teste web integrado dos três módulos, gere `mobile/dist`, sirva-o em `http://localhost:5502` e acrescente `ECI_RUN_WEB_TESTS=1` ao mesmo comando. O navegador automatizado usa a API e a base temporária criadas pelo teste; pode ser necessário definir `CHROME_PATH`. O teste específico da interface de usuários em `mobile/tests/users.web.e2e.mjs` usa uma API simulada.
