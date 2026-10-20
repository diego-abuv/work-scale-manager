# CLAUDE.md

Este arquivo é o ponto de entrada para o Claude Code. O conteúdo de convenções,
comandos e arquitetura vive em `AGENTS.md` — leia-o como fonte principal.

@AGENTS.md

## Resumo rápido

- API NestJS (ESM, Node v24) para gestão de escalas de trabalho, multi-tenant
  (schema `tenant_<uuid>`), público B2B (empresas/RH).
- Stack: NestJS · Prisma · PostgreSQL · JWT/RBAC · class-validator · Swagger · Vitest.
- Arquitetura: Clean Architecture (`domain` / `application` / `infrastructure` / `presentation`).
- Escopo completo e contexto legal: `docs/SCOPE.md`.

## Comandos essenciais

```bash
npm run start:dev     # dev
npm run lint          # oxlint
npm run test          # vitest
npm run build         # build
docker compose up -d  # Postgres local
```

## Regras-chave

- Imports relativos ESM com extensão `.js`.
- TDD: teste antes da implementação.
- Toda entrada validada por DTO (`class-validator`).
- Nunca usar `slug` como nome de schema; usar `tenant_<uuid>`.
- Nunca commitar `.env`.
- Rodar `npm run lint`, `npm run test` e `npm run build` antes de concluir.
