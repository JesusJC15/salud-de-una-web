# SaludDeUna Web Staff Portal

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=JesusJC15_salud-de-una-web)](https://sonarcloud.io/summary/new_code?id=JesusJC15_salud-de-una-web)

Portal web para operación clínica y administrativa de SaludDeUna. Cubre roles `ADMIN` y `DOCTOR`. Los flujos de paciente (triage, checkout, followups) residen en la app móvil.

## Stack técnico

- Next.js 16 (App Router, Turbopack en dev)
- React 19.2.6 + TypeScript 5.9
- Node.js 22+ requerido
- Tailwind CSS 4 + shadcn/ui + Base UI
- TanStack React Query 5 para server state
- React Hook Form 7 + Zod 4 para formularios
- Socket.IO Client 4 para chat clínico en tiempo real
- Auth0 React SDK + JWT legacy (dual auth)
- Axios 1.16 como cliente HTTP
- Recharts para visualizaciones de dashboard
- Jest 30 + Testing Library para unit tests
- Playwright para E2E

## Requisitos

- Node.js 22+
- Backend disponible en un origen sin sufijo `/v1`
- Variables de entorno basadas en `.env.example`

## Variables de entorno

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-web-spa-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.salud-de-una.com
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3001/callback
NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE=false
```

`NEXT_PUBLIC_API_BASE_URL` debe apuntar al origen del backend **sin** el sufijo `/v1`. La app deriva internamente:

- API REST: `${NEXT_PUBLIC_API_BASE_URL}/v1`
- Socket.IO: `${NEXT_PUBLIC_API_BASE_URL}`

## Comandos

```bash
npm run dev              # Next.js con Turbopack en http://localhost:3001
npm run check:types      # Verificacion TypeScript (tsc --noEmit)
npm run check:lint       # ESLint sin autofix
npm run fix:lint         # ESLint con autofix
npm run format           # Prettier
npm run test             # Jest unit tests
npm run test:cov         # Jest con cobertura
npm run test:e2e         # Playwright E2E (requiere build o servidor activo)
npm run build            # Genera tipos OpenAPI y build de produccion Next.js
npm run generate:api-types  # Genera src/types/api.generated.ts desde openapi/openapi.json
```

## CI (GitHub Actions)

El workflow `.github/workflows/web-ci.yml` ejecuta dos jobs:

1. **quality**: `npm ci` → `check:types` → `check:lint` → `test --ci --runInBand` → `build`
2. **e2e** (depende de quality): instala Playwright Chromium → ejecuta `test:e2e`

Variables requeridas en CI para el build: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_AUTH0_DOMAIN`, `NEXT_PUBLIC_AUTH0_CLIENT_ID`, `NEXT_PUBLIC_AUTH0_AUDIENCE`, `NEXT_PUBLIC_AUTH0_REDIRECT_URI`.

## Alcance funcional

### Admin

- Dashboard operativo con KPIs de negocio (pacientes, doctores, revenue)
- Gestión de usuarios (pacientes, doctores, admins) con activacion/desactivacion
- Bandeja de verificacion REThUS de doctores
- Billing: precios por especialidad, historial de transacciones, metricas de revenue
- Knowledge base: documentos clínicos, estado de ingestion, embeddings
- Prompts IA versionados por especialidad

### Doctor

- Home y disponibilidad
- Cola de consultas (solo doctores verificados)
- Detalle de consulta activa
- Chat clínico en tiempo real (Socket.IO)
- Resumen clínico generado por IA (Gemini)
- Historial y timeline evolutivo del paciente

### Auth

- Login staff (DOCTOR/ADMIN) via JWT backend legacy
- Auth0 como proveedor de identidad soportado (dual auth)
- Callback y manejo de sesion via `NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE`

## Estructura de directorios

```text
src/
  api/          # Contratos HTTP tipados y clientes Axios por dominio
  app/          # Next.js App Router: (auth)/, (staff)/admin, (staff)/doctor
  components/   # Componentes reutilizables compartidos
  config/       # Configuracion centralizada (URLs, flags)
  contexts/     # React Contexts/Providers globales
  features/     # Logica por dominio: auth, admin-console, admin-home, doctor-home, doctor-queue
  hooks/        # Hooks personalizados
  lib/          # Integraciones base (axios, socket, auth0)
  providers/    # Providers globales (QueryClient, Auth0Provider)
  services/     # Capa de casos de uso y llamadas API
  styles/       # Estilos globales y tokens Tailwind
  types/        # Tipos compartidos (admin.ts, api.generated.ts)
  utils/        # Funciones utilitarias
openapi/
  openapi.json  # Especificacion OpenAPI del backend (fuente para generate:api-types)
```

## Notas operativas

- Los errores API incluyen `correlationId` cuando el backend los provee.
- El chat usa ack de Socket.IO para distinguir mensajes enviados, fallidos y reintentables.
- La observabilidad frontend usa logging propio vía `/api/client-events`; no enviar PII, tokens ni contenido clínico.
- Evitar barrel exports (`index.ts`) para preservar tree-shaking de Next.js.
