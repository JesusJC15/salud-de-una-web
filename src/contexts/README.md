# src/contexts

Usa esta carpeta para contextos y providers de React compartidos.

## Qué debe ir aquí

- Definiciones de `createContext`.
- Providers globales o de secciones amplias de la aplicación.
- Hooks auxiliares para consumir contextos de forma segura.
- Estado transversal que realmente necesite React Context.

## Qué evitar

- Guardar aquí toda la lógica de negocio por defecto.
- Crear contextos para estado local que puede resolverse con props o hooks locales.

## Recomendaciones

- Expón un provider y un hook por contexto cuando tenga sentido.
- Lanza errores claros si un hook se usa fuera de su provider.
- Mantén los contextos enfocados y pequeños.
