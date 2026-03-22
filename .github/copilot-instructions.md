# Copilot Instructions — SaludDeUna Web

## Project Overview

Frontend web application for **SaludDeUna**, built with **Next.js 16 App Router**, **React 19**, **TypeScript** and **Tailwind CSS v4**.

- Runtime: Node.js 20+
- Framework: Next.js 16 (`src/app`)
- Language: TypeScript 5 in strict mode
- Styling: Tailwind CSS v4 + utility-first styling in TSX
- UI primitives: local `src/components/ui`
- Animation: `motion/react`
- Forms: local hooks and validators in `src/features`
- Data access: `fetch` through local service/client wrappers
- Tests: Jest + ts-jest
- Quality: ESLint flat config + Sonar coverage from `coverage/lcov.info`

Do not generate NestJS, Express, Mongoose, MongoDB, Passport, controller/service/module backend patterns for this repository.

## Repository Layout

```text
src/
  app/          # Next.js App Router entrypoints, layouts and route groups
  api/          # Generic API client helpers
  components/   # Shared UI and animation primitives
  config/       # Project configuration helpers
  contexts/     # React context providers when needed
  features/     # Feature-oriented UI, hooks, validators, constants and pages
  hooks/        # Shared React hooks
  lib/          # Small reusable framework-agnostic helpers
  services/     # Service layer for auth and remote calls
  styles/       # Styling support files
  types/        # Shared DTOs, domain types and enums
  utils/        # Pure utility functions and label maps
```

Current route structure:

- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(dashboard)/page.tsx`

## Architecture Rules

- Keep `src/app` thin. Route files should mostly compose feature pages, layouts and metadata.
- Put feature-specific UI, hooks, validators, constants and page composition under `src/features/<feature>`.
- Put reusable presentational primitives in `src/components`.
- Put HTTP/session logic in `src/services` or `src/api`, not inside page components.
- Put pure helpers in `src/lib` or `src/utils`.
- Reuse the `@/` import alias. Prefer absolute imports over long relative paths.
- Follow the existing feature-first structure instead of creating horizontal folders like `controllers`, `reducers`, or `modules`.

## Next.js Guidance

- Default to **Server Components**. Add `'use client'` only when the file uses browser APIs, state, effects, event handlers, or client navigation hooks.
- Do not make client components `async`.
- Keep App Router conventions correct: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `route.ts`.
- Use `next/image` for images, not raw `<img>`, unless there is a clear technical reason.
- Use `next/font` for fonts when touching global typography.
- Prefer `next/navigation` APIs for routing inside client components.
- Preserve route groups like `(auth)` and `(dashboard)`.

## React and Component Conventions

- Use functional components and TypeScript types/interfaces.
- Match the existing style: named exports for most feature/page utilities, default export only where the file already follows that pattern.
- Keep components focused. Extract repeated UI or logic instead of growing very large files.
- Prefer early returns and explicit state handling over deeply nested conditionals.
- When updating forms, keep sanitization, validation and submission concerns separated:
  - sanitize in small utility functions
  - validate in dedicated validators
  - orchestrate UI state in hooks
- Use hooks for client orchestration and services for remote side effects.
- Preserve accessibility attributes already used in forms: `label`, `htmlFor`, `aria-*`, `required`, `disabled`, semantic button types.

## Data Fetching and Services

- Prefer the existing local wrappers around `fetch` instead of introducing a new HTTP abstraction.
- Reuse `src/api/api-client.ts` and `src/services/auth-service.ts` patterns for:
  - timeouts
  - correlation IDs
  - auth token refresh
  - normalized error handling
- Avoid direct `localStorage` usage scattered across components. Keep session persistence inside services/helpers.
- Keep browser-only APIs guarded with `typeof window !== 'undefined'` when needed.

## Styling and UI

- Preserve the current visual language: bold marketing-like layouts, gradients, soft blur backgrounds, rounded cards, strong typography.
- Use Tailwind utility classes directly in components; do not introduce CSS modules unless there is a strong reason.
- Reuse existing helpers and primitives such as `cn`, local `Button`, local `Input`, and animation presets from `src/components/animations`.
- Prefer consistent spacing, semantic color usage and mobile-first responsive classes.
- When adding animations, reuse the current `motion/react` patterns and existing variants before creating new ad hoc motion logic.

## TypeScript Rules

- Respect strict TypeScript settings.
- Avoid `any`. If unavoidable, keep it narrow and documented.
- Reuse domain types from `src/types`.
- Keep utility functions pure when possible.
- Do not bypass typing with unsafe casts unless there is no practical alternative.

## Testing

- Use Jest for unit tests.
- Test files should be colocated and named `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`.
- Prioritize tests for pure utilities, validators, sanitizers and service behavior.
- Keep tests deterministic and focused on behavior.
- When changing validation copy or service behavior, update or add tests in the same change.

Relevant commands:

```bash
npm run check:lint
npm run check:types
npm test -- --runInBand
npm run test:cov -- --runInBand
```

## Quality and Sonar

- Keep code compatible with ESLint flat config in `eslint.config.mjs`.
- Keep coverage output compatible with Sonar by preserving `coverage/lcov.info`.
- Avoid moving tests or coverage artifacts to non-standard locations unless the config is updated too.
- Prefer small, reviewable changes that do not break lint, typecheck, tests or coverage collection.

## Output Preferences for Copilot

When generating code for this repo, Copilot should:

- produce Next.js frontend code, not backend code
- prefer feature-oriented placement over generic folders
- use the `@/` alias
- keep App Router files small and delegate to `src/features`
- preserve Spanish product copy when editing existing UX text
- keep naming consistent with the current domain: auth, doctors, dashboard, register, login, specialty, professional license
- avoid introducing a second state-management or HTTP library unless explicitly requested

## Avoid

- Do not generate NestJS modules, controllers, DTO decorators, or backend bootstrap code.
- Do not move business logic into `src/app` route files.
- Do not introduce Redux, Zustand, React Query mutations, Axios-based rewrites, or form libraries unless explicitly requested.
- Do not replace existing fetch/service patterns with a new abstraction without a concrete reason.
- Do not ignore lint, type or test failures in generated changes.
