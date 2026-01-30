# Deploy del Kiosk en Netlify

Guía para publicar el kiosk de Turnos PRO en Netlify.

---

## Build command

En Netlify usa:

```bash
npm ci && npm run build
```

- `npm ci`: instala dependencias desde `package-lock.json`
- `npm run build`: ejecuta `astro build` y genera los archivos en `dist/`

Si configuras desde el Dashboard, en **Build & deploy** → **Build settings** → **Build command** pega exactamente: `npm ci && npm run build`.

---

## Base directory

Depende de cómo esté tu repositorio:

| Estructura del repo | Base directory en Netlify |
|---------------------|---------------------------|
| **Monorepo** (carpeta `kiosk/` dentro del repo) | `kiosk` |
| **Solo kiosk** (el `package.json` está en la raíz) | *(dejar vacío)* |

### Cómo configurarlo

**Opción A – En el archivo `netlify.toml`**

- Si el kiosk está en la carpeta **kiosk/** del repo, descomenta esta línea en `netlify.toml`:
  ```toml
  base = "kiosk"
  ```
- Si el kiosk está en la **raíz** del repo, deja esa línea comentada o bórrala.

**Opción B – En el Dashboard de Netlify**

1. **Site settings** → **Build & deploy** → **Build settings**
2. En **Base directory**:
   - Monorepo: escribe `kiosk`
   - Solo kiosk en raíz: déjalo vacío

---

## Variables de entorno

En Netlify: **Site settings** → **Environment variables** → **Add a variable** (o **Add multiple**).

### Obligatorias

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PUBLIC_API_URL` | URL base de tu API (sin barra final) | `https://turnos-pro-api.onrender.com` |
| `PUBLIC_LOCATION_ID` | ID de la sucursal/ubicación | `main` |

### Opcionales (pantalla de llamados – clima)

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PUBLIC_WEATHER_API_KEY` | API key de OpenWeatherMap | `abc123...` |
| `PUBLIC_WEATHER_CITY` | Ciudad para el clima | `Buenos Aires,AR` |

Si no pones `PUBLIC_WEATHER_API_KEY`, el clima no se muestra en la pantalla de llamados.

---

## Ejemplo de configuración en Netlify

### Solo kiosk (mínimo)

```
PUBLIC_API_URL = https://turnos-pro-api.onrender.com
PUBLIC_LOCATION_ID = main
```

### Con clima en la pantalla de llamados

```
PUBLIC_API_URL = https://turnos-pro-api.onrender.com
PUBLIC_LOCATION_ID = main
PUBLIC_WEATHER_API_KEY = tu_api_key_de_openweathermap
PUBLIC_WEATHER_CITY = Buenos Aires,AR
```

---

## Resumen en Netlify

| Campo | Valor (monorepo) | Valor (repo solo kiosk) |
|-------|------------------|-------------------------|
| **Base directory** | `kiosk` | *(vacío)* |
| **Build command** | `npm ci && npm run build` | `npm ci && npm run build` |
| **Publish directory** | `dist` | `dist` |
| **Variables** | Ver tabla anterior | Ver tabla anterior |

---

## Pasos en Netlify

1. **Add new site** → **Import an existing project** y conecta el repo.
2. En **Build settings**:
   - **Base directory**: `kiosk` o vacío (según tu estructura).
   - **Build command**: `npm ci && npm run build`.
   - **Publish directory**: `dist`.
3. En **Environment variables** agrega al menos `PUBLIC_API_URL` y `PUBLIC_LOCATION_ID`.
4. **Deploy site**.

---

## Errores frecuentes

**"Base directory does not exist: kiosk"**  
→ El repo no tiene carpeta `kiosk/`. Deja **Base directory** vacío o pon el nombre correcto del subdirectorio.

**El kiosk no conecta a la API**  
→ Revisa que `PUBLIC_API_URL` sea la URL pública de tu API (con `https://`, sin barra final) y que CORS en la API permita el dominio de Netlify.

**Clima no aparece en la pantalla**  
→ Configura `PUBLIC_WEATHER_API_KEY` (y opcionalmente `PUBLIC_WEATHER_CITY`). Sin API key, el clima no se muestra.

---

## URLs del kiosk

Tras el deploy tendrás algo como:

- **Kiosk (ingreso DNI)**: `https://tu-sitio.netlify.app/`
- **Pantalla de llamados**: `https://tu-sitio.netlify.app/screen`
