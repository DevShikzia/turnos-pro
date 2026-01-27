# Guía de Despliegue del Kiosco

## Variables de Entorno

### Desarrollo Local

1. Crear archivo `.env` en la raíz del proyecto `kiosk/`:
   ```env
   PUBLIC_API_URL=http://localhost:8080
   PUBLIC_LOCATION_ID=main
   ```

### Producción

Las variables se configuran según el hosting:

#### Vercel
1. Ir a Settings > Environment Variables
2. Agregar:
   - `PUBLIC_API_URL` = `https://api.tudominio.com`
   - `PUBLIC_LOCATION_ID` = `main` (o el ID de tu sucursal)

#### Netlify
1. Ir a Site settings > Environment variables
2. Agregar las mismas variables que en Vercel

#### Servidor Propio (Nginx/Apache)
1. Crear archivo `.env` en la raíz del proyecto
2. O configurar variables de entorno del sistema antes de ejecutar `npm run build`

#### Docker
En `docker-compose.yml`:
```yaml
services:
  kiosk:
    build: ./kiosk
    environment:
      - PUBLIC_API_URL=https://api.tudominio.com
      - PUBLIC_LOCATION_ID=main
```

## ¿Qué es `locationId`?

`locationId` identifica la **ubicación/sucursal** del sistema. Permite:

- **Una sola ubicación**: Usar `main` (default)
- **Múltiples sucursales**: Usar IDs específicos como:
  - `sucursal-centro`
  - `sucursal-norte`
  - `sucursal-sur`

Cada ubicación tiene su propia fila de tickets independiente. Los tickets generados en una ubicación solo se ven en esa ubicación.

## Build y Deploy

```bash
# Build
npm run build

# Los archivos estáticos están en dist/
# Subirlos a tu hosting estático
```
