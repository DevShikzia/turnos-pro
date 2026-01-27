import mongoose, { Schema } from 'mongoose';
import { IHolidayDocument } from './holidays.types.js';

const holidaySchema = new Schema<IHolidayDocument>(
  {
    date: {
      type: String,
      required: [true, 'La fecha es requerida'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'],
    },
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
      maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    },
    description: {
      type: String,
      maxlength: [500, 'La descripción no puede exceder 500 caracteres'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
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
holidaySchema.index({ date: 1 }, { unique: true });
holidaySchema.index({ isActive: 1 });
holidaySchema.index({ isRecurring: 1 });

export const Holiday = mongoose.model<IHolidayDocument>('Holiday', holidaySchema);
