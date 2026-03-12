# src/lib

Esta carpeta es para piezas base y utilidades de bajo nivel sobre las que se apoyan otros módulos.

## Qué debe ir aquí

- Wrappers de librerías externas.
- Inicialización de clientes compartidos.
- Helpers técnicos de infraestructura.
- Utilidades no ligadas a una sola feature pero más específicas que `src/utils/`.

## Diferencia con otras carpetas

- `src/lib/` se enfoca en integraciones y cimientos técnicos.
- `src/utils/` se enfoca en funciones puras y genéricas.
- `src/services/` se enfoca en orquestar casos de uso o acceso a datos.

## Recomendaciones

- Mantén APIs pequeñas y predecibles.
- Evita mezclar lógica de UI o de rutas aquí.
- Usa nombres que describan claramente la integración o capacidad técnica.
