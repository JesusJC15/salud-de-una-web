# src/services

Usa esta carpeta para servicios y casos de uso compartidos por la aplicación.

## Qué debe ir aquí

- Orquestación de lógica entre API, tipos, utilidades y features.
- Funciones que encapsulan operaciones de negocio o acceso a datos.
- Servicios reutilizables por varias rutas o features.

## Qué evitar

- Componentes de UI.
- Configuración estática.
- Utilidades demasiado genéricas que deberían vivir en `src/utils/`.

## Recomendaciones

- Diseña servicios alrededor de acciones concretas del negocio.
- Mantén entradas y salidas bien tipadas.
- Separa claramente la comunicación externa de la lógica de negocio cuando sea posible.
