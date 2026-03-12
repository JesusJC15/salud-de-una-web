# src/api

Usa esta carpeta para todo lo relacionado con contratos y consumo de APIs.

## Qué debe ir aquí

- Clientes HTTP reutilizables.
- Helpers para construir requests.
- Tipos o mapeos específicos de payloads remotos.
- Adaptadores para convertir respuestas externas al formato interno.
- Funciones de acceso a endpoints externos cuando su foco principal sea la comunicación HTTP.

## Qué no debe ir aquí

- Route handlers de Next.js: esos van en `src/app/api/`.
- Componentes React.
- Estado global de UI.
- Reglas de negocio extensas que ya pertenezcan a una feature.

## Recomendaciones

- Mantén una separación entre cliente base, endpoints y transformadores.
- Centraliza headers, autenticación y manejo común de errores.
- Evita que los componentes hagan `fetch` complejos directamente si pueden delegarlo aquí.
