# Despliegue del Web en AWS — SaludDeUna

## Prerequisito OBLIGATORIO

**El backend debe desplegarse PRIMERO.**
Este deploy lee automáticamente la infraestructura compartida (ALB, ECS cluster, VPC, subnets) desde AWS SSM Parameter Store — sin copiar ni pegar valores.

Si el backend no está desplegado:
```bash
# En salud-de-una-backend:
bash deploy/scripts/00-setup.sh
bash deploy/scripts/01-configure.sh
bash deploy/scripts/02-infra.sh
bash deploy/scripts/03-secrets.sh
bash deploy/scripts/04-build.sh
```

---

## ¿Qué crea este deploy?

Solo lo específico del web (no duplica el ALB ni el cluster):

- **ECR** para la imagen Docker del web Next.js
- **ECS Fargate SPOT** service que se adjunta al target group pre-creado por el backend
- **CodeBuild** que construye la imagen con las `NEXT_PUBLIC_*` vars bakeadas y despliega en ECS
- **SSM** para `JWT_SECRET` del middleware Next.js (server-side)

---

## Flujo completo (primera vez)

```
00-setup → 01-configure (lee SSM automáticamente) → 02-infra → 03-secrets → 04-build → 05-verify
```

### 1. Clonar y preparar

```bash
git clone https://github.com/TU-USER/salud-de-una-web.git
cd salud-de-una-web
chmod +x deploy/scripts/*.sh
```

### 2. Setup CloudShell

```bash
bash deploy/scripts/00-setup.sh
```

### 3. Configurar (lee SSM del backend automáticamente)

```bash
bash deploy/scripts/01-configure.sh
```

Pedirá: URL del repo GitHub del web, datos de Auth0 SPA.
**El ALB, cluster y networking se leen automáticamente desde SSM — no se pide nada.**

### 4. Crear infraestructura web (~3 minutos)

```bash
bash deploy/scripts/02-infra.sh
```

### 5. Configurar secrets

```bash
bash deploy/scripts/03-secrets.sh
```

Pedirá: `JWT_SECRET` (mismo valor que el backend).
Si el token de GitHub ya está en SSM del backend, lo reutiliza automáticamente.

### 6. Build y deploy (~15-20 minutos)

```bash
bash deploy/scripts/04-build.sh
```

CodeBuild: clona el repo → `next build` con NEXT_PUBLIC_* bakeadas → push ECR → deploy ECS.

### 7. Verificar

```bash
bash deploy/scripts/05-verify.sh
```

---

## Variables NEXT_PUBLIC_* — por qué se bakean en build time

Next.js bake las variables `NEXT_PUBLIC_*` en el bundle JavaScript durante el build.
No pueden inyectarse en runtime como variables de entorno del contenedor.

CodeBuild las pasa como `--build-arg` al `docker build`:
- `NEXT_PUBLIC_API_BASE_URL` = `http://ALB_DNS/v1`
- `NEXT_PUBLIC_AUTH0_DOMAIN` = tu tenant Auth0
- `NEXT_PUBLIC_AUTH0_CLIENT_ID` = client ID de la SPA
- `NEXT_PUBLIC_AUTH0_AUDIENCE` = audience de la API
- `NEXT_PUBLIC_AUTH0_REDIRECT_URI` = `http://ALB_DNS/callback`

Si el DNS del ALB cambia (nuevo despliegue), debes hacer un nuevo build del web.

---

## Re-despliegue

```bash
# Opción A: push a main (automático si webhook configurado)
git push origin main

# Opción B: manual
bash deploy/scripts/04-build.sh
```

---

## Troubleshooting

```bash
bash deploy/scripts/fix-errors.sh
```

| Problema | Solución |
|---|---|
| `01-configure.sh` falla con "no se encontro infraestructura" | Backend no desplegado — despliega el backend primero |
| 502 al acceder a la app | Web aún iniciando (~30s) — esperar |
| Imagen muestra URL incorrecta | ALB DNS cambió — rebuild: `04-build.sh` |
| ECS task en STOPPED | JWT_SECRET faltante — `03-secrets.sh` |

---

## Costos adicionales del web

| Recurso | $/mes |
|---|---|
| ECS Fargate SPOT (1 task web) | ~$2-3 |
| ECR web | ~$0.10 |
| CloudWatch Logs web | ~$0.50 |
| CodeBuild web | ~$0.10/build |
| **Total adicional web** | **~$3-4** |

El ALB ya está incluido en el backend. Costo total del stack: ~$27-31/mes.
