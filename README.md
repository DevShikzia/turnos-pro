# Turnos PRO

Sistema integral de gestión de turnos, fila de atención y pantalla pública para consultorios, oficinas y centros de atención al ciudadano.

---

## Enlaces de la aplicación

| Aplicación | Descripción | Enlace |
|------------|-------------|--------|
| **Kiosco Ticket** (Astro) | Pantalla para que el ciudadano ingrese su DNI y obtenga un número de ticket (turno o consulta). | [Abrir Kiosco Ticket →](https://lnkd.in/d5CQQi2E) |
| **Kiosco Fila** (Astro) | Pantalla pública que muestra en tiempo real quién está siendo llamado y en qué ventanilla (para TV o monitor). | [Abrir Pantalla de Llamados →](https://lnkd.in/dCYC3HWA) |
| **Panel** (Angular) | Panel de administración para gestionar clientes, profesionales, servicios, turnos y la fila de atención. | [Abrir Panel →](https://lnkd.in/dpjcE9T9) |

---

## Descripción

**Turnos PRO** es un monorepo con tres partes:

1. **API** (`api/`) — Backend en Node.js + Express + TypeScript. Base de datos MongoDB, autenticación JWT, Socket.io para tiempo real y tareas programadas (cron).
2. **Frontend** (`frontend/`) — Panel web en Angular 18 para el personal: clientes, profesionales, servicios, turnos, fila y ventanillas.
3. **Kiosk** (`kiosk/`) — Sitio estático en Astro: página para sacar ticket por DNI y página para la pantalla de llamados.

Cada carpeta tiene su propio **README** con instalación, configuración y uso:

- [**api/README.md**](api/README.md) — Instalación de la API, variables de entorno, endpoints y arquitectura.
- [**frontend/README.md**](frontend/README.md) — Instalación del panel Angular, rutas y stack.
- [**kiosk/README.md**](kiosk/README.md) — Instalación del kiosco Astro, variables y páginas.

---

## Arquitectura

```
turnos-pro/
├── api/          → Backend (Node.js, Express, TypeScript, MongoDB, Socket.io)
├── frontend/     → Panel de administración (Angular 18, PrimeNG)
└── kiosk/        → Kiosco + pantalla pública (Astro, Tailwind CSS)
```

- La **API** expone REST + WebSockets (Socket.io). El panel y el kiosco consumen la misma API.
- El **Panel** requiere login (JWT). El **Kiosco** y la **Pantalla** son públicos (con API key opcional para el kiosco).

---

## Requisitos

- **Node.js** >= 18  
- **MongoDB** (local o Atlas)  
- **npm** (o yarn/pnpm)

---

## Inicio rápido

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd turnos-pro
```

### 2. API

```bash
cd api
npm install
cp env.example .env
# Editar .env (MONGODB_URI, JWT_SECRET, etc.)
npm run dev
```

Ver [api/README.md](api/README.md) para crear el primer admin y configurar CORS.

### 3. Frontend (panel)

```bash
cd frontend
npm install
# Configurar src/environments/environment.development.ts (apiBaseUrl)
npm start
```

Abrir `http://localhost:4200`. Ver [frontend/README.md](frontend/README.md).

### 4. Kiosk (opcional)

```bash
cd kiosk
npm install
# Crear .env con PUBLIC_API_URL y PUBLIC_LOCATION_ID
npm run dev
```

- Kiosco ticket: `http://localhost:3000/`  
- Pantalla de llamados: `http://localhost:3000/screen`  

Ver [kiosk/README.md](kiosk/README.md) y [kiosk/CONFIGURACION.md](kiosk/CONFIGURACION.md).

---

## Stack tecnológico

| Parte | Tecnologías principales |
|-------|-------------------------|
| **API** | Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io, JWT, Zod, Luxon, node-cron, Pino |
| **Frontend** | Angular 18, PrimeNG, PrimeIcons, RxJS, Socket.io-client, Luxon |
| **Kiosk** | Astro, Tailwind CSS, JavaScript (fetch + Socket.io en el navegador) |

---

## Documentación adicional

- [**RESUMEN-PROYECTO.md**](RESUMEN-PROYECTO.md) — Resumen del proyecto, tecnologías, problemas resueltos y decisiones de diseño (para desarrolladores y no desarrolladores).
- [**api/DEMO.md**](api/DEMO.md) — Modo demo en la API.
- [**api/RENDER.md**](api/RENDER.md) — Despliegue de la API en Render.
- [**frontend/NETLIFY.md**](frontend/NETLIFY.md) — Despliegue del frontend en Netlify.
- [**kiosk/CONFIGURACION.md**](kiosk/CONFIGURACION.md) — Configuración del kiosco (variables, ubicaciones).

---

## Licencia

ISC
