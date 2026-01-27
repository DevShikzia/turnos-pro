# Turnos PRO API

Backend profesional para sistema de gestión de turnos. Construido con Node.js, Express, TypeScript y MongoDB.

## 🚀 Características

- **Autenticación JWT** con roles (admin/staff)
- **CRUD completo** para Clientes, Servicios, Profesionales y Turnos
- **Validación de solapamiento** de turnos por profesional
- **Audit logs** para historial de acciones
- **Logs técnicos** con Pino
- **Validaciones** con Zod
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Arquitectura modular** y escalable

## 📋 Requisitos

- Node.js >= 18
- MongoDB (local o Atlas)
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd api

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp env.example .env

# Editar variables de entorno
# (ver sección de Configuración)
```

## ⚙️ Configuración

Editar el archivo `.env` con tus valores:

```env
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/turnos-pro

# JWT
JWT_SECRET=tu-secret-muy-seguro-de-al-menos-32-caracteres
JWT_EXPIRES_IN=7d

# Setup (para crear primer admin - one-time)
# Después de crear el admin, cambia a false para deshabilitar permanentemente
SETUP_ENABLED=true
SETUP_TOKEN=tu-token-de-setup-seguro

# CORS
CORS_ORIGIN=http://localhost:4200
```

## 🏃 Ejecutar

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm run build
npm start
```

## 📚 Flujo de Uso

### 1. Crear el primer administrador

El sistema requiere crear un administrador inicial. Hay dos formas:

#### Opción A: Endpoint POST /setup/admin (recomendado)

```bash
curl -X POST http://localhost:3000/setup/admin \
  -H "Content-Type: application/json" \
  -H "x-setup-token: tu-token-de-setup-seguro" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPass123!"
  }'
```

**Nota**: Este endpoint solo funciona una vez (si no existe ningún admin).

**⚠️ Seguridad**: Después de crear el primer admin, desactiva el endpoint permanentemente:
```env
SETUP_ENABLED=false
```

#### Opción B: Script CLI

```bash
npm run create-admin
```

### 2. Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "StrongPass123!"
  }'
```

Respuesta:
```json
{
  "data": {
    "user": {
      "id": "...",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 3. Usar el token en requests

```bash
# Guardar token
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Crear un servicio
curl -X POST http://localhost:3000/services \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Corte de cabello",
    "durationMin": 30,
    "price": 1500
  }'

# Crear un profesional
curl -X POST http://localhost:3000/professionals \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Juan Pérez",
    "services": ["<service_id>"]
  }'

# Crear un cliente
curl -X POST http://localhost:3000/clients \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "María García",
    "phone": "+54 11 1234-5678"
  }'

# Crear un turno
curl -X POST http://localhost:3000/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startAt": "2024-01-15T10:00:00Z",
    "clientId": "<client_id>",
    "professionalId": "<professional_id>",
    "serviceId": "<service_id>"
  }'
```

## 📖 Endpoints

### Setup
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/setup/admin` | Crear primer admin | x-setup-token |

### Auth
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/auth/login` | Iniciar sesión | No |
| GET | `/auth/me` | Obtener usuario actual | JWT |

### Users (solo admin)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/users` | Crear usuario | JWT (admin) |
| GET | `/users` | Listar usuarios | JWT (admin) |
| GET | `/users/:id` | Obtener usuario | JWT (admin) |
| PATCH | `/users/:id` | Actualizar usuario | JWT (admin) |
| DELETE | `/users/:id` | Desactivar usuario | JWT (admin) |

### Clients
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/clients` | Crear cliente | JWT |
| GET | `/clients` | Listar clientes | JWT |
| GET | `/clients/:id` | Obtener cliente | JWT |
| PATCH | `/clients/:id` | Actualizar cliente | JWT |
| DELETE | `/clients/:id` | Desactivar cliente | JWT |

### Services
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/services` | Crear servicio | JWT |
| GET | `/services` | Listar servicios | JWT |
| GET | `/services/:id` | Obtener servicio | JWT |
| PATCH | `/services/:id` | Actualizar servicio | JWT |
| DELETE | `/services/:id` | Desactivar servicio | JWT |

### Professionals
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/professionals` | Crear profesional | JWT |
| GET | `/professionals` | Listar profesionales | JWT |
| GET | `/professionals/:id` | Obtener profesional | JWT |
| PATCH | `/professionals/:id` | Actualizar profesional | JWT |
| DELETE | `/professionals/:id` | Desactivar profesional | JWT |

### Appointments
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/appointments` | Crear turno | JWT |
| GET | `/appointments` | Listar turnos | JWT |
| GET | `/appointments/:id` | Obtener turno | JWT |
| PATCH | `/appointments/:id` | Actualizar turno | JWT |
| PATCH | `/appointments/:id/status` | Cambiar estado | JWT |
| DELETE | `/appointments/:id` | Cancelar turno | JWT |

### Filtros de Appointments

```
GET /appointments?professionalId=xxx&dateFrom=2024-01-01T00:00:00Z&dateTo=2024-01-31T23:59:59Z&status=pending
```

## 📝 Formato de Respuestas

### Éxito
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "requestId": "550e8400-e29b-41d4-a716-446655440000",
    "details": { ... }
  }
}
```

## 🔒 Estados de Turnos

| Estado | Descripción |
|--------|-------------|
| `pending` | Turno creado, pendiente de confirmar |
| `confirmed` | Turno confirmado |
| `cancelled` | Turno cancelado |
| `attended` | Cliente asistió |
| `no_show` | Cliente no asistió |

### Transiciones válidas
- `pending` → `confirmed`, `cancelled`
- `confirmed` → `attended`, `no_show`, `cancelled`
- `attended`, `no_show`, `cancelled` → (no hay transiciones)

## 🛡️ Seguridad

- **Helmet**: Headers de seguridad HTTP
- **CORS**: Configuración de origen permitido
- **Rate Limiting**: 
  - General: 100 req/15 min
  - Auth: 10 req/15 min
  - Setup: 5 req/hora
- **JWT**: Tokens con expiración
- **bcrypt**: Hash de contraseñas con salt factor 12
- **Zod**: Validación estricta de inputs

## 📊 Audit Logs

El sistema registra automáticamente:
- Creación/edición/eliminación de entidades
- Cambios de estado de turnos
- Login de usuarios

Los audit logs guardan:
- `actorId`: Usuario que realizó la acción
- `action`: Tipo de acción
- `entity`: Entidad afectada
- `entityId`: ID de la entidad
- `before/after`: Snapshots de datos
- `ip`, `userAgent`, `requestId`: Contexto de la request

## 📁 Estructura del Proyecto

```
api/
├── src/
│   ├── config/
│   │   ├── env.ts              # Variables de entorno (validadas con Zod)
│   │   └── db.ts               # Conexión MongoDB
│   ├── constants/
│   │   ├── roles.ts
│   │   ├── appointment-status.ts
│   │   └── audit-actions.ts
│   ├── types/
│   │   └── common.types.ts     # Tipos compartidos (PaginatedResult, AuditContext)
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── request-id.middleware.ts
│   ├── utils/
│   │   ├── api-error.ts
│   │   ├── async-handler.ts
│   │   ├── logger.ts
│   │   └── pick.ts
│   ├── modules/
│   │   ├── setup/
│   │   │   ├── setup.types.ts
│   │   │   ├── setup.schema.ts
│   │   │   ├── setup.controller.ts
│   │   │   └── setup.routes.ts
│   │   ├── auth/
│   │   │   ├── auth.types.ts
│   │   │   ├── auth.schema.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   │   ├── users.types.ts
│   │   │   ├── users.model.ts
│   │   │   ├── users.schema.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   └── users.routes.ts
│   │   ├── clients/
│   │   │   └── ... (misma estructura)
│   │   ├── services/
│   │   │   └── ...
│   │   ├── professionals/
│   │   │   └── ...
│   │   ├── appointments/
│   │   │   └── ...
│   │   └── audit/
│   │       ├── audit.types.ts
│   │       ├── audit.model.ts
│   │       └── audit.service.ts
│   ├── app.ts
│   └── server.ts
├── scripts/
│   └── create-admin.ts
├── package.json
├── tsconfig.json
└── README.md
```

## 🏗️ Arquitectura: Modular Feature-Based

Este proyecto implementa una **Arquitectura Modular basada en Features** (también conocida como *Vertical Slice Architecture*), combinada con principios de **Clean Architecture** y **Separation of Concerns**.

### ¿Qué es y por qué se eligió?

En lugar de organizar el código por **capas técnicas** (la forma tradicional):

```
❌ Estructura por capas (NO usamos esto)
src/
├── controllers/
│   ├── clientsController.ts
│   ├── servicesController.ts
│   └── appointmentsController.ts
├── services/
│   ├── clientsService.ts
│   └── ...
├── models/
│   └── ...
└── routes/
    └── ...
```

Organizamos por **features/módulos** (dominio de negocio):

```
✅ Estructura modular (la que usamos)
src/modules/
├── clients/
│   ├── clients.types.ts      ← Interfaces y tipos
│   ├── clients.model.ts      ← Schema Mongoose
│   ├── clients.schema.ts     ← Validaciones Zod
│   ├── clients.service.ts    ← Lógica de negocio
│   ├── clients.controller.ts ← Manejo HTTP
│   └── clients.routes.ts     ← Definición de rutas
├── appointments/
│   └── ... (todos los archivos del módulo juntos)
└── ...
```

### Anatomía de un Módulo

Cada módulo contiene **todo lo necesario** para esa feature:

| Archivo | Responsabilidad |
|---------|-----------------|
| `*.types.ts` | **Interfaces y tipos** TypeScript del módulo |
| `*.model.ts` | Schema de Mongoose, configuración del modelo |
| `*.schema.ts` | Validaciones Zod para input (body, query, params) |
| `*.service.ts` | **Lógica de negocio**, queries a DB, reglas |
| `*.controller.ts` | Solo HTTP: recibe request, llama service, envía response |
| `*.routes.ts` | Definición de endpoints y middlewares aplicados |

### Beneficios de esta Arquitectura

#### 1. **Alta Cohesión** 📦
Todo lo relacionado con "clientes" está en `/modules/clients/`. No necesitas saltar entre carpetas para entender una feature.

#### 2. **Bajo Acoplamiento** 🔌
Los módulos son independientes. Cambiar `appointments` no afecta `clients`. Puedes eliminar un módulo completo sin romper otros.

#### 3. **Escalabilidad Horizontal** 📈
Agregar una nueva feature (ej: `payments`) es crear una nueva carpeta con sus archivos. No tocas código existente.

```bash
# Agregar nuevo módulo
mkdir src/modules/payments
touch src/modules/payments/{payments.model,payments.schema,payments.service,payments.controller,payments.routes}.ts
```

#### 4. **Onboarding Rápido** 👋
Un nuevo desarrollador entiende inmediatamente dónde está cada cosa. "¿Dónde está la lógica de turnos?" → `/modules/appointments/`.

#### 5. **Testing Aislado** 🧪
Cada módulo se puede testear de forma independiente. Mock fácil de dependencias.

#### 6. **Preparado para Microservicios** 🚀
Si el proyecto crece, cada módulo puede extraerse a su propio microservicio con cambios mínimos.

### Capas Compartidas

Fuera de `/modules/`, tenemos código compartido:

| Carpeta | Propósito |
|---------|-----------|
| `config/` | Configuración global (env, db) |
| `constants/` | Valores constantes reutilizables |
| `types/` | Tipos compartidos entre módulos |
| `middlewares/` | Middlewares de Express compartidos |
| `utils/` | Utilidades genéricas (logger, errores, helpers) |

### Flujo de una Request

```
Request HTTP
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Middlewares Globales (helmet, cors, requestId, etc.)   │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Router del Módulo (*.routes.ts)                        │
│  - Aplica middlewares específicos (auth, validate)      │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Controller (*.controller.ts)                           │
│  - Extrae datos del request                             │
│  - Llama al service                                     │
│  - Formatea y envía response                            │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Service (*.service.ts)                                 │
│  - Contiene TODA la lógica de negocio                   │
│  - Interactúa con la DB (Model)                         │
│  - Valida reglas de negocio                             │
│  - Registra audit logs                                  │
└─────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Model (*.model.ts)                                     │
│  - Schema Mongoose                                      │
│  - Métodos de instancia/estáticos                       │
│  - Hooks (pre-save, etc.)                               │
└─────────────────────────────────────────────────────────┘
```

### Principios Aplicados

| Principio | Aplicación |
|-----------|------------|
| **Single Responsibility** | Cada archivo tiene una sola responsabilidad |
| **Dependency Inversion** | Controllers dependen de servicios, no de implementaciones |
| **Don't Repeat Yourself** | Middlewares y utils compartidos |
| **Separation of Concerns** | HTTP en controllers, negocio en services, datos en models |
| **Fail Fast** | Validación temprana con Zod antes de llegar al service |

### Comparación con otras Arquitecturas

| Arquitectura | Pros | Contras | ¿Cuándo usar? |
|--------------|------|---------|---------------|
| **Por Capas** | Simple, familiar | Archivos dispersos, difícil escalar | Proyectos pequeños |
| **Modular (esta)** | Escalable, cohesivo, claro | Más archivos iniciales | APIs medianas/grandes |
| **Hexagonal** | Muy desacoplada | Compleja, over-engineering | Sistemas críticos |
| **Microservicios** | Máxima independencia | Complejidad operacional | Equipos grandes |

## 🧪 Testing

```bash
# Ejecutar tests (próximamente)
npm test
```
