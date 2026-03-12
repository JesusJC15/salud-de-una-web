# src/styles

Esta carpeta agrupa recursos de estilos compartidos fuera de una ruta concreta.

## Qué debe ir aquí

- Tokens visuales compartidos.
- Archivos CSS reutilizables.
- Variables de diseño, temas o capas de estilos globales.
- Helpers visuales que deban centralizarse.

## Consideraciones para Next.js

- Los estilos globales que cargan toda la aplicación suelen importarse desde `src/app/layout.tsx`.
- Si un estilo pertenece solo a un componente, considera usar un archivo colocalizado.
- Mantén aquí lo transversal; evita llenar esta carpeta con estilos de una sola pantalla.
