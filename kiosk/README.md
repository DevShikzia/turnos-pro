# Kiosco de Turnos

Kiosco público para generar tickets de turno o consulta y pantalla pública de llamados.

## Configuración

### Variables de Entorno

1. Copiar `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configurar las variables:
   - `PUBLIC_API_URL`: URL base de la API backend (sin `/api` al final)
     - Desarrollo: `http://localhost:8080`
     - Producción: `https://api.tudominio.com`
   - `PUBLIC_LOCATION_ID`: ID de la ubicación/sucursal
     - `main` para una sola ubicación
     - `sucursal-1`, `sucursal-2`, etc. para múltiples ubicaciones

### En Producción

Las variables de entorno se configuran según el hosting:

- **Vercel/Netlify**: Configurar en el dashboard del proyecto (Settings > Environment Variables)
- **Servidor propio**: Crear archivo `.env` en la raíz del proyecto
- **Docker**: Pasar como variables de entorno en `docker-compose.yml` o `Dockerfile`

**Importante**: Las variables que empiezan con `PUBLIC_` son accesibles desde el cliente (navegador). No poner información sensible aquí.

## Desarrollo

```bash
npm run dev
```

- Kiosco: `http://localhost:3000/`
- Pantalla pública: `http://localhost:3000/screen`

## Build

```bash
npm run build
```

Los archivos estáticos se generan en `dist/` y pueden desplegarse en cualquier hosting estático.

## Páginas

### `/` - Kiosco
Interfaz para que los clientes ingresen su DNI y generen tickets.

### `/screen` - Pantalla Pública
Pantalla para mostrar los llamados en tiempo real (usar en TV/monitor).

## Características

- Interfaz simple y accesible
- Validación de DNI (solo números)
- Detección automática de turnos del día
- Generación de tickets T (Turno) o C (Consulta)
- Pantalla pública con Socket.io en tiempo real
- Diseño responsive
- Tema con CSS variables centralizadas
