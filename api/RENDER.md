# Configuración para Render.com

## Comando de Build

En la configuración del servicio en Render, usa el siguiente comando de build:

```bash
npm ci --include=dev && npm run build
```

O alternativamente:

```bash
npm install && npm run build
```

## Explicación

El problema es que `npm ci` por defecto NO instala `devDependencies` cuando `NODE_ENV=production`. Sin embargo, para compilar TypeScript necesitamos los tipos (`@types/*`) que están en `devDependencies`.

La opción `--include=dev` fuerza la instalación de devDependencies durante el build, lo cual es necesario para compilar el proyecto.

## Variables de Entorno

Asegúrate de configurar las siguientes variables de entorno en Render:

- `NODE_ENV=production`
- `PORT` (Render lo configura automáticamente, pero puedes usar `PORT` en tu código)
- `MONGODB_URI` (tu conexión a MongoDB)
- `JWT_SECRET` (tu secreto JWT)
- `JWT_EXPIRES_IN` (ej: `7d`)
- `CORS_ORIGIN` (origen permitido para CORS)
- `SETUP_ENABLED=false` (después de crear el primer admin)

## Estructura del Proyecto

Si el servicio está configurado en el directorio raíz del repositorio, asegúrate de que:
- **Root Directory**: `/api`
- **Build Command**: `npm ci --include=dev && npm run build`
- **Start Command**: `npm start`
