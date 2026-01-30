import mongoose, { Schema } from 'mongoose';
import { IClientDocument } from './clients.types.js';

const clientSchema = new Schema<IClientDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'El nombre completo es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    dni: {
      type: String,
      required: [true, 'El DNI es requerido'],
      trim: true,
      unique: true,
      maxlength: [20, 'El DNI no puede exceder 20 caracteres'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'El teléfono no puede exceder 20 caracteres'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    incompleteData: {
      type: Boolean,
      default: false,
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

// Índices (dni ya tiene unique: true en el schema, no duplicar)
clientSchema.index({ fullName: 'text' });
clientSchema.index({ isActive: 1 });
clientSchema.index({ phone: 1 });

export const Client = mongoose.model<IClientDocument>('Client', clientSchema);
