# src/app

Esta carpeta contiene la aplicación basada en App Router de Next.js.

## Qué debe ir aquí

- `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` y archivos especiales de Next.js.
- Segmentos de ruta, rutas dinámicas y grupos de rutas.
- Route handlers con `route.ts` cuando la app exponga endpoints propios.
- Providers o wiring mínimo necesario para montar la aplicación.
- Estilos globales que deban cargarse desde el layout principal.

## Buenas prácticas

- Mantén los componentes como Server Components por defecto y usa Client Components solo cuando sea necesario.
- Delega la lógica reutilizable a `src/components/`, `src/features/`, `src/services/` o `src/hooks/`.
- Si necesitas una API interna con Next.js, colócala bajo `src/app/api/`.
- Evita meter utilidades genéricas o lógica transversal directamente en las rutas.

## Organización sugerida

- Usa subcarpetas por sección o flujo de navegación.
- Crea archivos especiales solo cuando la ruta lo requiera.
- Mantén cada segmento lo más pequeño posible para facilitar mantenimiento.
