---
name: concise-planning
description: Use when a user asks for a plan for a coding task, to generate a clear, actionable, and atomic checklist.
---

# Concise Planning

## Goal

Turn a user request into a **single, actionable plan** with atomic steps.

## Workflow

### 1. Scan Context

### Precisa ser alterado aqui para as regras do front

- **Leia as rules do projeto** em `.cursor/rules/` antes de definir o plano. Elas contêm convenções obrigatórias:
  - `architecture-guide.mdc` — arquitetura (NestJS, use cases, DTOs, repositórios)
  - `architecture.mdc` — estrutura de pastas (domain, application, infrastructure, interface)
  - `database/core.mdc` — schema e relacionamentos do banco
  - `tests.mdc` — padrão de testes (AAA, integração de use cases, mocks)
  - `commit-message.mdc` — Conventional Commits em pt-BR
  - `basics-comands.mdc` — convenções básicas do projeto
  - Outras em `.cursor/rules/` conforme o escopo (events, libraries, repository-queries, paginate-filtered, database-migrations, new_curls).
- Leia `README.md`, docs e arquivos de código relevantes ao escopo.
- Identifique restrições (linguagem, frameworks, testes) a partir das rules e do código.

### 2. Minimal Interaction

- Ask **at most 1–2 questions** and only if truly blocking.
- Make reasonable assumptions for non-blocking unknowns.

### 3. Generate Plan

Use the following structure:

- **Approach**: 1-3 sentences on what and why.
- **Scope**: Bullet points for "In" and "Out".
- **Action Items**: A list of 6-10 atomic, ordered tasks (Verb-first).
- **Validation**: At least one item for testing.

## Plan Template

```markdown
# Plan

<High-level approach>

## Scope

- In:
- Out:

## Action Items

[ ] <Step 1: Discovery>
[ ] <Step 2: Implementation>
[ ] <Step 3: Implementation>
[ ] <Step 4: Validation/Testing>
[ ] <Step 5: Rollout/Commit>

## Open Questions

- <Question 1 (max 3)>
```

## Checklist Guidelines

- **Atomic**: Each step should be a single logical unit of work.
- **Verb-first**: "Add...", "Refactor...", "Verify...".
- **Concrete**: Name specific files or modules when possible.

## Integration with Project Rules

Os action items devem respeitar as convenções definidas em `.cursor/rules/`. O passo **Scan Context** inclui a leitura dessas rules; use-as para que cada item do plano esteja alinhado à arquitetura, testes, banco e mensagens de commit do projeto.
