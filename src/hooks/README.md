# src/hooks

Aquí deben vivir los hooks personalizados reutilizables del proyecto.

## Qué debe ir aquí

- Hooks de UI compartidos.
- Hooks de acceso a estado o servicios reutilizados en varias áreas.
- Hooks de integración con navegador o librerías externas.

## Recomendaciones

- Nombra los archivos con prefijo `use`.
- Mantén cada hook con una responsabilidad clara.
- Si un hook solo aplica a una feature, ubícalo dentro de `src/features/<feature>/hooks/`.
- Documenta dependencias importantes, side effects y valores retornados.
