# src/features

Esta es la carpeta principal para organizar la lógica por dominio o funcionalidad.

## Qué debe ir aquí

- Módulos como `auth/`, `profile/`, `articles/`, `dashboard/` o el dominio principal del producto.
- Componentes, hooks, servicios y tipos que pertenecen exclusivamente a una feature.
- Casos de uso y flujos completos ligados a un área funcional.

## Estructura sugerida por feature

Cada feature puede tener internamente carpetas como:

- `components/`
- `hooks/`
- `services/`
- `types/`
- `utils/`

## Recomendaciones

- Promueve alta cohesión dentro de cada feature.
- Solo extrae algo a carpetas globales si varias features lo reutilizan.
- Evita dependencias circulares entre features.
