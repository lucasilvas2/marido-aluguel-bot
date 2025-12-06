# Marido Aluguel App

> Backend do projeto "Marido Aluguel" — API construída com NestJS e TypeScript.

Este repositório contém a aplicação backend usada no projeto. O README abaixo traz instruções básicas para rodar, testar e entender rapidamente a estrutura do projeto.

**Visão rápida**
- **Linguagem:** TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Banco de dados:** MySQL (configuração via Prisma)
- **Integração WhatsApp:** `whatsapp-web.js` + `puppeteer`

## Pré-requisitos
- Node.js (recomendado: v18+)
- pnpm (gerenciador de pacotes)
- Docker e Docker Compose (para o banco de dados MySQL)

## Instalação

### 1. Clone o repositório

```powershell
git clone <repo-url>
cd marido-aluguel-app
```

### 2. Instale as dependências

```powershell
pnpm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```powershell
cp .env.example .env
```

Edite o arquivo `.env` e configure as seguintes variáveis:

```env
# Porta da aplicação
PORT=3000

# Configurações do Prisma
DATABASE_URL="mysql://root:root@localhost:3306/marido_aluguel"

# Configurações do WhatsApp (opcional)
WHATSAPP_SESSION_PATH="./whatsapp-session"
```

**Nota importante:** As credenciais do banco devem corresponder às configuradas no `docker-compose.yml` (usuário: `root`, senha: `root`).

### 4. Inicie o banco de dados MySQL com Docker

```powershell
docker-compose up -d
```

Este comando irá:
- Baixar a imagem do MySQL 8.0
- Criar o container `marido_aluguel_mysql`
- Criar automaticamente o banco de dados `marido_aluguel`
- Expor o MySQL na porta 3306

Aguarde cerca de 15-20 segundos para o MySQL inicializar completamente.

### 5. Gere o cliente do Prisma

```powershell
pnpm prisma generate
```

### 6. Execute as migrations do banco de dados

```powershell
pnpm prisma migrate deploy
```

Este comando irá criar as tabelas `User` e `Address` no banco de dados.

### 7. Inicie a aplicação

```powershell
pnpm run start:dev
```

A aplicação estará disponível em:
- **API:** http://localhost:3000
- **WhatsApp QR Code:** http://localhost:3000/whatsapp/qrcode
- **WhatsApp Status:** http://localhost:3000/whatsapp/status

## Comandos comuns

### Desenvolvimento
- **Instalar dependências:** `pnpm install`
- **Rodar em modo desenvolvimento (hot-reload):** `pnpm run start:dev`
- **Build para produção:** `pnpm run build`
- **Rodar em produção (após build):** `pnpm run start:prod`

### Banco de Dados
- **Gerar cliente Prisma:** `pnpm prisma generate`
- **Aplicar migrations:** `pnpm prisma migrate deploy`
- **Criar nova migration:** `pnpm prisma migrate dev --name <nome_da_migration>`
- **Resetar banco (desenvolvimento):** `pnpm prisma migrate reset`
- **Abrir Prisma Studio:** `pnpm prisma studio`

### Docker
- **Iniciar banco de dados:** `docker-compose up -d`
- **Parar banco de dados:** `docker-compose down`
- **Reiniciar do zero (apaga dados):** `docker-compose down -v && docker-compose up -d`
- **Ver logs do MySQL:** `docker logs marido_aluguel_mysql`

### Testes e Qualidade de Código
- **Rodar testes unitários:** `pnpm run test`
- **Rodar testes end-to-end:** `pnpm run test:e2e`
- **Rodar testes com coverage:** `pnpm run test:cov`
- **Rodar linter e corrigir:** `pnpm run lint`
- **Formatar código:** `pnpm run format`

**Observação:** os scripts estão definidos em `package.json`.

## Estrutura principal do projeto
- `src/` — código-fonte da aplicação
  - `application/` — serviços e regras de negócio
  - `domain/` — entidades, serviços e repositórios do domínio
  - `infraestructure/` — adaptadores, banco (Prisma), integrações externas
  - `presentation/` — controladores e rotas
- `test/` — testes automatizados (unitários e e2e)

## Variáveis de ambiente

O projeto utiliza as seguintes variáveis de ambiente que devem ser configuradas no arquivo `.env`:

| Variável | Descrição | Valor padrão |
|----------|-----------|--------------|
| `PORT` | Porta da aplicação NestJS | `3000` |
| `DATABASE_URL` | URL de conexão com MySQL | `mysql://root:root@localhost:3306/marido_aluguel` |
| `WHATSAPP_SESSION_PATH` | Diretório para sessão do WhatsApp | `./whatsapp-session` |

**Importante:** 
- Nunca commite o arquivo `.env` no repositório
- Use o `.env.example` como referência
- As credenciais do `DATABASE_URL` devem corresponder às configuradas no `docker-compose.yml`

## Observações sobre WhatsApp

Este projeto usa `whatsapp-web.js` e `puppeteer` para automação/integração com WhatsApp Web. 

### Primeira conexão
1. Acesse http://localhost:3000/whatsapp/qrcode após iniciar a aplicação
2. Escaneie o QR Code com seu WhatsApp (WhatsApp > Configurações > Aparelhos conectados)
3. Aguarde a mensagem de confirmação no console

### Sessão do WhatsApp
- A pasta `whatsapp-session/` armazena dados da sessão do browser
- **Não commite esta pasta** - contém dados sensíveis
- Para reconectar, delete a pasta e escaneie o QR Code novamente
- A sessão persiste entre reinicializações da aplicação

### Endpoints disponíveis
- **GET /whatsapp/status** - Status da conexão
- **GET /whatsapp/qrcode** - Obtém QR Code (JSON)
- **GET /whatsapp/qrcode/image** - QR Code como imagem
- **POST /whatsapp/disconnect** - Desconecta o WhatsApp
- **POST /whatsapp/restart** - Reinicia a conexão

## Testes
- Testes unitários: `pnpm run test`
- Testes e2e: `pnpm run test:e2e`

## Troubleshooting

### Erro: "PrismaClient is not exported from @prisma/client"
**Solução:** Execute `pnpm prisma generate` para gerar o cliente Prisma.

### Erro: "Environment variable not found: DATABASE_URL"
**Solução:** 
1. Certifique-se de que o arquivo `.env` existe na raiz do projeto
2. Verifique se a variável `DATABASE_URL` está configurada corretamente
3. Reinicie a aplicação após criar/modificar o `.env`

### Erro: "Can't reach database server"
**Solução:**
1. Verifique se o Docker está rodando: `docker ps`
2. Inicie o MySQL: `docker-compose up -d`
3. Aguarde 15-20 segundos para o MySQL inicializar
4. Verifique os logs: `docker logs marido_aluguel_mysql`

### Erro: "Authentication failed" ou "unknown variable 'default-authentication-plugin'"
**Solução:** O `docker-compose.yml` já está configurado com MySQL 8.0 e o plugin correto. Se o erro persistir:
```powershell
docker-compose down -v
docker-compose up -d
```

### Container MySQL reiniciando constantemente
**Solução:** Verifique os logs para identificar o problema:
```powershell
docker logs marido_aluguel_mysql --tail 50
```

### Erro de tipos: "Type 'string' is not assignable to type 'number'"
**Solução:** Este erro já foi corrigido. Se aparecer novamente:
1. Certifique-se de que o Prisma Client foi gerado: `pnpm prisma generate`
2. Verifique se os IDs no código são do tipo `number` (conforme o schema Prisma)

## Tecnologias utilizadas
- **Runtime:** Node.js v18+
- **Linguagem:** TypeScript
- **Framework:** NestJS
- **ORM:** Prisma
- **Banco de dados:** MySQL 8.0 (via Docker)
- **Containerização:** Docker e Docker Compose
- **WhatsApp:** whatsapp-web.js + puppeteer
- **Testes:** Jest
- **Qualidade de código:** ESLint + Prettier
- **Gerenciador de pacotes:** pnpm

## Estrutura do banco de dados

O projeto utiliza as seguintes tabelas:

### User
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | ID autoincremento |
| name | String | Nome do usuário |
| email | String (unique) | Email do usuário |
| phone | String (unique) | Telefone do usuário |
| userType | String | Tipo: CLIENT ou PROFESSIONAL |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |

### Address
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | Int (PK) | ID autoincremento |
| street | String | Rua |
| city | String | Cidade |
| zipCode | String | CEP |
| country | String | País |
| number | String? | Número (opcional) |
| state | String | Estado |
| neighborhood | String | Bairro |
| userId | Int (FK) | Referência ao usuário |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data de atualização |
