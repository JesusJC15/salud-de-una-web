# Login - Staff Panel

Componentes de formulario de autenticación utilizados en las páginas de login y registro.

## Qué hay aquí

- `LoginForm.tsx` - Formulario de login completamente funcional para médicos y administradores
  - Validación de email y contraseña
  - Integración con servicio de autenticación
  - Manejo de errores
  - Feedback de carga

## Recomendaciones

- Utiliza el servicio `authService` para todas las operaciones de autenticación
- Los componentes deben estar bajo Client Components (`"use client"`)
- Mantén la validación consistente con el backend
