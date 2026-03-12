# src

Esta carpeta concentra el código fuente principal de la aplicación. La idea es que todo lo que represente lógica, UI, configuración o contratos del proyecto viva aquí, mientras que en la raíz solo queden archivos de configuración, `public/` y documentación general.

## Objetivos de esta estructura

- Mantener una separación clara entre rutas, UI reutilizable, lógica de negocio y utilidades.
- Facilitar que cualquier desarrollador sepa dónde crear un archivo nuevo sin duplicar responsabilidades.
- Promover módulos pequeños, con nombres consistentes y dependencias fáciles de rastrear.

## Convenciones recomendadas

- Usar `src/app/` para rutas, layouts, loading states, errores y handlers de Next.js.
- Crear código compartido en carpetas específicas en lugar de mezclar todo en `components/` o `utils/`.
- Agrupar la lógica de negocio por dominio dentro de `src/features/`.
- Mantener `src/utils/` y `src/lib/` libres de reglas de negocio cuando sea posible.
- Preferir imports con alias `@/` para evitar rutas relativas largas.

## Mapa de carpetas

- `src/api/`: contratos, clientes y helpers relacionados con APIs.
- `src/app/`: rutas y archivos especiales del App Router de Next.js.
- `src/components/`: componentes de UI reutilizables.
- `src/config/`: configuración centralizada del proyecto.
- `src/contexts/`: providers y contextos de React.
- `src/features/`: módulos organizados por funcionalidad o dominio.
- `src/hooks/`: hooks personalizados reutilizables.
- `src/lib/`: integraciones base y utilidades de bajo nivel.
- `src/services/`: casos de uso y acceso a servicios externos.
- `src/styles/`: estilos globales compartidos, tokens y recursos visuales.
- `src/types/`: tipos e interfaces compartidas.
- `src/utils/`: funciones utilitarias puras y reutilizables.

## Cómo decidir dónde crear algo nuevo

- Si renderiza una ruta o usa archivos como `page.tsx`, `layout.tsx`, `loading.tsx` o `route.ts`, va en `src/app/`.
- Si es UI reutilizable sin depender de una sola pantalla, va en `src/components/`.
- Si pertenece a una funcionalidad concreta del negocio, va en `src/features/`.
- Si encapsula llamadas a APIs o proveedores externos, revisa `src/api/` y `src/services/`.
- Si solo define tipos, esquemas o contratos, ubícalo en `src/types/`.
