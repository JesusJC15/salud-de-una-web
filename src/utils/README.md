# src/utils

Esta carpeta contiene funciones utilitarias puras y reutilizables.

## Qué debe ir aquí

- Formateadores.
- Validadores simples.
- Parsers.
- Helpers matemáticos, de fechas o strings que no dependan de React.
- Funciones pequeñas usadas en distintos módulos.

## Qué evitar

- Acceso directo a APIs o servicios externos.
- Estado global.
- Lógica fuerte de negocio que merezca vivir en una feature o servicio.

## Recomendaciones

- Prioriza funciones puras y testeables.
- Usa nombres explícitos y salidas predecibles.
- Si una utilidad solo sirve para una feature, mantenla dentro de esa feature.
