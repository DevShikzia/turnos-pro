# Turnos PRO - Frontend

Panel de administración para el sistema de gestión de turnos profesional.

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
cd frontend
npm install
```

### 2. Configurar entorno

```bash
# Opción A: Usar el script de setup
npm run setup

# Opción B: Copiar manualmente
cp src/environments/environment.development.ts.example src/environments/environment.development.ts
```

Edita `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000', // URL de tu backend
  appName: 'Turnos PRO (Dev)',
  requestTimeoutMs: 30000,
};
```

### 3. Iniciar servidor de desarrollo

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── core/                    # Servicios y configuración global
│   │   ├── config/              # Configuración de la app
│   │   ├── guards/              # Guards de rutas
│   │   ├── http/                # Interceptors HTTP
│   │   ├── layout/              # Componentes de layout
│   │   └── services/            # Servicios core
│   │
│   ├── shared/                  # Componentes y utilidades compartidas
│   │   ├── models/              # Tipos e interfaces
│   │   └── ui/                  # Componentes UI reutilizables
│   │
│   ├── features/                # Módulos de funcionalidades
│   │   ├── auth/                # Login
│   │   ├── setup-admin/         # Configuración inicial
│   │   ├── dashboard/           # Dashboard
│   │   ├── clients/             # CRUD de clientes
│   │   ├── services/            # CRUD de servicios
│   │   ├── professionals/       # CRUD de profesionales
│   │   └── appointments/        # Gestión de turnos
│   │
│   ├── app.component.ts         # Componente raíz
│   └── app.routes.ts            # Configuración de rutas
│
├── environments/                # Configuración por entorno
├── styles/                      # Estilos globales y tema
└── index.html                   # HTML principal
```

---

## 🎨 Theming

Los colores están centralizados en `src/styles/theme.scss`:

```scss
:root {
  --color-primary: #3B82F6;
  --color-primary-hover: #2563EB;
  --color-success: #22C55E;
  --color-danger: #EF4444;
  // ... más variables
}
```

Para cambiar el tema, modifica las variables CSS y todos los componentes se actualizarán automáticamente.

---

## 📱 Rutas de la Aplicación

| Ruta | Descripción | Requiere Auth |
|------|-------------|---------------|
| `/setup` | Configuración del primer admin | ❌ |
| `/login` | Inicio de sesión | ❌ |
| `/dashboard` | Panel principal | ✅ |
| `/clients` | Listado de clientes | ✅ |
| `/clients/new` | Nuevo cliente | ✅ |
| `/clients/:id/edit` | Editar cliente | ✅ |
| `/services` | Listado de servicios | ✅ |
| `/services/new` | Nuevo servicio | ✅ |
| `/professionals` | Listado de profesionales | ✅ |
| `/professionals/new` | Nuevo profesional | ✅ |
| `/appointments` | Listado de turnos | ✅ |
| `/appointments/new` | Nuevo turno | ✅ |

---

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Inicia el servidor de desarrollo |
| `npm run build` | Compila para producción |
| `npm run setup` | Crea archivo de configuración |
| `npm run watch` | Compila en modo watch |

---

## 🛡️ Características de Seguridad

- **Auth Guard**: Protege rutas que requieren autenticación
- **Public Guard**: Redirige usuarios autenticados fuera de login/setup
- **Auth Interceptor**: Agrega token JWT automáticamente
- **Error Interceptor**: Maneja errores de API y muestra toasts

---

## 📦 Stack Tecnológico

- **Angular 18** (Standalone Components)
- **PrimeNG 17** (UI Components)
- **PrimeFlex** (CSS Utilities)
- **PrimeIcons** (Icons)
- **RxJS** (Reactive Programming)

---

## 🎯 Flujo de Uso

1. **Primera vez**: Ir a `/setup` y crear el primer admin
2. **Login**: Ir a `/login` e iniciar sesión
3. **Dashboard**: Ver resumen del día
4. **Configurar**: Crear servicios y profesionales
5. **Clientes**: Agregar clientes
6. **Turnos**: Agendar y gestionar turnos

---

## 🏗️ Arquitectura

El proyecto sigue una **arquitectura feature-based** con los siguientes principios:

- **Standalone Components**: Sin NgModules tradicionales
- **Lazy Loading**: Cada feature se carga bajo demanda
- **Separation of Concerns**: APIs separadas de componentes
- **Single Responsibility**: Cada archivo tiene una responsabilidad clara
- **DRY**: Componentes compartidos reutilizables

---

## 📝 Notas de Desarrollo

- Todos los componentes usan la nueva sintaxis de control flow (`@if`, `@for`)
- Los signals se usan para estado reactivo local
- Las rutas usan lazy loading para mejor performance
- PrimeNG está configurado con un tema personalizado
