import mongoose, { Schema } from 'mongoose';
import { IServiceDocument } from './services.types.js';

const serviceSchema = new Schema<IServiceDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del servicio es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// Índices
serviceSchema.index({ name: 'text' });
serviceSchema.index({ isActive: 1 });

export const Service = mongoose.model<IServiceDocument>('Service', serviceSchema);
