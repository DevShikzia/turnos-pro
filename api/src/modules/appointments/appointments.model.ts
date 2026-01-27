import mongoose, { Schema } from 'mongoose';
import { APPOINTMENT_STATUS, ALL_APPOINTMENT_STATUSES } from '../../constants/appointment-status.js';
import { IAppointmentDocument } from './appointments.types.js';

const appointmentSchema = new Schema<IAppointmentDocument>(
  {
    startAt: {
      type: Date,
      required: [true, 'La fecha de inicio es requerida'],
    },
    endAt: {
      type: Date,
      required: [true, 'La fecha de fin es requerida'],
    },
    status: {
      type: String,
      enum: ALL_APPOINTMENT_STATUSES,
      default: APPOINTMENT_STATUS.PENDING,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'El cliente es requerido'],
    },
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El creador es requerido'],
    },
    notes: {
      type: String,
      maxlength: [500, 'Las notas no pueden exceder 500 caracteres'],
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

// Índices compuestos para búsquedas eficientes
appointmentSchema.index({ professionalId: 1, startAt: 1 });
appointmentSchema.index({ clientId: 1, startAt: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ startAt: 1, endAt: 1 });

// Validación: endAt debe ser posterior a startAt
appointmentSchema.pre('save', function (next) {
  if (this.endAt <= this.startAt) {
    const error = new Error('La fecha de fin debe ser posterior a la fecha de inicio');
    return next(error);
  }
  next();
});

export const Appointment = mongoose.model<IAppointmentDocument>('Appointment', appointmentSchema);
