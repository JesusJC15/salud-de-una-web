# src/types

Usa esta carpeta para contratos de tipos compartidos en todo el proyecto.

## Qué debe ir aquí

- Interfaces y type aliases reutilizables.
- DTOs y contratos compartidos entre servicios, features y componentes.
- Enums o tipos literales globales.
- Tipos derivados de integraciones cuando deban compartirse.

## Recomendaciones

- Separa tipos por dominio cuando el proyecto crezca.
- Evita crear archivos gigantes con tipos no relacionados.
- Si un tipo pertenece solo a una feature, déjalo dentro de esa feature.
