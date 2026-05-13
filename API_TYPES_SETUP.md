# OpenAPI-First Type Generation Setup

## Overview

The frontend now uses an **OpenAPI-first approach** for API type generation. Types are automatically generated from the backend's OpenAPI specification (`salud-de-una-backend/openapi.json`).

## Generated File

- **Location:** `src/types/api.generated.ts`
- **Size:** ~87 KB (3,368 lines)
- **Auto-generated:** Yes - do not edit directly
- **Regeneration:** Run `npm run generate:api-types`

## Build Integration

The build process now automatically regenerates types:

```bash
npm run build    # Runs: generate:api-types → next build
```

## Quick Start

### Generate Types on Demand

```bash
npm run generate:api-types
```

### Development Workflow

1. Backend developer adds/modifies endpoints with proper OpenAPI decorators in NestJS
2. Backend exports updated OpenAPI spec (available at `http://localhost:3000/v1/docs` when running with `NODE_ENV=development`)
3. Frontend developer runs `npm run generate:api-types` to refresh types
4. TypeScript auto-completion and type safety immediately available

### Manual OpenAPI Export (if needed)

```bash
# From backend directory with NODE_ENV=development:
curl http://localhost:3000/v1/docs-json > openapi.json
```

## Using Generated Types

### Path Parameters

```typescript
import type { paths } from '@/types/api.generated'

type ReadinessResponse = paths['/v1/ready']['get']['responses']['200']['content']['application/json']
```

### Request/Response Types

```typescript
import type { operations } from '@/types/api.generated'

type DoctorVerifyRequest = operations['AdminController_verifyDoctor']['requestBody']['content']['application/json']
type DoctorVerifyResponse = operations['AdminController_verifyDoctor']['responses']['200']['content']['application/json']
```

### API Client Integration

Update `src/services/api-client.ts` to use generated types for better type safety:

```typescript
import type { operations, paths } from '@/types/api.generated'

// Typed API calls with auto-completion
const response = await apiClient.get<paths['/v1/consultations/queue']['get']['responses']['200']['content']['application/json']>(
  '/v1/consultations/queue'
)
```

## Build Output

When running `npm run build`, you'll see:

```
✨ openapi-typescript 7.13.0
🚀 ../salud-de-una-backend/openapi.json → src/types/api.generated.ts [~170ms]
```

## Troubleshooting

### Types Not Updating?

Ensure the backend OpenAPI spec is up-to-date:

```bash
# Backend directory with NODE_ENV=development:
npm run start:dev  # Starts Swagger at http://localhost:3000/v1/docs
```

### Build Fails?

1. Check if `../salud-de-una-backend/openapi.json` exists
2. Verify backend OpenAPI is valid: `http://localhost:3000/v1/docs-json`
3. Manually regenerate: `npm run generate:api-types`

### TypeScript Errors After Generation?

Run `npm run check:types` to validate:

```bash
npm run check:types
```

## Next Steps

1. ✅ API types generation setup complete
2. 📋 Update `src/services/api-client.ts` to leverage generated types
3. 🧪 Create E2E contract tests (FE↔BE) using generated types
4. 📚 Document API consumer patterns in codebase
