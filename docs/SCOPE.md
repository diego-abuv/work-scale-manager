# SCOPE — Work Scale Manager

Documento de escopo e decisões de arquitetura. Fonte da verdade para o desenvolvimento
do MVP. Atualizar sempre que houver mudança de decisão.

---

## 1. Contexto e motivação

A PEC 221/19 altera o artigo 7º da Constituição para:

- Reduzir a jornada de **44h para 40h semanais** (transição: 42h em até 60 dias, 40h em 14 meses).
- Garantir **dois dias de repouso semanal remunerado**, preferencialmente consecutivos e um aos domingos.
- Encerrar a **escala 6x1** (implantação das duas folgas em até 60 dias após promulgação).
- Manter os salários atuais (redução sem perda salarial).
- Excetuar quem tem jornada ≤ 40h e empregados de nível superior com remuneração ≥ ~R$ 21,1 mil.

**Status:** aprovada em dois turnos na Câmara (27/05/2026); segue para o Senado.

**Problema:** empresas e RH precisam reorganizar escalas e jornadas de forma
consistente, auditável e em conformidade com a transição legal.

---

## 2. Objetivo da aplicação

API backend para gestão de escalas e jornadas de trabalho, com foco em:

- Modelar escalas de forma **genérica e configurável** (6x1, 5x2, turnos, noturno etc.).
- Gerar escalas mensais a partir de modelos.
- Gerenciar pedidos de troca de turno entre funcionários com aprovação do RH.
- Ser **multi-tenant** desde o início, para servir múltiplas empresas de forma isolada.

**Público-alvo:** empresas / RH (B2B).

---

## 3. Decisões arquiteturais

| Área              | Decisão                                                  |
| ----------------- | -------------------------------------------------------- |
| Runtime           | Node.js v24                                              |
| Framework         | NestJS (ESM — `"type": "module"`)                        |
| Banco de dados    | PostgreSQL                                               |
| ORM               | Prisma 7 (driver adapter `@prisma/adapter-pg` + `pg`)    |
| Multi-tenant      | **Schema por tenant** (`tenant_<uuid>`)                  |
| Acesso a dados    | Client Prisma por tenant (opção `schema` do adapter)     |
| Autenticação      | JWT + RBAC (admin, rh, funcionário)                      |
| Validação         | `class-validator` + `class-transformer`                  |
| Documentação      | Swagger (`@nestjs/swagger`)                              |
| Arquitetura       | Clean Architecture (domain / application / infra / presentation) |
| Testes            | Vitest (TDD)                                             |
| Frontend          | Fora do escopo (apenas API)                              |

### 3.1 Multi-tenant: schema por UUID

- O schema `public` (global) guarda `companies` com `id` (UUID), `name`, `slug`.
- Cada empresa tem seu próprio schema **`tenant_<uuid>`** (não usa slug).
- Consistência e segurança não dependem de `slug` como identificador de schema.
- Motivos para UUID em vez de slug:
  1. **Segurança:** o nome do schema é derivado de um UUID validado, eliminando
     risco de SQL injection; slug exigiria sanitização rigorosa.
  2. **Imune a rename** de empresa.
  3. **Sem limite** de 63 caracteres do Postgres.
  4. Legibilidade fica na tabela `public.companies` (`name` + `slug`).
- `slug` existe apenas para futuras URLs amigáveis, **nunca** como nome de schema.

#### Runtime: client Prisma por tenant

O Prisma Client conecta-se a **um** schema por instância. Com o Prisma 7, a
seleção de schema é feita pela opção `schema` do driver adapter:

```ts
new PrismaPg({ connectionString: env.DATABASE_URL }, { schema: 'tenant_<uuid>' })
new PrismaClient({ adapter })
```

- Um `TenantPrismaService` resolve o client por tenant.
- Clients ficam em um **cache LRU** (chave = `tenant_<uuid>`); ao evictar, chama
  `$disconnect()` para liberar o pool.
- Chave sempre derivada de UUID validado, nunca de string crua.

#### Fluxo de resolução de tenant

```
Request
  -> TenantInterceptor (extrai companyId do JWT)
  -> TenantContext (AsyncLocalStorage) grava tenant_<uuid>
  -> TenantPrismaService.getClient(tenantId) devolve o client do cache (ou cria)
  -> Queries rodam no schema correto
```

#### Criação de nova empresa (provisionamento)

1. Insere em `public.companies` (client global) e obtém o `id` (UUID).
2. Cria o schema: `CREATE SCHEMA tenant_<uuid>`.
3. Aplica as migrações do tenant no novo schema.

As migrações são aplicadas **executando os arquivos SQL** de
`prisma/tenant/migrations/**/migration.sql` em ordem, com `search_path`
apontando para `tenant_<uuid>`. Usa-se uma conexão `pg` crua (não o Prisma),
pois cada `migration.sql` contém múltiplos statements.

No MVP (1 tenant) a infra completa já existe; escalar é apenas criar novos schemas.

### 3.2 Prisma: dois schemas

Há dois arquivos de schema, cada um com seu client gerado e suas migrações:

```
prisma/
├── global/
│   ├── schema.prisma        # Company (schema public)
│   └── migrations/
└── tenant/
    ├── schema.prisma        # User, Department, Employee, WorkSchedule, Shift, ShiftSwap
    └── migrations/
prisma7.config.ts            # config GLOBAL
prisma7.tenant.config.ts     # config TENANT (usado só p/ gerar migrações em dev)
```

- Config global: `datasource.url = DATABASE_URL` (schema `public`).
- Config tenant: `datasource.url = ${DATABASE_URL}?schema=${TENANT_MIGRATION_SCHEMA}`
  (usado apenas para gerar as migrações; em produção o provisionamento aplica os SQL).
- Clients gerados em `src/generated/prisma-global` e `src/generated/prisma-tenant`
  (diretório `generated/` está no `.gitignore`; as migrações são versionadas).

Scripts npm:

```json
"prisma:generate": "prisma generate --config prisma7.config.ts && prisma generate --config prisma7.tenant.config.ts",
"prisma:migrate:global": "prisma migrate dev --config prisma7.config.ts",
"prisma:migrate:tenant": "prisma migrate dev --config prisma7.tenant.config.ts"
```

### 3.3 Estrutura de pastas (Clean Architecture)

```
src/
├── main.ts
├── app.module.ts
├── config/                      # env validation, app config
├── generated/                   # clients Prisma gerados (gitignored)
│   ├── prisma-global/
│   └── prisma-tenant/
├── shared/
│   ├── common/
│   ├── decorators/              # @CurrentTenant, @Roles
│   ├── filters/                 # exception filters
│   ├── guards/                  # JwtAuthGuard, RolesGuard
│   ├── interceptors/            # TenantInterceptor
│   └── tenant/                  # TenantContext (AsyncLocalStorage)
├── modules/
│   ├── auth/
│   ├── companies/
│   ├── employees/
│   ├── departments/
│   ├── work-schedules/
│   ├── shifts/
│   └── shift-swaps/
└── infra/
    └── prisma/                  # PrismaService (global) + TenantPrismaService (LRU)
```

Cada módulo:

```
modules/<modulo>/
├── domain/          # entidades, value objects, interfaces de repositório
├── application/     # use cases (regra de negócio)
├── infrastructure/  # implementações (repositórios Prisma)
└── presentation/    # controllers, DTOs
```

Regra de dependência: `presentation -> application -> domain` e
`infrastructure -> domain`. O `domain` não depende de nada.

---

## 4. Escopo do MVP

### 4.1 Dentro do MVP

- **Cadastro base:** Company, Employee, Department, WorkSchedule (modelos configuráveis).
- **Geração de escalas:** gerar escala mensal a partir de um modelo.
- **Pedido de troca de turno:** funcionário solicita, RH aprova/reprova.

### 4.2 Fora do MVP (roadmap)

- Relatórios / compliance legal.
- Cálculo de horas extras, adicional noturno, DSR.
- Ponto eletrônico integrado.
- Frontend / portal do funcionário.

### 4.3 Modelo de dados inicial

**Global (`public`):**

- `Company` — `id` (uuid), `name`, `slug` (unique), `createdAt`, `updatedAt`.

**Por tenant (`tenant_<uuid>`):**

- `User` — `email` (unique), `passwordHash`, `role` (ADMIN/HR/EMPLOYEE),
  `employeeId?` (relação 1:1 opcional com Employee). Credenciais ficam dentro do
  tenant: um usuário pertence a uma única empresa.
- `Department` — `name`.
- `Employee` — `name`, `email` (unique), `document` (unique), `hireDate`,
  `departmentId`.
- `WorkSchedule` — `name`, `weeklyHours`, `active`.
- `Shift` — `employeeId`, `workScheduleId?`, `date`, `startTime`, `endTime`,
  `status` (SCHEDULED/COMPLETED/ABSENT/CANCELLED).
- `ShiftSwap` — `shiftId`, `requesterId`, `targetId`, `status`
  (PENDING/APPROVED/REJECTED/CANCELLED).

Enums (por tenant): `Role`, `ShiftStatus`, `SwapStatus`.

---

## 5. Infraestrutura

### 5.1 Local

- **PostgreSQL via Docker** (`docker-compose.yml`).
- **App roda no host** (`npm run start:dev`), conectando ao container.
- Variável `DATABASE_URL` aponta para `localhost:5432`.

### 5.2 Produção

- Banco em **serviço separado** (RDS, Neon, Cloud SQL, VM dedicada).
- App em container/instância própria.
- Separar app e banco é feito via configuração (`DATABASE_URL` por ambiente).

### 5.3 Dockerfile

- Multi-stage build (`builder` -> `production`).
- Base `node:24-alpine`.
- `npm ci --omit=dev` no estágio final.
- Executar como usuário non-root.
- Copiar `dist` e **`prisma/tenant/migrations`** para o estágio de produção
  (o provisionamento lê esses SQL em runtime).
- O client Prisma é gerado em `src/generated` e compilado para `dist/generated`.

### 5.4 Variáveis de ambiente

- `PORT` — porta da aplicação.
- `DATABASE_URL` — conexão do Postgres.
- `TENANT_MIGRATION_SCHEMA` — schema alvo ao gerar migrações de tenant em dev
  (ex.: `tenant_dev`).

---

## 6. Boas práticas

- **TDD:** escrever teste antes da implementação. Testes unitários espelham `src/`.
- **POO:** entidades ricas no domain, sem dependência de framework.
- **Cybersecurity:**
  - JWT com expiração e refresh.
  - Senhas com bcrypt.
  - RBAC por guard.
  - Validação/sanitização de toda entrada.
  - Nome de schema sempre derivado de UUID validado.
  - Segredos nunca commitados (`.env` no `.gitignore`).

---

## 7. Entregáveis

### Fase 1 (Fundação) — concluída

1. `docker-compose.yml` (Postgres).
2. Dependências base instaladas (`@nestjs/config`, `@prisma/client`, `prisma`,
   `@nestjs/swagger`, `class-validator`, `class-transformer`, `@nestjs/jwt`,
   `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`).
3. `Dockerfile` multi-stage (corrigido para o Prisma 7).
4. `.env.example` atualizado.
5. `AGENTS.md`, `CLAUDE.md`, `docs/SCOPE.md`.
6. `@nestjs/mau` removido (audit zerado).

### Fase 2 (Schema + Fundação multi-tenant)

1. `@prisma/adapter-pg` + `pg`.
2. `prisma/global/schema.prisma` + `prisma7.config.ts`.
3. `prisma/tenant/schema.prisma` + `prisma7.tenant.config.ts`.
4. Scripts npm de generate/migrate.
5. `config/env.validation.ts`.
6. `PrismaModule` / `PrismaService` (global).
7. `TenantPrismaService` (cache LRU) + `TenantContext` + `TenantInterceptor`.
8. Use case de provisionamento + runner de migrações (via `pg`).
9. Primeiro teste TDD (provisionamento).
10. Ajustes: Dockerfile (copiar migrações), `.oxlintrc.json` (ignorar
    `src/generated/**`), `.env` (`TENANT_MIGRATION_SCHEMA`).

---

## 8. Ordem de execução (Fase 2)

```
1.  Criar prisma/global/schema.prisma + prisma7.config.ts
2.  Criar prisma/tenant/schema.prisma + prisma7.tenant.config.ts
3.  Scripts npm + variável TENANT_MIGRATION_SCHEMA
4.  docker compose up -d
5.  npm run prisma:migrate:global     # cria public.companies
6.  npm run prisma:migrate:tenant     # gera prisma/tenant/migrations
7.  npm run prisma:generate
8.  config/env.validation.ts
9.  PrismaService + PrismaModule
10. TenantPrismaService (LRU) + TenantContext + TenantInterceptor
11. provision-company.use-case.ts + tenant-migrations.runner.ts
12. Primeiro teste TDD (provisionamento)
13. Ajustes Dockerfile/oxlint/env + docker build
```
