const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, '../src/environments');
const exampleFile = path.join(envDir, 'environment.development.ts.example');
const targetFile = path.join(envDir, 'environment.development.ts');

if (!fs.existsSync(targetFile)) {
  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, targetFile);
    console.log('✅ Archivo environment.development.ts creado');
    console.log('📝 Edita src/environments/environment.development.ts con tu configuración');
  } else {
    console.error('❌ No se encontró environment.development.ts.example');
  }
} else {
  console.log('ℹ️  environment.development.ts ya existe');
}
