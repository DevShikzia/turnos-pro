/**
 * Script alternativo para crear el primer admin desde la línea de comandos.
 * Uso: npm run create-admin
 * 
 * Se pedirá email y password por consola.
 */

import { config } from 'dotenv';
import mongoose from 'mongoose';
import { createInterface } from 'readline';
import { User } from '../src/modules/users/users.model.js';
import { ROLES } from '../src/constants/roles.js';

config();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('❌ MONGODB_URI no está definido en las variables de entorno');
      process.exit(1);
    }

    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });

    if (existingAdmin) {
      console.log('⚠️  Ya existe un administrador en el sistema:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log('   Este script solo funciona cuando no hay administradores.');
      process.exit(0);
    }

    console.log('\n📝 Crear el primer administrador del sistema\n');

    const email = await question('Email: ');
    const password = await question('Password: ');

    // Validaciones básicas
    if (!email || !email.includes('@')) {
      console.error('❌ Email inválido');
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error('❌ La contraseña debe tener al menos 8 caracteres');
      process.exit(1);
    }

    // Crear admin
    const admin = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash: password,
      role: ROLES.ADMIN,
      isActive: true,
    });

    console.log('\n✅ Administrador creado exitosamente:');
    console.log(`   ID: ${admin._id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    rl.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
