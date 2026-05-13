# SaludDeUna Web Staff Portal

Portal web para operación clínica y administrativa de SaludDeUna. Este frontend cubre roles `ADMIN` y `DOCTOR`; los flujos de paciente, triage, checkout y followups no forman parte del alcance web actual.

## Requisitos

- Node.js 22+
- Backend disponible en un origen sin sufijo `/v1`
- Variables de entorno basadas en `.env.example`

## Variables principales

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH0_DOMAIN=your-tenant.us.auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=your-web-spa-client-id
NEXT_PUBLIC_AUTH0_AUDIENCE=https://api.salud-de-una.com
NEXT_PUBLIC_AUTH0_REDIRECT_URI=http://localhost:3001/callback
NEXT_PUBLIC_ENABLE_LEGACY_SESSION_STORAGE=false
```

`NEXT_PUBLIC_API_BASE_URL` debe ser el origen del backend sin `/v1`. La app deriva internamente:

- API REST: `${NEXT_PUBLIC_API_BASE_URL}/v1`
- Socket.IO: `${NEXT_PUBLIC_API_BASE_URL}`

## Comandos

```bash
npm run dev          # Next.js en http://localhost:3001
npm run check:types  # TypeScript
npm run lint         # ESLint
npm run test         # Jest unit tests
npm run build        # Genera OpenAPI types y build prod
```

## Alcance funcional

- Admin: dashboard operativo, usuarios, doctores/REThUS, billing, reports, knowledge/RAG y prompts IA.
- Doctor: home, disponibilidad, cola, detalle de consulta, chat clínico, resumen IA, historial y timeline paciente.
- Auth: login staff legacy con JWT backend y Auth0 como proveedor soportado.

## Notas de piloto

- Los errores API muestran correlation IDs cuando el backend los provee.
- El chat usa ack de Socket.IO para distinguir mensajes enviados, fallidos y reintentables.
- La observabilidad frontend usa logging propio vía `/api/client-events`; no se deben enviar PII, tokens ni contenido clínico.
