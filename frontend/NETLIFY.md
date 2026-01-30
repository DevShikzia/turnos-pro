# Guía de Deploy en Netlify

Esta guía te ayudará a deployar el frontend de Turnos PRO en Netlify.

## 📋 Requisitos Previos

1. Cuenta en [Netlify](https://www.netlify.com/)
2. Repositorio en GitHub/GitLab/Bitbucket
3. Backend API ya deployado (para obtener la URL)

## 🚀 Pasos para Deployar

### 1. Conectar el Repositorio

1. Ve a [Netlify Dashboard](https://app.netlify.com/)
2. Click en **"Add new site"** → **"Import an existing project"**
3. Conecta tu repositorio (GitHub/GitLab/Bitbucket)
4. Selecciona el repositorio `turnos-pro`

### 2. Configurar el Build

Netlify detectará automáticamente el archivo `netlify.toml`, pero verifica que la configuración sea:

#### Si tu repositorio es un MONOREPO (frontend en subdirectorio):
- **Base directory**: `frontend`
- **Build command**: `npm ci && npm run build:netlify`
- **Publish directory**: `dist/turnos-pro/browser`

**En el `netlify.toml`, asegúrate de tener:**
```toml
[build]
  base = "frontend"
```

#### Si tu repositorio tiene el FRONTEND EN LA RAÍZ:
- **Base directory**: (vacío o no configurado)
- **Build command**: `npm ci && npm run build:netlify`
- **Publish directory**: `dist/turnos-pro/browser`

**En el `netlify.toml`, elimina o comenta la línea `base`:**
```toml
[build]
  # base = "frontend"  # Comentado o eliminado
```

### 3. Configurar Variables de Entorno

En la configuración del sitio en Netlify, ve a **Site settings** → **Environment variables** y agrega:

#### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `API_BASE_URL` | URL completa de tu API backend | `https://api.tudominio.com` |
| `KIOSK_URL` | URL del kiosk (si aplica) | `https://kiosk.tudominio.com` |

#### Variables Opcionales

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `APP_NAME` | Nombre de la aplicación | `Turnos PRO` |
| `REQUEST_TIMEOUT_MS` | Timeout de requests en milisegundos | `30000` |

### 4. Ejemplo de Configuración

```
API_BASE_URL=https://turnos-pro-api.onrender.com
KIOSK_URL=https://turnos-pro-kiosk.netlify.app
APP_NAME=Turnos PRO
REQUEST_TIMEOUT_MS=30000
```

### 5. Deploy

1. Netlify ejecutará automáticamente el build cuando hagas push a la rama principal
2. O puedes hacer click en **"Deploy site"** para un deploy manual
3. El proceso tomará unos minutos

## 🔧 Cómo Funciona

El script `setup-netlify-env.js` se ejecuta antes del build y:

1. Lee las variables de entorno de Netlify
2. Genera el archivo `environment.production.ts` con esos valores
3. Angular compila usando ese archivo

## 🌐 Dominio Personalizado

1. Ve a **Site settings** → **Domain management**
2. Click en **"Add custom domain"**
3. Sigue las instrucciones para configurar DNS

## 🔄 Deploys Automáticos

Netlify automáticamente hace deploy cuando:
- Haces push a la rama `main` (o la rama configurada)
- Haces merge de un Pull Request

Puedes configurar esto en **Site settings** → **Build & deploy** → **Continuous Deployment**.

## 🐛 Troubleshooting

### Error: "Base directory does not exist"

- Si tu repositorio tiene el frontend en la raíz, **elimina o comenta** la línea `base = "frontend"` en `netlify.toml`
- Si tu repositorio es un monorepo, asegúrate de que el directorio `frontend` exista y contenga `package.json`
- Verifica la estructura de tu repositorio antes de configurar el base directory

### Error: "Cannot find module"

- Verifica que el **Base directory** esté configurado correctamente según tu estructura
- Asegúrate de que `package.json` esté en el directorio correcto

### Variables de entorno no funcionan

- Verifica que las variables estén configuradas en **Environment variables**
- Asegúrate de que los nombres sean exactos (case-sensitive)
- Revisa los logs de build para ver qué valores se están usando

### Error 404 en rutas

- Verifica que el archivo `netlify.toml` tenga la configuración de redirects
- Asegúrate de que el **Publish directory** sea `dist/turnos-pro/browser`

### Build falla

- Revisa los logs de build en Netlify
- Verifica que todas las dependencias estén en `package.json`
- Asegúrate de que Node.js version sea compatible (Angular 18 requiere Node 18+)

## 📝 Notas Importantes

- **No subas** `environment.production.ts` al repositorio si contiene valores sensibles
- El archivo se genera automáticamente durante el build
- Las variables de entorno son **case-sensitive**
- Puedes tener diferentes valores para **Production**, **Deploy Preview** y **Branch Deploys**

## 🔐 Seguridad

- Nunca subas archivos `.env` al repositorio
- Usa variables de entorno para valores sensibles
- El archivo `environment.production.ts` generado no contiene información sensible (solo URLs públicas)

## 📚 Recursos

- [Documentación de Netlify](https://docs.netlify.com/)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
