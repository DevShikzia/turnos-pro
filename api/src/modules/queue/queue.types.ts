import { Document, Types } from 'mongoose';
import { z } from 'zod';
import {
  createTicketSchema,
  callTicketSchema,
  assignDeskSchema,
  ticketQuerySchema,
} from './queue.schema.js';

// ============================================
// Entity Interfaces
// ============================================

export type TicketType = 'T' | 'C'; // T = Turno, C = Consulta
export type TicketStatus = 'waiting' | 'called' | 'in_service' | 'done' | 'cancelled' | 'no_show';

export interface IQueueCounter {
  dateKey: string; // "YYYY-MM-DD"
  locationId: string;
  type: TicketType;
  seq: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQueueCounterDocument extends IQueueCounter, Document {}

export interface IQueueTicket {
  dateKey: string; // "YYYY-MM-DD"
  locationId: string;
  type: TicketType;
  code: string; // "T001", "C034"
  seq: number;
  dni: string;
  appointmentId?: Types.ObjectId;
  status: TicketStatus;
  calledAt?: Date;
  deskId?: string; // "VENT-5"
  receptionistId?: Types.ObjectId;
  professionalId?: Types.ObjectId;
  isDemo?: boolean; // true si se creó en modo demo (para limpieza por cron)
  createdAt: Date;
  updatedAt: Date;
}

export interface IQueueTicketDocument extends IQueueTicket, Document {}

export interface IDeskAssignment {
  locationId: string;
  deskId: string; // "VENT-5"
  receptionistId: Types.ObjectId;
  active: boolean;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeskAssignmentDocument extends IDeskAssignment, Document {}

// ============================================
// Input Types
// ============================================

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type CallTicketInput = z.infer<typeof callTicketSchema>;
export type AssignDeskInput = z.infer<typeof assignDeskSchema>;
export type TicketQueryInput = z.infer<typeof ticketQuerySchema>;

// ============================================
// Response Types
// ============================================

export interface TicketDTO {
  _id: string;
  dateKey: string;
  locationId: string;
  type: TicketType;
  code: string;
  seq: number;
  dni: string;
  appointmentId?: string;
  status: TicketStatus;
  calledAt?: string;
  deskId?: string;
  receptionistId?: string;
  professionalId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeskDTO {
  _id: string;
  locationId: string;
  deskId: string;
  receptionistId: string;
  active: boolean;
  lastSeenAt: string;
  createdAt: string;
  updatedAt: string;
}
