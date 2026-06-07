# Angular Smart CRUD Generator

## Stack

Angular 21, TypeScript 5.9, **pnpm**, **Vitest**, **Tailwind CSS v4** (PostCSS plugin), Prettier.

## Commands

| Command | What it does |
|---|---|
| `pnpm start` / `ng serve` | Dev server at `localhost:4200` |
| `pnpm test` / `ng test` | Vitest unit tests (headless) |
| `pnpm build` / `ng build` | Production build → `dist/` |
| `pnpm watch` | `ng build --watch --configuration development` |

There is no ESLint — rely on the Angular compiler (`ng build`/`ng test`) for type checking.

## Project conventions

- **pnpm** is the only package manager (set in `angular.json` and `package.json`).
- **Prettier** config lives inline in `package.json` (printWidth 100, singleQuote, `angular` parser for HTML).
- **Vitest** is the test runner (builder `@angular/build:unit-test`, not Karma). Spec files import `vitest/globals`.
- Spec files live next to their source (`src/**/*.spec.ts`).
- Tests must be written without `standalone: true` in component metadata (it's the default in Angular 21).
- No `.prettierrc` or ESLint config files — the only formatter config is in `package.json`.

## Architecture (planned — see `app.md` for full SRS)

The app is a **code generator** that consumes OpenAPI 3.0/3.1 specs and produces Angular CRUD code:

```
OpenAPI → Schema Parser → Metadata Engine → Template Engine → Angular Code Generator → Generated Project
```

### Pipeline modules

- **Parser**: reads/validates/extracts metadata from OpenAPI JSON or YAML (file upload or URL)
- **Metadata Engine**: produces `EntityDefinition`, `FieldDefinition`, `EndpointDefinition`, `RelationshipDefinition`
- **Template Engine**: renders Angular components, services, models, routes, state using templates
- **Generator Engine**: assembles output — components (list/create/edit/details), services, typed reactive forms, routes, i18n, state (signals/NgRx/Component Store)

### Smart features (from `app.md`)
- Entity detection, audit field detection (`createdAt`, etc.), soft delete detection (`deletedAt`, `isDeleted`), foreign-key lookup detection
- Relationship support (1:1, 1:N, M:N)
- Plugin system for custom generators
- CLI (`ascg generate --input swagger.json --ui primeng --state signals`)

### Current state

Early scaffold. The Angular CLI template (default welcome page) is still in place. Routes are empty. Build toward the `app.md` specification.

## Skills (pre-installed in `.agents/skills/`)

- **angular-developer** — Angular best practices (signals, control flow, inject(), standalone components, reactive forms, ARIA, testing).
- **angular-new-app** — Angular project creation and setup patterns.

## Tooling

- Angular CLI MCP configured in `opencode.json` with `build`, `test`, and `modernize` tools.
- `opencode.json` permissions require confirmation for MCP tool use.
