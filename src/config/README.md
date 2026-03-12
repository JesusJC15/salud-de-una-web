# src/config

Esta carpeta concentra configuración explícita del proyecto.

## Qué debe ir aquí

- Variables y objetos de configuración centralizados.
- Feature flags.
- Configuración de entornos validada.
- Constantes de integración que dependan del entorno.
- Configuración compartida de herramientas internas del código.

## Recomendaciones

- Valida variables de entorno antes de usarlas.
- Evita dispersar strings mágicos de configuración por todo el código.
- Separa configuración pública y privada si la aplicación lo necesita.
- Documenta claramente qué archivo controla cada integración o comportamiento.
