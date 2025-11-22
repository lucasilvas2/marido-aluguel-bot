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
- MySQL (ou outro banco configurado no `schema.prisma`)

## Instalação
1. Clone o repositório

```powershell
git clone <repo-url>
cd marido-aluguel-app
```

2. Instale dependências

```powershell
pnpm install
```

3. Gere o cliente do Prisma (após configurar `DATABASE_URL`)

```powershell
pnpm exec prisma generate
```

Se houver migrações a aplicar (conforme seu fluxo), utilize os comandos do Prisma apropriados para o seu ambiente.

## Comandos comuns
- Instalar dependências: `pnpm install`
- Rodar em modo desenvolvimento (hot-reload): `pnpm run start:dev`
- Build para produção: `pnpm run build`
- Rodar em produção (após build): `pnpm run start:prod`
- Rodar testes unitários: `pnpm run test`
- Rodar testes end-to-end: `pnpm run test:e2e`
- Rodar linter e corrigir: `pnpm run lint`
- Formatar código: `pnpm run format`

Observação: os scripts estão definidos em `package.json`.

## Estrutura principal do projeto
- `src/` — código-fonte da aplicação
  - `application/` — serviços e regras de negócio
  - `domain/` — entidades, serviços e repositórios do domínio
  - `infraestructure/` — adaptadores, banco (Prisma), integrações externas
  - `presentation/` — controladores e rotas
- `test/` — testes automatizados (unitários e e2e)

## Variáveis de ambiente
Configure variáveis sensíveis (por exemplo `DATABASE_URL`) antes de rodar a aplicação. Recomenda-se usar um `.env` fora do controle de versão ou um gerenciador de segredos.

## Observações sobre WhatsApp
Este projeto usa `whatsapp-web.js` e `puppeteer` para automação/integração com WhatsApp Web. Há uma pasta `whatsapp-session/` que pode conter perfis de sessão do browser — trate esses arquivos com cuidado (são dados sensíveis da sessão).

## Testes
- Testes unitários: `pnpm run test`
- Testes e2e: `pnpm run test:e2e`

## Tecnologias utilizadas
- Node.js
- TypeScript
- NestJS
- Prisma
- MySQL
- whatsapp-web.js
- puppeteer
- Jest (testes)
- ESLint / Prettier (qualidade de código)
- pnpm (gerenciador de pacotes)
