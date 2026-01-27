import mongoose, { Schema } from 'mongoose';

/**
 * Distributed lock para cron jobs (evita ejecución duplicada en múltiples instancias)
 */
interface ICronLock {
  key: string;
  expiresAt: Date;
  createdAt: Date;
}

const cronLockSchema = new Schema<ICronLock>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0, // TTL index
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Índice TTL para auto-eliminación
cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CronLockModel = mongoose.model<ICronLock>('CronLock', cronLockSchema);

export class CronLock {
  /**
   * Intenta adquirir un lock distribuido
   * @param key - Clave única del lock
   * @param ttlSeconds - Tiempo de vida en segundos
   * @returns true si adquirió el lock, false si ya existe
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

      // Intentar crear el lock (falla si ya existe)
      await CronLockModel.create({
        key,
        expiresAt,
      });

      return true;
    } catch (error: any) {
      // Si el error es de duplicado, el lock ya existe
      if (error.code === 11000) {
        // Verificar si el lock expiró (por si acaso)
        const existing = await CronLockModel.findOne({ key });
        if (existing && existing.expiresAt < new Date()) {
          // Lock expirado, eliminarlo e intentar de nuevo
          await CronLockModel.deleteOne({ key });
          return this.acquireLock(key, ttlSeconds);
        }
        return false;
      }
      throw error;
    }
  }

  /**
   * Libera un lock
   */
  async releaseLock(key: string): Promise<void> {
    await CronLockModel.deleteOne({ key });
  }

  /**
   * Limpia locks expirados (por si acaso)
   */
  async cleanupExpiredLocks(): Promise<number> {
    const result = await CronLockModel.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    return result.deletedCount || 0;
  }
}
