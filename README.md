# Angular Smart CRUD Generator

**ASCG** — A web-based tool that generates Angular CRUD code from OpenAPI 3.0/3.1 (Swagger) specifications. Upload or fetch a spec, configure your preferences, and download a fully typed Angular project.

---

## Features

### Implemented ✅

- **OpenAPI Parsing** — Parses OpenAPI 3.0 and 3.1 specs (YAML and JSON, via file upload or URL fetch)
- **Full CRUD Generation** — Generates List, Create, Edit, and Details pages per entity
- **Typed Models** — TypeScript interfaces for entities, create DTOs, and update DTOs
- **CRUD Services** — `HttpClient`-based Angular services with `getAll`, `getById`, `create`, `update`, `delete`
- **Typed Forms** — Reactive Forms, Dynamic Forms (config-driven), or Signal Forms (Angular 21+)
- **Smart Detection** — Audit fields (`createdAt`, `updatedAt`, `createdBy`, `updatedBy`), soft delete (`deletedAt`, `isDeleted`, `deleted`), foreign keys (`*Id`), primary keys (`id`)
- **Relationship Detection** — 1:1 (`$ref` fields) and 1:N (array `$ref` fields) auto-detected and reflected in generated code
- **DTO Merging** — `Create*Dto`, `Update*Dto`, `Patch*Dto` fields merged into main entity
- **Validation Mapping** — OpenAPI constraints (`minLength`, `maxLength`, `minimum`, `maximum`, `pattern`, `required`) → Angular validators
- **Enum Support** — OpenAPI enums → TypeScript union types + `<select>` in forms
- **UI Framework Templates** — Raw/Tailwind CSS, Angular Material, PrimeNG
- **State Management** — Signals, `@ngrx/signals` (SignalStore), or `@ngrx/component-store` (ComponentStore)
- **Dashboard UI** — Drag-and-drop file upload, URL import, entity selection, config wizard, output preview, ZIP download
- **Lazy Routes** — Generated route configs with `loadComponent` per entity

### Planned 🚧

- Bootstrap UI templates
- NgRx (Actions, Reducers, Effects, Selectors)
- CLI (`ascg generate --input swagger.json`)
- Pagination, sorting, and filtering in generated tables
- CSV/Excel export
- Internationalization (English, Portuguese, Spanish, French)
- Authentication (JWT interceptors, OAuth2, OpenID Connect)
- Plugin system for custom generators
- Many-to-Many relationship auto-detection
- Autocomplete/lookup components for foreign keys

---

## Architecture

```text
OpenAPI Specification (YAML/JSON)
         │
         ▼
  OpenApiParserService      — reads, validates, extracts schemas + endpoints
         │
         ▼
  MetadataEngineService     — EntityDefinition, FieldDefinition, EndpointDefinition,
                              RelationshipDefinition with smart detection
         │
         ▼
  GeneratorOrchestratorService
         │
         ├── ModelGeneratorService      — TypeScript interfaces
         ├── ServiceGeneratorService    — @Injectable CRUD services
         ├── FormGeneratorService       — Reactive / Dynamic / Signal forms
         ├── ComponentGeneratorService  — List, Create, Edit, Details components
         ├── RouteGeneratorService      — Lazy-loaded route configs
         └── StoreGeneratorService      — SignalStore / ComponentStore
         │
         ▼
    GeneratedFile[] → ZIP download
```

---

## Quick Start

```bash
pnpm install
pnpm start        # → http://localhost:4200
pnpm test         # Vitest unit tests
pnpm build        # → dist/
```

---

## Dashboard

Open the app in your browser, then:

1. **Upload** a Swagger file (.json / .yaml / .yml) or **fetch** from a URL
2. **Select entities** to generate (deselect audit logs, DTOs, etc.)
3. **Configure** UI framework, state management, Angular version (18–21), and form type
4. Click **Generate** — preview all generated files
5. Click **Download ZIP** — get a ready-to-extract Angular project

### Configuration options

| Setting      | Choices                                    |
| ------------ | ------------------------------------------ |
| UI Framework | Raw (Tailwind), Angular Material, PrimeNG  |
| State Mgmt   | Signals, SignalStore, ComponentStore, None |
| Form Type    | Reactive, Dynamic, Signal                  |
| Angular      | 18, 19, 20, 21                             |

---

## Technology Stack

| Layer           | Choice                              |
| --------------- | ----------------------------------- |
| Framework       | Angular 21                          |
| Language        | TypeScript 5.9                      |
| Styling         | Tailwind CSS v4 (PostCSS plugin)    |
| Testing         | Vitest                              |
| Package Manager | pnpm 11                             |
| Formatter       | Prettier (config in `package.json`) |
| Build           | Angular CLI                         |

---

## Development Commands

| Command                   | Description                                    |
| ------------------------- | ---------------------------------------------- |
| `pnpm start` / `ng serve` | Dev server at `localhost:4200`                 |
| `pnpm test` / `ng test`   | Vitest unit tests (headless)                   |
| `pnpm build` / `ng build` | Production build → `dist/`                     |
| `pnpm watch`              | `ng build --watch --configuration development` |

No ESLint configured — rely on the Angular compiler for type checking.

---

## Project Status

Early stage. The core generation pipeline (parser → metadata → generator → download) is functional. Higher-level features like CLI, i18n, auth, pagination, and exports are on the roadmap.
