const fs = require('fs');
const path = require('path');

/**
 * Script para generar environment.production.ts desde variables de entorno de Netlify
 * Se ejecuta automáticamente durante el build en Netlify
 */

const envDir = path.join(__dirname, '../src/environments');
const targetFile = path.join(envDir, 'environment.production.ts');

// Obtener variables de entorno (Netlify las proporciona durante el build)
const apiBaseUrl = process.env.API_BASE_URL || 'https://api.tudominio.com';
const appName = process.env.APP_NAME || 'Turnos PRO';
const kioskUrl = process.env.KIOSK_URL || 'https://kiosk.tudominio.com';
const requestTimeoutMs = process.env.REQUEST_TIMEOUT_MS || '30000';

// Generar el contenido del archivo
const content = `// Este archivo se genera automáticamente durante el build en Netlify
// No editar manualmente - usa variables de entorno en Netlify

export const environment = {
  production: true,
  apiBaseUrl: '${apiBaseUrl}',
  appName: '${appName}',
  requestTimeoutMs: ${requestTimeoutMs},
  kioskUrl: '${kioskUrl}',
};
`;

// Escribir el archivo
fs.writeFileSync(targetFile, content, 'utf8');

console.log('✅ Archivo environment.production.ts generado desde variables de entorno');
console.log(`   API Base URL: ${apiBaseUrl}`);
console.log(`   App Name: ${appName}`);
console.log(`   Kiosk URL: ${kioskUrl}`);
