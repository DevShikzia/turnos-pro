import mongoose, { Schema } from 'mongoose';
import { IProfessionalDocument } from './professionals.types.js';

const professionalSchema = new Schema<IProfessionalDocument>(
  {
    fullName: {
      type: String,
      required: [true, 'El nombre del profesional es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email inválido'],
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'El teléfono no puede exceder 20 caracteres'],
    },
    services: [{
      type: Schema.Types.ObjectId,
      ref: 'Service',
    }],
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
professionalSchema.index({ fullName: 'text' });
professionalSchema.index({ isActive: 1 });
professionalSchema.index({ services: 1 });

export const Professional = mongoose.model<IProfessionalDocument>('Professional', professionalSchema);
