# 🛠️ lib/

Esta carpeta contiene **lógica compartida de la aplicación y código de infraestructura** que da soporte a múltiples funcionalidades dentro de la app.
Actúa como puente entre la **configuración básica (`config/`)** y la **lógica específica de cada feature (`features/`)**.

---

## 📂 Contenido típico

- **api/** → Configuración del cliente API (wrappers de fetch/axios, lógica base de consultas).
- **auth/** → Helpers de autenticación (login, logout, manejo de tokens, refresco de sesión).
- **errors/** → Manejo global de errores, clases de error, reporting.
- **storage/** → Wrappers para el almacenamiento del navegador (localStorage, sessionStorage).
- **formatters/** → Formateadores relacionados con el dominio (ej. formateador de moneda usado en varias features).

---

## Organización de archivos

- Se prefiere un único archivo por tema (ej. `auth.ts`, `navigation.ts`).

- Si el código crece demasiado, se expande en una subcarpeta con prefijo `_`, manteniendo el archivo principal como punto de entrada:

```path
lib/
├── auth.ts
├── _auth/
│   └── server-actions.ts
└── navigation.ts
```

## 🔑 Lineamientos

- Depende de config/ y utils/, nunca de features/.
  Ejemplo: apiClient.ts puede importar config/env.ts para la URL de la API y utils/object.ts para la serialización.
- Compartido en toda la app.
  Si la lógica solo se usa en una feature (ej. “isPriceInRange”), debe estar en /features/prices/, no aquí.
- Puede incluir infraestructura.
  Clientes HTTP, adaptadores de almacenamiento y manejadores globales de errores pertenecen aquí.
- Orientado al dominio pero lo suficientemente genérico.
  La lógica aquí debe tener sentido en varias partes de la app, no solo en una página/módulo.

## ✅ Ejemplos

Colocación correcta en lib/:

- auth/login.ts → Usa config/env.API_URL y el wrapper de axios para iniciar sesión.
- api/client.ts → Instancia de axios configurada con interceptores.
- errors/AppError.ts → Clase de error personalizada usada en varias features.

Incorrecto (debería ir en otro lugar):

- isPriceInRange(value) → Solo usado en la feature de Precios → pertenece a /features/prices/.
- getInitialsFromPhrase(text) → Genérico → pertenece a /utils/string.ts.
