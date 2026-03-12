# src/components

Aquí viven los componentes reutilizables de la interfaz.

## Qué debe ir aquí

- Botones, inputs, cards, modales, tablas y piezas de UI compartidas.
- Componentes de layout reutilizables.
- Componentes presentacionales desacoplados de una sola página.
- Variantes de UI que puedan reutilizarse en varias features.

## Qué evitar

- Lógica de negocio específica de una feature si solo se usará en un módulo.
- Llamadas a APIs directamente desde componentes compartidos.
- Tipos globales mezclados con la implementación visual.

## Recomendaciones

- Agrupa por dominio visual o por componente (`button/`, `card/`, `form/`, etc.).
- Si un componente pertenece solo a una feature, colócalo dentro de `src/features/`.
- Mantén props bien tipadas y APIs de componente simples.
