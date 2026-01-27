import mongoose, { Schema } from 'mongoose';
import { IAvailabilityDocument } from './availability.types.js';

const timeSlotSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido'],
    },
  },
  { _id: false }
);

const weeklyScheduleSchema = new Schema(
  {
    weekday: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
    slots: [timeSlotSchema],
  },
  { _id: false }
);

const exceptionSchema = new Schema(
  {
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido'],
    },
    isAvailable: {
      type: Boolean,
      required: true,
    },
    slots: [timeSlotSchema],
  },
  { _id: false }
);

const availabilitySchema = new Schema<IAvailabilityDocument>(
  {
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
      required: [true, 'El profesional es requerido'],
    },
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'El servicio es requerido'],
    },
    timezone: {
      type: String,
      required: [true, 'La zona horaria es requerida'],
      default: 'America/Argentina/Buenos_Aires',
    },
    weekly: {
      type: [weeklyScheduleSchema],
      default: [],
    },
    exceptions: {
      type: [exceptionSchema],
      default: [],
    },
    bufferMin: {
      type: Number,
      default: 0,
      min: [0, 'El buffer no puede ser negativo'],
      max: [60, 'El buffer máximo es 60 minutos'],
    },
    durationMin: {
      type: Number,
      required: [true, 'La duración es requerida'],
      default: 30,
      min: [5, 'La duración mínima es 5 minutos'],
      max: [480, 'La duración máxima es 480 minutos (8 horas)'],
    },
    price: {
      type: Number,
      min: [0, 'El precio no puede ser negativo'],
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
// La combinación professionalId + serviceId debe ser única
availabilitySchema.index({ professionalId: 1, serviceId: 1 }, { unique: true });

export const Availability = mongoose.model<IAvailabilityDocument>(
  'Availability',
  availabilitySchema
);
