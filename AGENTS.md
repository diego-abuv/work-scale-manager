# AGENTS.md

Guia para agentes de IA e colaboradores que trabalham neste repositório.
Mantenha este arquivo enxuto e atualizado. O escopo detalhado fica em `docs/SCOPE.md`.

## Visão geral

API NestJS (ESM) para gestão de escalas/jornada de trabalho, multi-tenant
(schema por tenant), voltada para empresas/RH. Contexto legal: PEC 221/19
(fim da escala 6x1, jornada 44h -> 40h).

## Stack

- Node.js v24, TypeScript, ESM (`"type": "module"`)
- NestJS 12 · Prisma 7 · PostgreSQL
- JWT + RBAC · class-validator · Swagger · Vitest

## Comandos

```bash
npm run start:dev     # dev com watch
npm run build         # build de produção
npm run start:prod    # roda dist/ (node dist/main)
npm run lint          # oxlint --type-aware
npm run format        # prettier
npm run test          # testes unitários (vitest)
npm run test:watch
npm run test:cov
npm run test:e2e
```

Banco local:

```bash
docker compose up -d              # sobe o Postgres
docker compose down               # para
docker compose down -v            # para e apaga os dados
npm run prisma:migrate:global     # migrações do schema global (public)
npm run prisma:migrate:tenant     # gera migrações do schema tenant
npm run prisma:generate           # gera os dois clients Prisma
```

## Arquitetura

Clean Architecture. Cada módulo em `src/modules/<modulo>/` tem:

- `domain/` — entidades, value objects, interfaces de repositório (sem framework)
- `application/` — use cases (regra de negócio)
- `infrastructure/` — repositórios Prisma e adaptadores
- `presentation/` — controllers e DTOs

Direção das dependências: `presentation -> application -> domain` e
`infrastructure -> domain`. O `domain` não depende de nada externo.

## Multi-tenant

- Dois schemas Prisma: `prisma/global` (`public`, só `Company`) e
  `prisma/tenant` (`tenant_<uuid>`: User, Employee, Department, WorkSchedule,
  Shift, ShiftSwap). Configs: `prisma7.config.ts` e `prisma7.tenant.config.ts`.
- Dados da empresa no schema `tenant_<uuid>` (UUID do `companies.id`).
- Nunca use `slug` como nome de schema.
- Nome de schema sempre derivado de UUID validado (evita SQL injection).
- `TenantInterceptor` popula o `TenantContext` (AsyncLocalStorage) a partir do JWT.
- `TenantPrismaService` devolve um client por tenant (`PrismaPg(..., { schema })`)
  com cache LRU; ao evictar, chama `$disconnect()`.
- Provisionamento aplica os `prisma/tenant/migrations/**/migration.sql` via conexão
  `pg` crua (múltiplos statements), com `search_path` no novo schema.
- `User` vive dentro do tenant: um usuário pertence a uma única empresa.

## Prisma 7

- O client exige **driver adapter**: `new PrismaClient({ adapter: new PrismaPg(...) })`.
- Clients gerados em `src/generated/prisma-global` e `src/generated/prisma-tenant`.
- Imports dos clients usam extensão `.js` (ESM).
- `src/generated/**` não é lintado (configurado no `.oxlintrc.json`).

## Convenções

- **ESM:** imports relativos usam extensão `.js` (ex.: `./app.module.js`).
- **TDD:** escreva o teste antes. Testes espelham a estrutura de `src/`.
- **Sem comentários** no código, salvo quando indispensável.
- **Validação:** toda entrada externa passa por DTO com `class-validator`.
- **Segredos:** nunca commitar `.env`. Usar `.env.example` como template.
- **Formatação:** rodar `npm run format` e `npm run lint` antes de finalizar.

## Verificação antes de concluir uma tarefa

1. `npm run lint`
2. `npm run test`
3. `npm run build`
