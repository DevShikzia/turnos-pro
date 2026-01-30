# Modo demo

Configuración para usar Turnos PRO como **demo** (backend en Render, frontends en Netlify) con un usuario y un cliente de prueba fijos.

## Comportamiento

- **DEMO_MODE=true**:
  - No se pueden **crear** nuevos usuarios, clientes ni profesionales.
  - No se pueden **editar ni desactivar** usuarios, clientes ni profesionales (solo consulta).
  - Solo se pueden sacar turnos para el **cliente de prueba** (`DEMO_CLIENT_ID`).
  - **Limpieza cada 10 minutos**: se eliminan todos los turnos y tickets de la fila marcados como demo, para que no se acumulen datos.
- **Kiosk**: no se puede generar más de **un ticket pendiente por DNI por día**. Si ya tiene uno en espera, la API devuelve error y el kiosk muestra: *"Ya tiene un turno pendiente para hoy. Espere a ser atendido antes de solicitar otro."*

## Variables de entorno (API – Render)

En **Render** → tu servicio API → **Environment**:

```env
DEMO_MODE=true
DEMO_USER_ID=<ObjectId del usuario recepcionista de prueba>
DEMO_CLIENT_ID=<ObjectId del cliente de prueba>
```

- **DEMO_USER_ID**: ID del usuario con rol `receptionist` que creaste en la base de datos.
- **DEMO_CLIENT_ID**: ID del cliente de prueba que creaste (opcional para lógica actual; útil si en el futuro quieres restringir turnos solo a ese cliente).

### Cómo obtener los IDs

1. Crear en la base de datos (o desde el panel cuando DEMO_MODE aún está en false):
   - Un **usuario** con rol `receptionist` (ej: `recepcionista@demo.com`).
   - Un **cliente** de prueba (nombre, DNI, etc.).
2. Obtener los `_id` desde MongoDB (Compass, mongosh, o desde algún listado de la API).
3. Pegar esos IDs en `DEMO_USER_ID` y `DEMO_CLIENT_ID` en Render.

## Frontend (Netlify) – opcional

Para mostrar “Modo demo” y el email del usuario de prueba en el login:

En **Netlify** → **Environment variables** (del sitio del frontend):

```env
DEMO_MODE=true
DEMO_USER_EMAIL=recepcionista@demo.com
```

- **DEMO_USER_EMAIL**: solo para mostrar en el banner del login (no se envía contraseña). La contraseña la defines tú al crear el usuario en la DB.

## Cron: limpieza de datos demo

El cron de queue (ya configurado en `queue.cron.ts`) cada día:

1. Borra **tickets con `isDemo: true`** de fechas anteriores a hoy.
2. Luego hace la limpieza habitual (tickets antiguos, desk assignments, etc.).

Así los datos de cola generados en demo no se acumulan.

## Resumen

| Dónde   | Variable          | Uso |
|---------|-------------------|-----|
| API     | `DEMO_MODE`       | Activar restricciones y marcar tickets como demo. |
| API     | `DEMO_USER_ID`    | ID del usuario recepcionista de prueba (creado a mano). |
| API     | `DEMO_CLIENT_ID`  | ID del cliente de prueba (creado a mano). |
| Frontend| `DEMO_MODE`       | Mostrar banner “Modo demo” y aviso en login. |
| Frontend| `DEMO_USER_EMAIL` | Email a mostrar en login (solo informativo). |

Con esto la configuración por defecto puede apuntar a lo que ya tienes en Render/Netlify y la gente puede probar con el usuario y cliente de prueba sin crear más usuarios ni clientes, y sin acumular tickets demo.
