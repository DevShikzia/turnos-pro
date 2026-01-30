import mongoose, { Schema } from 'mongoose';
import {
  IQueueCounterDocument,
  IQueueTicketDocument,
  IDeskAssignmentDocument,
} from './queue.types.js';

// ============================================
// QueueCounter Model
// ============================================

const queueCounterSchema = new Schema<IQueueCounterDocument>(
  {
    dateKey: {
      type: String,
      required: [true, 'La fecha es requerida'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'],
    },
    locationId: {
      type: String,
      required: [true, 'El locationId es requerido'],
      default: 'main',
    },
    type: {
      type: String,
      required: [true, 'El tipo es requerido'],
      enum: ['T', 'C'],
    },
    seq: {
      type: Number,
      required: [true, 'El secuencial es requerido'],
      min: [0, 'El secuencial no puede ser negativo'],
      default: 0,
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

// Índice único: un contador por fecha, location y tipo
queueCounterSchema.index({ dateKey: 1, locationId: 1, type: 1 }, { unique: true });

export const QueueCounter = mongoose.model<IQueueCounterDocument>(
  'QueueCounter',
  queueCounterSchema
);

// ============================================
// QueueTicket Model
// ============================================

const queueTicketSchema = new Schema<IQueueTicketDocument>(
  {
    dateKey: {
      type: String,
      required: [true, 'La fecha es requerida'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'],
    },
    locationId: {
      type: String,
      required: [true, 'El locationId es requerido'],
      default: 'main',
    },
    type: {
      type: String,
      required: [true, 'El tipo es requerido'],
      enum: ['T', 'C'],
    },
    code: {
      type: String,
      required: [true, 'El código es requerido'],
      match: [/^[TC]\d+$/, 'Formato de código inválido'],
    },
    seq: {
      type: Number,
      required: [true, 'El secuencial es requerido'],
      min: [0, 'El secuencial no puede ser negativo'],
    },
    dni: {
      type: String,
      required: [true, 'El DNI es requerido'],
      trim: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    status: {
      type: String,
      required: [true, 'El estado es requerido'],
      enum: ['waiting', 'called', 'in_service', 'done', 'cancelled', 'no_show'],
      default: 'waiting',
    },
    calledAt: {
      type: Date,
    },
    deskId: {
      type: String,
      trim: true,
    },
    receptionistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    professionalId: {
      type: Schema.Types.ObjectId,
      ref: 'Professional',
    },
    isDemo: {
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

// Índices
queueTicketSchema.index({ dateKey: 1, locationId: 1, status: 1, createdAt: 1 });
queueTicketSchema.index({ dateKey: 1, locationId: 1, code: 1 }, { unique: true });
queueTicketSchema.index({ dateKey: 1, locationId: 1, dni: 1, status: 1 });
queueTicketSchema.index({ appointmentId: 1 });

export const QueueTicket = mongoose.model<IQueueTicketDocument>(
  'QueueTicket',
  queueTicketSchema
);

// ============================================
// DeskAssignment Model
// ============================================

const deskAssignmentSchema = new Schema<IDeskAssignmentDocument>(
  {
    locationId: {
      type: String,
      required: [true, 'El locationId es requerido'],
      default: 'main',
    },
    deskId: {
      type: String,
      required: [true, 'El deskId es requerido'],
      match: [/^VENT-\d+$/, 'Formato de deskId inválido (ej: VENT-5)'],
    },
    receptionistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El receptionistId es requerido'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
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
deskAssignmentSchema.index({ locationId: 1, deskId: 1 }, { unique: true });
deskAssignmentSchema.index({ receptionistId: 1, active: 1 });
deskAssignmentSchema.index({ locationId: 1, active: 1 });

export const DeskAssignment = mongoose.model<IDeskAssignmentDocument>(
  'DeskAssignment',
  deskAssignmentSchema
);
