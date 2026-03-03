---
name: shuri-crud-module
description: 'Step-by-step guide to create a new CRUD module in Shuri API following DDD layers and the qualifications module pattern. Use when adding a new resource/entity with full CRUD in the Shuri API codebase.'
---

# Shuri API — Novo módulo CRUD (DDD)

Instruções para criar um **módulo CRUD** no Shuri API seguindo o modelo do projeto: **DDD** (Domain-Driven Design), camadas domain/application/infrastructure/interface e o padrão do módulo **qualifications** (`src/modules/workflows/qualifications`).

## Quando usar esta skill

- Criar um novo recurso com Create, Read (um + listagem), Update e Delete.
- O recurso pertence a um bounded context existente (ex.: dentro de `workflows`) ou a um novo módulo em `modules/<bounded-context>/`.
- Manter consistência com Entity, Repository (interface + impl), Use Cases, Controller, DTOs, Swagger e soft delete.

---

## 1. Estrutura de pastas (DDD)

Seguir exatamente esta árvore (referência: `.cursor/rules/architecture.mdc` e módulo `qualifications`):

```
src/modules/<bounded-context>/<feature>/
├── <feature>.module.ts
├── domain/
│   ├── entities/
│   │   └── <entity-name>.entity.ts
│   └── repositories/
│       └── <entity-name>.repository.interface.ts
├── application/
│   ├── dtos/
│   │   ├── create-<entity>.dto.ts
│   │   ├── update-<entity>.dto.ts
│   │   └── <entity>-response.dto.ts
│   ├── use-cases/
│   │   ├── create-<entity>.use-case.ts
│   │   ├── get-<entity>.use-case.ts
│   │   ├── get-<entities>-by-<context>.use-case.ts   # listagem (ex.: by area)
│   │   ├── update-<entity>.use-case.ts
│   │   └── delete-<entity>.use-case.ts
│   └── event-handlers/   # opcional
├── infrastructure/
│   ├── persistence/
│   │   ├── models/
│   │   │   └── <entity-name>.model.ts
│   │   └── repositories/
│   │       └── <entity-name>.repository.ts
│   └── mappers/
│       └── <entity-name>.mapper.ts
└── interface/
    └── controllers/
        ├── <entity-name>.controller.ts
        └── <entity-name>.swagger.ts
```

Nomes: kebab-case para arquivos; PascalCase para classes; interface do repositório com prefixo `I` e token de injeção `'I<Entity>Repository'`.

---

## 2. Domain

### 2.1 Entity

- **Arquivo:** `domain/entities/<entity-name>.entity.ts`
- **Id:** usar value object `Id` de `src/modules/shared/domain/value-objects/id.vo` (ex.: `id: Id`, `areaId: Id`).
- **Padrões:**
  - `EntityProps` com todos os campos (incluindo `createdAt`, `updatedAt`, `deletedAt` se aplicável).
  - Construtor privado; factory `static create(...)` para criação e `static reconstitute(...)` para reconstituição a partir do persistence.
  - Validações no construtor ou em método privado `validate()` chamado no construtor.
  - Imutabilidade: métodos que “alteram” retornam nova instância (ex.: `disable()` retorna nova entity com `disabledAt` e `updatedAt`).
- **Exemplo de campos comuns:** `id`, `areaId` (se escopo por área), `name`, `description?`, `createdAt`, `updatedAt`, `deletedAt?`. Ajustar conforme regras de negócio.

### 2.2 Repository interface

- **Arquivo:** `domain/repositories/<entity-name>.repository.interface.ts`
- **Métodos típicos:** `findById(id: Id)`, `findAll(contextId?: Id)`, `findAllPaginated(contextId: Id, pagination)` (se houver listagem paginada), `create(entity)`, `update(entity)`, `delete(entity)`.
- **Delete:** soft delete (repository chama `softDelete` no TypeORM); a interface assina `delete(entity): Promise<void>`.
- Métodos extras de negócio conforme necessário (ex.: `existsByNameInArea`, `countByArea`).

---

## 3. Infrastructure

### 3.1 Model (TypeORM)

- **Arquivo:** `infrastructure/persistence/models/<entity-name>.model.ts`
- **Herdar:** `BaseModel` de `src/modules/shared/infra/persistence/models/base.model` (já traz `id`, `createdAt`, `updatedAt`, `deletedAt`).
- **Colunas:** `@Column` com `name` em snake_case (ex.: `area_id`, `disabled_at`). Tipos: `uuid`, `text`, `boolean`, `timestamptz`, etc.
- **Relacionamentos:** usar `@ManyToOne`/`@OneToMany`/`@JoinColumn` quando houver FK; `onDelete: 'CASCADE'` quando fizer sentido.

### 3.2 Mapper

- **Arquivo:** `infrastructure/mappers/<entity-name>.mapper.ts`
- **Métodos estáticos:** `toDomain(model: Model): Entity` (usa `Entity.reconstitute`) e `toPersistence(entity: Entity): Model`.
- **Ids:** `Id.create(model.id)` / `entity.id.value` para não expor VO fora do domain.

### 3.3 Repository implementation

- **Arquivo:** `infrastructure/persistence/repositories/<entity-name>.repository.ts`
- **Herdar:** `BasePaginatedRepository<Model, Entity>` de `src/modules/shared/infrastructure/persistence/base-paginated.repository` quando houver listagem paginada.
- **Constructor:** `@InjectRepository(EntityModel)` e `super(repository, { alias: '<alias>', defaultSortField: 'createdAt', mapper: EntityMapper.toDomain })`.
- **Implementar** a interface do domain: `findById`, `findAll`, `findAllPaginated` (usar `createBaseQuery()` e `executePaginated()`), `create`, `update`, `delete` (soft delete: `this.repository.softDelete(entity.id.value)`).
- Injeção: provider com `provide: 'I<Entity>Repository', useClass: <Entity>Repository`.

---

## 4. Application (use cases e DTOs)

### 4.1 DTOs

- **Create:** `application/dtos/create-<entity>.dto.ts` — class-validator (`@IsString`, `@IsNotEmpty`, `@MaxLength`, `@IsOptional`, etc.) e `@ApiProperty` / `@ApiPropertyOptional` do Swagger.
- **Update:** `application/dtos/update-<entity>.dto.ts` — todos os campos opcionais (`@IsOptional`); mesmas regras de validação que create quando o campo vier preenchido.
- **Response:** `application/dtos/<entity>-response.dto.ts` — propriedades para API; método estático `fromEntity(entity): ResponseDto` mapeando `entity.id.value`, `entity.areaId.value`, etc.

### 4.2 Use cases

- **Padrão:** `@Injectable()`, construtor com `@Inject('I<Entity>Repository') private readonly repository: I<Entity>Repository`, método `execute(request): Promise<Entity | void>`.
- **Get by id:** buscar por `Id.create(request.id)`; se não encontrar, `throw new NotFoundException('...')`; retornar entity.
- **List (paginated):** receber `areaId` (ou outro contexto) e `pagination`; chamar `repository.findAllPaginated(areaIdVo, pagination)`; retornar resultado no formato esperado pelo controller (ex.: usar `toPaginated` de `filtered-pagination.dto` se aplicável).
- **Create:** validar regras de negócio (ex.: unicidade de nome, limite por área); `Entity.create({ ... })`; `return this.repository.create(entity)`.
- **Update:** buscar entity; se não existir `NotFoundException`; validar regras (ex.: conflito de nome); montar entity atualizada (reconstitute ou novo create) e `return this.repository.update(entity)`.
- **Delete:** buscar entity; se não existir `NotFoundException`; `await this.repository.delete(entity)` (soft delete no repository).

Use cases não retornam DTO; retornam Entity (ou resultado paginado). O controller converte para DTO com `ResponseDto.fromEntity(entity)`.

---

## 5. Interface (controller e Swagger)

### 5.1 Controller

- **Arquivo:** `interface/controllers/<entity-name>.controller.ts`
- **Decorators:** `@ApiTags('<resource>')`, `@ApiBearerAuth()`, `@Controller('<resource>')`, `@UseGuards(JwtAuthGuard)`.
- **Rotas:**
  - `GET /` — listagem (paginação via `FilteredPaginationQueryDto`, `handlePaginatedRequest` se aplicável).
  - `GET /:id` — get by id.
  - `POST /` — create (body: CreateDto, `@CurrentProfile() profile` para areaId quando necessário).
  - `PUT /:id` — update (body: UpdateDto).
  - `DELETE /:id` — delete (retorno `void`, `@HttpCode(HttpStatus.NO_CONTENT)`).
- **Autorização:** usar `@Requires({ requireAreaEnabled: true, profiles: ProfileGroups.ALL | MANAGERS | COLLABORATORS })` conforme regra de negócio.
- Respostas: `QualificationResponseDto.fromEntity(qualification)` (adaptar nome do DTO). Listagem paginada: usar helper de paginação e mapear cada item com `ResponseDto.fromEntity`.

### 5.2 Swagger

- **Arquivo:** `interface/controllers/<entity-name>.swagger.ts`
- **Padrão:** funções que retornam `applyDecorators(...)` com `ApiOperation`, `ApiParam`, `ApiBody`, `ApiOkResponse`, `ApiCreatedResponse`, `ApiNoContentResponse` conforme método. Reutilizar DTOs nas respostas (`type: ResponseDto`).

---

## 6. Module (NestJS)

- **Arquivo:** `<feature>.module.ts` na raiz do feature.
- **Imports:** `TypeOrmModule.forFeature([EntityModel])`, `forwardRef` para SharedModule, AuthModule, UsersModule e módulos de contexto (ex.: AreasModule).
- **Controllers:** `[EntityController]`.
- **Providers:** todos os use cases, o repositório concreto e o token: `{ provide: 'I<Entity>Repository', useClass: EntityRepository }`. Incluir event handlers se houver.
- **Exports:** os mesmos use cases e o token do repositório, para uso em outros módulos.

---

## 7. Checklist rápido

- [ ] Entity com `Id` (VO), `create`/`reconstitute`, validação e imutabilidade.
- [ ] Repository interface no domain com findById, findAll/findAllPaginated, create, update, delete.
- [ ] Model estendendo `BaseModel`; colunas snake_case; soft delete via `deletedAt`.
- [ ] Mapper `toDomain` / `toPersistence` usando Id.create e entity.id.value.
- [ ] Repository impl estendendo `BasePaginatedRepository` quando houver listagem paginada; provider `I<Entity>Repository`.
- [ ] DTOs Create/Update com class-validator e ApiProperty; Response com `fromEntity`.
- [ ] Use cases com `@Inject('I<Entity>Repository')`; NotFoundException/ConflictException/BadRequestException quando cabível.
- [ ] Controller com JwtAuthGuard, Requires, rotas GET / GET :id / POST / PUT :id / DELETE :id; respostas mapeadas com ResponseDto.
- [ ] Swagger decorators por endpoint.
- [ ] Module com imports, providers (use cases + repository + token), exports.

---

## 8. Referência de código

Usar o módulo **qualifications** como referência viva:

- `src/modules/workflows/qualifications/` — entity, repository interface, model, mapper, repository impl, create/get/list/update/delete use cases, controller, swagger, module.

Shared do projeto:

- `Id`: `src/modules/shared/domain/value-objects/id.vo`
- `BaseModel`: `src/modules/shared/infra/persistence/models/base.model`
- `BasePaginatedRepository`: `src/modules/shared/infrastructure/persistence/base-paginated.repository`
- Pagination: `FilteredPaginationQueryDto`, `handlePaginatedRequest`, `PaginationParams`, `toPaginated` (conforme existentes no projeto).

Ao criar um novo CRUD, seguir esta skill e espelhar o qualifications para manter consistência DDD e padrões do Shuri API.
