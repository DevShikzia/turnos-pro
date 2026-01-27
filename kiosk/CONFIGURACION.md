# Configuración del Kiosco

## Variables de Entorno

### Desarrollo Local

1. **Crear archivo `.env`** en la raíz del proyecto `kiosk/`:
   ```bash
   cp .env.example .env
   ```

2. **Editar `.env`** con tus valores:
   ```env
   PUBLIC_API_URL=http://localhost:8080
   PUBLIC_LOCATION_ID=main
   PUBLIC_WEATHER_API_KEY="tu_api_key_de_openweathermap"
   PUBLIC_WEATHER_CITY="Buenos Aires,AR"
   ```

   **Nota sobre el clima**: Para mostrar el clima, necesitas obtener una API key gratuita de [OpenWeatherMap](https://openweathermap.org/api). Es opcional - si no la configuras, simplemente mostrará "API no configurada". La ciudad se especifica como "Ciudad,País" (ej: "Buenos Aires,AR", "Córdoba,AR").

### Producción

Las variables se configuran **según el hosting**:

#### Vercel
1. Dashboard del proyecto → Settings → Environment Variables
2. Agregar:
   - `PUBLIC_API_URL` = `https://api.tudominio.com`
   - `PUBLIC_LOCATION_ID` = `main`

#### Netlify
1. Site settings → Environment variables
2. Agregar las mismas variables

#### Servidor Propio
1. Crear `.env` en la raíz antes de `npm run build`
2. O configurar variables de entorno del sistema

#### Docker
En `docker-compose.yml`:
```yaml
services:
  kiosk:
    environment:
      - PUBLIC_API_URL=https://api.tudominio.com
      - PUBLIC_LOCATION_ID=main
```

## ¿Qué es `locationId` (main)?

`locationId` identifica la **ubicación/sucursal** del sistema:

- **`main`**: Ubicación principal (default para una sola sucursal)
- **`sucursal-1`**, **`sucursal-2`**, etc.: IDs específicos para múltiples sucursales

**Importante**: Cada ubicación tiene su propia fila de tickets independiente. Los tickets generados en una ubicación solo se ven en esa ubicación.

### Ejemplo Multi-sucursal

Si tienes 3 sucursales:
- Sucursal Centro: `locationId: "centro"`
- Sucursal Norte: `locationId: "norte"`
- Sucursal Sur: `locationId: "sur"`

Cada kiosco debe tener su propio `PUBLIC_LOCATION_ID` configurado.

## Arquitectura

### Astro (Kiosco)
- **`/`**: Pantalla para que clientes ingresen DNI y generen tickets
- **`/screen`**: Pantalla pública de llamados en tiempo real (para TV/monitor)

### Angular (App Administrativa)
- **`/queue`**: Tabla de gestión de fila (solo para recepcionistas/admin)
  - Ver tickets
  - Llamar tickets
  - Marcar estados
  - Asignar ventanillas

## Flujo

1. **Cliente llega** → Usa kiosco Astro (`/`) → Ingresa DNI → Genera ticket T o C
2. **Ticket aparece** en la fila (Angular `/queue`)
3. **Recepcionista** asigna ventanilla y llama ticket
4. **Pantalla pública** (Astro `/screen`) muestra el llamado en tiempo real
5. **Cliente ve** su ticket en la pantalla
